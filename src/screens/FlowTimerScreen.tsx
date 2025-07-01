import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    AppState,
    AppStateStatus,
    Dimensions,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { usePomodoroStore } from '../store/pomodoroStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAudioPlayer } from 'expo-audio';
import { GamificationOverlay } from '../components/GamificationOverlay';
import { BottomSheetMusicPlayer } from '../components/BottomSheetMusicPlayer';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../providers/ThemeProvider';
import { useAuthContext } from '../components/AuthProvider';
import { hybridDatabaseService } from '../data/hybridDatabase';
import { backgroundTimerService } from '../services/backgroundTimer';
import { notificationService } from '../services/notificationService';
import { errorHandler } from '../services/errorHandler';
import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { audioSource, musicTracks } from '../utils/constants';
import useCachedAudio from '../hooks/useCachedAudio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/FlowTimerScreen/Header';
import QuickActionsPanel from '../components/FlowTimerScreen/QuickActionPanel';
import TimerContainer from '../components/FlowTimerScreen/TimerContainer';

const MUSIC_SETTINGS_KEY = 'music_settings';
const TIMER_STATE_KEY = 'timer_state';
const { width: screenWidth } = Dimensions.get('window');

// Enhanced Types
interface FlowTimerScreenProps {
    navigation?: {
        goBack: () => void;
        navigate: (screen: string) => void;
    };
}

interface MusicSettings {
    volume: number;
    autoPlay: boolean;
    fadeInOut: boolean;
    lastPlayedTrack: string | null;
    favoriteTrackIds: string[];
    shuffleMode: boolean;
    repeatMode: 'none' | 'one' | 'all';
}

interface TimerState {
    isInitialized: boolean;
    isLoading: boolean;
    syncStatus: 'idle' | 'syncing' | 'error';
}

const defaultSettings: MusicSettings = {
    volume: 0.7,
    autoPlay: false,
    fadeInOut: true,
    lastPlayedTrack: null,
    favoriteTrackIds: [],
    shuffleMode: false,
    repeatMode: 'none',
};

// Main Component
const FlowTimerScreen: React.FC<FlowTimerScreenProps> = ({ navigation }) => {
    // Hooks and State
    const { user, isAuthenticated } = useAuthContext();
    const { theme } = useTheme();

    // Audio and Music State
    const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [settings, setSettings] = useState<MusicSettings>(defaultSettings);
    const [showSettings, setShowSettings] = useState(false);
    const [isLoadingTrack, setIsLoadingTrack] = useState(false);

    // App State
    const [showBreathingAnimation, setShowBreathingAnimation] = useState(false);
    const [achievements, setAchievements] = useState<string[]>([]);
    const [showAchievements, setShowAchievements] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [backgroundSessionId, setBackgroundSessionId] = useState<string | null>(null);
    const [isConnectedToBackground, setIsConnectedToBackground] = useState(false);
    const [focusModeActive, setFocusModeActive] = useState(false);
    const [timerState, setTimerState] = useState<TimerState>({
        isInitialized: false,
        isLoading: true,
        syncStatus: 'idle',
    });

    // Hooks
    const currentTrackUrl = useMemo(() => {
        if (!selectedTrack) return null;
        return musicTracks.find((t) => t.id === selectedTrack)?.source || null;
    }, [selectedTrack]);

    const { player, isReady, status, uri, isDownloading, downloadError, downloadProgress, usingFallback } =
        useCachedAudio(currentTrackUrl);

    const alertPlayer = useAudioPlayer(audioSource);

    // Store hooks
    const {
        timer,
        toggleTimer,
        resetTimer,
        handleTimerComplete,
        setTimer,
        updateTimerFromSettings,
        flowMetrics,
        initializeStore: initializePomodoro,
    } = usePomodoroStore();

    const { timeDuration, breakDuration, initializeStore: initializeSettings } = useSettingsStore();

    // Refs
    const bottomSheetRef = useRef<BottomSheetMethods>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastSaveTimeRef = useRef<number>(0);
    const appStateRef = useRef<AppStateStatus>('active');

    // Animations
    const pulseAnimation = useSharedValue(1);
    const progressAnimation = useSharedValue(0);
    const containerAnimation = useSharedValue(0);
    const achievementAnimation = useSharedValue(0);
    const quickActionsAnimation = useSharedValue(0);
    const volumeAnimation = useSharedValue(settings.volume);

    // Memoized values
    const selectedTrackData = useMemo(
        () => musicTracks.find((track) => track.id === selectedTrack),
        [selectedTrack],
    );

    const achievementCount = useMemo(() => achievements.length, [achievements]);

    // Load settings from storage
    const loadSettings = useCallback(async () => {
        try {
            const saved = await AsyncStorage.getItem(MUSIC_SETTINGS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setSettings({ ...defaultSettings, ...parsed });

                // Set last played track if available
                if (parsed.lastPlayedTrack) {
                    setSelectedTrack(parsed.lastPlayedTrack);
                }
            }
        } catch (error) {
            console.error('Failed to load music settings:', error);
        }
    }, []);

    // Save settings to storage
    const saveSettings = useCallback(
        async (newSettings: Partial<MusicSettings>) => {
            try {
                const updatedSettings = { ...settings, ...newSettings };
                setSettings(updatedSettings);
                await AsyncStorage.setItem(MUSIC_SETTINGS_KEY, JSON.stringify(updatedSettings));
            } catch (error) {
                console.error('Failed to save music settings:', error);
            }
        },
        [settings],
    );

    // Save timer state
    const saveTimerState = useCallback(async () => {
        try {
            const now = Date.now();
            // Throttle saves to every 5 seconds
            if (now - lastSaveTimeRef.current < 5000) return;

            lastSaveTimeRef.current = now;
            const state = {
                ...timer,
                timestamp: now,
            };
            await AsyncStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save timer state:', error);
        }
    }, [timer]);

    // Audio handlers
    const handlePlayPause = useCallback(async () => {
        try {
            if (!player) {
                Alert.alert('Audio Error', 'Audio player not available. Please try again.');
                return;
            }

            // Check if we're still downloading (but allow fallback streaming)
            if (isDownloading && downloadProgress < 1 && !usingFallback) {
                Alert.alert('Loading...', `Please wait... ${Math.round(downloadProgress * 100)}%`);
                return;
            }

            // Allow playback if player is ready or if we have a URI (even if not fully loaded for streaming)
            if (!isReady && !uri) {
                Alert.alert('Loading...', 'Please wait for the track to load');
                return;
            }

            if (isPlaying) {
                await player.pause();
                setIsPlaying(false);
            } else {
                await player.play();
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Failed to toggle playback:', error);
            Alert.alert('Playback Error', 'Failed to control playback. The track may still be loading.');
        }
    }, [player, isReady, uri, isDownloading, downloadProgress, usingFallback, isPlaying]);

    const handleTrackSelection = useCallback(
        async (trackId: string) => {
            try {
                // If selecting a different track
                if (selectedTrack !== trackId) {
                    // Stop current playback first
                    if (isPlaying && player) {
                        try {
                            await player.pause();
                            setIsPlaying(false);
                        } catch (error) {
                            console.warn('Failed to pause current track:', error);
                        }
                    }

                    // Set loading state and new track
                    setIsLoadingTrack(true);
                    setSelectedTrack(trackId);
                    await saveSettings({ lastPlayedTrack: trackId });
                    return;
                }

                // Toggle play/pause for same track
                await handlePlayPause();
            } catch (error) {
                console.error('Failed to handle track selection:', error);
                Alert.alert('Track Error', 'Failed to play the selected track.');
                setIsLoadingTrack(false);
            }
        },
        [selectedTrack, isPlaying, player, status?.isLoaded, handlePlayPause, saveSettings],
    );

    const handleVolumeChange = useCallback(
        async (delta: number) => {
            const newVolume = Math.max(0, Math.min(1, settings.volume + delta));
            await saveSettings({ volume: newVolume });

            // Apply volume to player if available and ready
            if (player && isReady && status?.isLoaded) {
                try {
                    player.volume = newVolume;
                    volumeAnimation.value = withTiming(newVolume, { duration: 200 });
                } catch (error) {
                    console.error('Failed to set volume:', error);
                }
            }
        },
        [settings.volume, saveSettings, player, isReady, status?.isLoaded, volumeAnimation],
    );

    // Timer handlers
    const playCompletionSound = useCallback(async () => {
        try {
            await alertPlayer.play();
            setTimeout(() => {
                alertPlayer.pause();
            }, 2000);
            await notificationService.scheduleSessionComplete(timer.isBreak);
            handleTimerComplete();
        } catch (error) {
            errorHandler.logError(error as Error, {
                context: 'Audio Playback',
                severity: 'low',
            });
            handleTimerComplete();
        }
    }, [alertPlayer, timer.isBreak, handleTimerComplete]);

    const handleToggleTimer = async () => {
        try {
            const wasRunning = timer.isRunning;
            toggleTimer();

            // Background timer handling
            if (backgroundTimerService.isSupported()) {
                if (!wasRunning) {
                    const sessionId = await backgroundTimerService.startTimer(
                        Math.floor(timer.totalSeconds / 60),
                        timer.isBreak,
                    );
                    setBackgroundSessionId(sessionId);
                    setIsConnectedToBackground(true);
                } else if (timer.isPaused) {
                    await backgroundTimerService.resumeTimer();
                } else {
                    await backgroundTimerService.pauseTimer();
                }
            }

            // Auto-play music if enabled and track is ready
            if (!wasRunning && settings.autoPlay && player && status?.isLoaded && !isPlaying) {
                await handlePlayPause();
            }

            // Trigger pulse animation
            if (!wasRunning) {
                pulseAnimation.value = withSequence(
                    withTiming(1.1, { duration: 200 }),
                    withTiming(1, { duration: 200 }),
                );
            }
        } catch (error) {
            errorHandler.logError(error as Error, {
                context: 'Timer Toggle',
                severity: 'medium',
            });
            Alert.alert('Timer Error', 'There was an issue with the timer. Please try again.');
        }
    };

    const handleReset = useCallback(async () => {
        try {
            resetTimer();

            if (backgroundTimerService.isSupported()) {
                await backgroundTimerService.stopTimer();
                setBackgroundSessionId(null);
                setIsConnectedToBackground(false);
            }

            // Pause music on reset
            if (isPlaying && player && status?.isLoaded) {
                await player.pause();
                setIsPlaying(false);
            }

            // Reset pulse animation
            pulseAnimation.value = withTiming(1, { duration: 300 });
        } catch (error) {
            errorHandler.logError(error as Error, {
                context: 'Timer Reset',
                severity: 'low',
            });
        }
    }, [resetTimer, isPlaying, player, status?.isLoaded, pulseAnimation]);

    // UI handlers
    const handleShowAchievements = useCallback(() => {
        setShowAchievements(true);
        achievementAnimation.value = withSequence(
            withTiming(1, { duration: 300 }),
            withRepeat(withTiming(1.1, { duration: 100 }), 2, true),
        );
    }, [achievementAnimation]);

    const handleCloseAchievements = useCallback(() => {
        setShowAchievements(false);
        achievementAnimation.value = withTiming(0, { duration: 300 });
    }, [achievementAnimation]);

    const handleToggleQuickActions = useCallback(() => {
        setShowQuickActions((prev) => !prev);
    }, []);

    const handleOpenMusicPlayer = useCallback(() => {
        bottomSheetRef.current?.expand();
        setShowQuickActions(false);
    }, []);

    const handleToggleBreathing = useCallback(() => {
        setShowBreathingAnimation((prev) => !prev);
        setShowQuickActions(false);
    }, []);

    const handleToggleFocusMode = useCallback(() => {
        setFocusModeActive((prev) => !prev);
        setShowQuickActions(false);

        // Animate focus mode transition
        containerAnimation.value = withSequence(
            withTiming(0.95, { duration: 200 }),
            withTiming(1, { duration: 200 }),
        );
    }, [containerAnimation]);

    // Sync handler
    const syncData = useCallback(async () => {
        if (!isAuthenticated) return;

        setTimerState((prev) => ({ ...prev, syncStatus: 'syncing' }));
        try {
            await hybridDatabaseService.syncToSupabase();
            setTimerState((prev) => ({ ...prev, syncStatus: 'idle' }));
        } catch (error) {
            console.error('Sync failed:', error);
            setTimerState((prev) => ({ ...prev, syncStatus: 'error' }));
            setTimeout(() => {
                setTimerState((prev) => ({ ...prev, syncStatus: 'idle' }));
            }, 3000);
        }
    }, [isAuthenticated]);

    // Initialization
    useEffect(() => {
        const initializeApp = async () => {
            try {
                setTimerState((prev) => ({ ...prev, isLoading: true }));
                console.log('🚀 Initializing FlowTimer...');

                // Initialize stores
                await Promise.all([initializeSettings(), initializePomodoro(), loadSettings()]);
                
                // Sync timer with loaded settings
                updateTimerFromSettings();
                console.log('🔄 Timer synchronized with settings');

                setTimerState((prev) => ({ ...prev, isInitialized: true }));
                console.log('✅ FlowTimer initialized');

                // Start container animation
                containerAnimation.value = withTiming(1, { duration: 1000 });
            } catch (error) {
                console.error('❌ Failed to initialize FlowTimer:', error);
                Alert.alert(
                    'Initialization Error',
                    'Failed to initialize the timer. Please restart the app.',
                    [{ text: 'OK' }],
                );
            } finally {
                setTimerState((prev) => ({ ...prev, isLoading: false }));
            }
        };

        initializeApp();
    }, [initializeSettings, initializePomodoro, loadSettings, containerAnimation]);

    // Auth state updates
    useEffect(() => {
        try {
            hybridDatabaseService.setAuthState(isAuthenticated, user?.id);
        } catch (error) {
            console.error('Failed to update auth state:', error);
        }
    }, [isAuthenticated, user?.id]);

    // Quick actions animation
    useEffect(() => {
        quickActionsAnimation.value = withTiming(showQuickActions ? 1 : 0, {
            duration: 300,
        });
    }, [showQuickActions, quickActionsAnimation]);

    // Achievement detection
    useEffect(() => {
        if (!timerState.isInitialized) return;

        const newAchievements = [];

        if (flowMetrics.consecutiveSessions >= 5 && flowMetrics.consecutiveSessions % 5 === 0) {
            newAchievements.push('🔥 Flow Master!');
        }
        if (flowMetrics.currentStreak >= 7 && flowMetrics.currentStreak % 7 === 0) {
            newAchievements.push('⭐ Week Warrior!');
        }
        if (flowMetrics.flowIntensity === 'high' && flowMetrics.consecutiveSessions > 0) {
            newAchievements.push('🚀 Deep Focus!');
        }

        if (newAchievements.length > 0 && newAchievements.length !== achievementCount) {
            setAchievements(newAchievements);
            setShowAchievements(true);

            newAchievements.forEach((achievement) => {
                notificationService.scheduleGoalAchievement(achievement);
            });
        }
    }, [
        flowMetrics.consecutiveSessions,
        flowMetrics.currentStreak,
        flowMetrics.flowIntensity,
        achievementCount,
        timerState.isInitialized,
    ]);

    // Background timer sync
    useEffect(() => {
        const syncWithBackgroundTimer = async () => {
            try {
                if (backgroundTimerService.isSupported()) {
                    const backgroundState = await backgroundTimerService.getTimerState();
                    const remainingTime = await backgroundTimerService.getRemainingTime();

                    if (backgroundState && remainingTime > 0) {
                        setIsConnectedToBackground(true);
                        setBackgroundSessionId(backgroundState.sessionId);

                        const minutes = Math.floor(remainingTime / 60);
                        const seconds = remainingTime % 60;

                        setTimer({
                            minutes,
                            seconds,
                            totalSeconds: remainingTime,
                            isRunning: backgroundState.isRunning,
                            isBreak: backgroundState.isBreak,
                        });
                    }
                }
            } catch (error) {
                errorHandler.logError(error as Error, {
                    context: 'Background Timer Sync',
                    severity: 'medium',
                });
            }
        };

        if (timerState.isInitialized) {
            syncWithBackgroundTimer();
        }
    }, [timerState.isInitialized, setTimer]);

    // Timer countdown logic
    useEffect(() => {
        if (!timerState.isInitialized) return;

        if (timer.isRunning && !timer.isPaused) {
            intervalRef.current = setInterval(async () => {
                if (timer.totalSeconds <= 0) {
                    // Timer completed
                    if (backgroundTimerService.isSupported()) {
                        await backgroundTimerService.stopTimer();
                        setBackgroundSessionId(null);
                        setIsConnectedToBackground(false);
                    }

                    // Play completion sound and handle completion
                    await playCompletionSound();
                    return;
                }

                const newTotalSeconds = timer.totalSeconds - 1;
                const minutes = Math.floor(newTotalSeconds / 60);
                const seconds = newTotalSeconds % 60;

                setTimer({
                    minutes,
                    seconds,
                    totalSeconds: newTotalSeconds,
                });

                // Save timer state periodically
                await saveTimerState();
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [
        timer.isRunning,
        timer.isPaused,
        timer.totalSeconds,
        timer.isBreak,
        timerState.isInitialized,
        setTimer,
        saveTimerState,
        playCompletionSound,
    ]);

    // Progress animation
    useEffect(() => {
        if (timer.initialSeconds > 0) {
            const progress = 1 - timer.totalSeconds / timer.initialSeconds;
            progressAnimation.value = withTiming(progress, { duration: 300 });
        }
    }, [timer.totalSeconds, timer.initialSeconds, progressAnimation]);

    // Pulse animation
    useEffect(() => {
        if (timer.isRunning && !timer.isPaused) {
            pulseAnimation.value = withRepeat(
                withSequence(
                    withTiming(1.02, { duration: 1000 }),
                    withTiming(1, { duration: 1000 }),
                ),
                -1,
                false,
            );
        } else {
            pulseAnimation.value = withTiming(1, { duration: 300 });
        }
    }, [timer.isRunning, timer.isPaused, pulseAnimation]);

    // Auto-play when track is ready
    useEffect(() => {
        if (
            player &&
            isReady &&
            status?.isLoaded &&
            selectedTrack &&
            settings.autoPlay &&
            !isPlaying &&
            isLoadingTrack &&
            timer.isRunning
        ) {
            setIsLoadingTrack(false);
            player.volume = settings.volume;
            handlePlayPause();
        } else if (isReady && isLoadingTrack) {
            setIsLoadingTrack(false);
        }
    }, [
        player,
        isReady,
        status?.isLoaded,
        selectedTrack,
        settings.autoPlay,
        settings.volume,
        isPlaying,
        isLoadingTrack,
        timer.isRunning,
        handlePlayPause,
    ]);

    // App state handling
    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (Platform.OS === 'web') return;

            appStateRef.current = nextAppState;

            if (nextAppState === 'background') {
                // App going to background
                saveTimerState();
                if (isAuthenticated) {
                    syncData();
                }
            } else if (nextAppState === 'active') {
                // App coming to foreground
                // Sync with background timer if supported
                if (backgroundTimerService.isSupported() && isConnectedToBackground) {
                    // Re-sync timer state
                }
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [saveTimerState, isAuthenticated, syncData, isConnectedToBackground]);

    // Volume animation
    useEffect(() => {
        volumeAnimation.value = withTiming(settings.volume, { duration: 200 });
    }, [settings.volume, volumeAnimation]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // Animation styles
    const containerAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(containerAnimation.value, [0, 1], [0, 1]),
            transform: [
                {
                    translateY: interpolate(containerAnimation.value, [0, 1], [50, 0]),
                },
            ],
        };
    });

    const volumeStyle = useAnimatedStyle(() => ({
        width: `${volumeAnimation.value * 100}%`,
    }));

    // Loading state
    if (timerState.isLoading || !timerState.isInitialized) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, { color: theme.text }]}>
                        Initializing Flow Timer...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar
                barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={true}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
                contentInsetAdjustmentBehavior="automatic"
            >
                <Animated.View style={[styles.content, containerAnimatedStyle]}>
                    <Header
                        theme={theme}
                        flowMetrics={flowMetrics}
                        onShowAchievements={handleShowAchievements}
                        onToggleQuickActions={handleToggleQuickActions}
                        onReset={handleReset}
                        showQuickActions={showQuickActions}
                        isLoading={timerState.isLoading}
                    />

                    <QuickActionsPanel
                        theme={theme}
                        showQuickActions={showQuickActions}
                        quickActionsAnimation={quickActionsAnimation}
                        onOpenMusicPlayer={handleOpenMusicPlayer}
                        onToggleBreathing={handleToggleBreathing}
                        onToggleFocusMode={handleToggleFocusMode}
                        showBreathingAnimation={showBreathingAnimation}
                        focusModeActive={focusModeActive}
                    />

                    <TimerContainer
                        volumeStyle={volumeStyle}
                        player={player}
                        settings={settings}
                        theme={theme}
                        timer={timer}
                        flowMetrics={flowMetrics}
                        showBreathingAnimation={showBreathingAnimation}
                        pulseAnimation={pulseAnimation}
                        onToggleTimer={handleToggleTimer}
                        isAuthenticated={isAuthenticated}
                        isPlaying={isPlaying}
                        handlePlayPause={handlePlayPause}
                        handleVolumeChange={handleVolumeChange}
                        selectedTrackData={selectedTrackData}
                        isLoading={timerState.isLoading}
                        focusModeActive={focusModeActive}
                    />
                </Animated.View>
            </ScrollView>

            {/* Bottom Sheet Music Player */}
            {!focusModeActive && (
                <BottomSheetMusicPlayer
                    isPlaying={isPlaying}
                    settings={settings}
                    setShowSettings={setShowSettings}
                    showSettings={showSettings}
                    setSettings={setSettings}
                    player={player}
                    downloadProgress={downloadProgress}
                    handleTrackSelection={handleTrackSelection}
                    bottomSheetRef={bottomSheetRef}
                    autoStartTrack={timer.isRunning ? 'deep-focus' : undefined}
                    selectedTrack={selectedTrack}
                    downloadError={downloadError}
                />
            )}

            {/* Gamification Overlay */}
            <GamificationOverlay
                flowMetrics={flowMetrics}
                isVisible={showAchievements}
                achievements={achievements}
                animationValue={achievementAnimation}
                onClose={handleCloseAchievements}
            />
        </SafeAreaView>
    );
};

// Enhanced Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        minHeight: '100%',
        paddingBottom: 20, // Extra space at bottom for better scrolling
    },
    content: {
        flex: 1,
        paddingVertical: 28,
    },
});

export default FlowTimerScreen;
