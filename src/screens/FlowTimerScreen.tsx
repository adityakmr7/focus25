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
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { BottomSheetMusicPlayer } from '../components/BottomSheetMusicPlayer';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useThemeStore } from '../store/themeStore';
import { backgroundTimerService } from '../services/backgroundTimer';
import { notificationService } from '../services/notificationService';
import { errorHandler } from '../services/errorHandler';
import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { audioSource, musicTracks } from '../utils/constants';
import useCachedAudio from '../hooks/useCachedAudio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/FlowTimerScreen/Header';
import TimerContainer from '../components/FlowTimerScreen/TimerContainer';
import { useTheme } from '../hooks/useTheme';

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
    const { mode, getCurrentTheme } = useThemeStore();
    const { theme, isDark } = useTheme();
    // Audio and Music State
    const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [settings, setSettings] = useState<MusicSettings>(defaultSettings);
    const [showSettings, setShowSettings] = useState(false);
    const [isLoadingTrack, setIsLoadingTrack] = useState(false);

    // App State
    const [backgroundSessionId, setBackgroundSessionId] = useState<string | null>(null);
    const [isConnectedToBackground, setIsConnectedToBackground] = useState(false);
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

    const selectedTrackData = useMemo(
        () => musicTracks.find((track) => track.id === selectedTrack),
        [selectedTrack],
    );

    const {
        player,
        isReady,
        status,
        uri,
        isDownloading,
        downloadError,
        downloadProgress,
        usingFallback,
        isLooping,
        currentTime,
        totalPlayTime,
        startLoop,
        stopLoop,
    } = useCachedAudio(currentTrackUrl, selectedTrackData);

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
    const volumeAnimation = useSharedValue(settings.volume);

    // Memoized values - selectedTrackData is now defined above with useCachedAudio

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
                player.pause();
                stopLoop();
                setIsPlaying(false);
            } else {
                player.play();
                startLoop();
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Failed to toggle playback:', error);
            Alert.alert(
                'Playback Error',
                'Failed to control playback. The track may still be loading.',
            );
        }
    }, [
        player,
        isReady,
        uri,
        isDownloading,
        downloadProgress,
        usingFallback,
        isPlaying,
        startLoop,
        stopLoop,
    ]);

    const handleTrackSelection = useCallback(
        async (trackId: string) => {
            try {
                // If selecting a different track
                if (selectedTrack !== trackId) {
                    // Stop current playback first
                    if (isPlaying && player) {
                        try {
                            player.pause();
                            stopLoop();
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
        [
            selectedTrack,
            isPlaying,
            player,
            status?.isLoaded,
            handlePlayPause,
            saveSettings,
            stopLoop,
        ],
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
            // Don't send notification here - this is for foreground completion only
            handleTimerComplete();
        } catch (error) {
            errorHandler.logError(error as Error, {
                context: 'Audio Playback',
                severity: 'low',
            });
            handleTimerComplete();
        }
    }, [alertPlayer, handleTimerComplete]);

    const handleToggleTimer = async () => {
        try {
            const wasRunning = timer.isRunning;
            const wasPaused = timer.isPaused;
            toggleTimer();

            // Background timer handling
            if (backgroundTimerService.isSupported()) {
                if (!wasRunning && !wasPaused) {
                    // Starting timer from stopped state - start background timer and schedule notification
                    const sessionId = await backgroundTimerService.startTimer(
                        Math.floor(timer.totalSeconds / 60),
                        timer.isBreak,
                    );
                    setBackgroundSessionId(sessionId);
                    setIsConnectedToBackground(true);

                    // Schedule completion notification
                    // await notificationService.scheduleTimerCompletion(timer.totalSeconds, timer.isBreak);
                } else if (wasRunning && !wasPaused) {
                    // Timer was running, so user is pausing it
                    await backgroundTimerService.pauseTimer();
                    // Cancel the scheduled notification
                    // await notificationService.cancelTimerNotifications();
                } else if (!wasRunning && wasPaused) {
                    // Timer was paused, so user is resuming it
                    await backgroundTimerService.resumeTimer();
                    // Reschedule notification for remaining time
                    // await notificationService.scheduleTimerCompletion(timer.totalSeconds, timer.isBreak);
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
            // First stop everything
            if (backgroundTimerService.isSupported()) {
                await backgroundTimerService.stopTimer();
                setBackgroundSessionId(null);
                setIsConnectedToBackground(false);
            }

            // Cancel any scheduled notifications
            await notificationService.cancelTimerNotifications();

            // Pause music on reset
            if (isPlaying && player && status?.isLoaded) {
                player.pause();
                stopLoop();
                setIsPlaying(false);
            }

            // Reset timer state
            resetTimer();

            // Force sync with settings to ensure correct state
            updateTimerFromSettings();

            // Reset pulse animation
            pulseAnimation.value = withTiming(1, { duration: 300 });
        } catch (error) {
            errorHandler.logError(error as Error, {
                context: 'Timer Reset',
                severity: 'low',
            });
        }
    }, [
        resetTimer,
        updateTimerFromSettings,
        isPlaying,
        player,
        status?.isLoaded,
        pulseAnimation,
        stopLoop,
    ]);

    const handleOpenMusicPlayer = useCallback(() => {
        bottomSheetRef.current?.expand();
    }, []);

    // Initialization
    useEffect(() => {
        const initializeApp = async () => {
            try {
                setTimerState((prev) => ({ ...prev, isLoading: true }));
                console.log('🚀 Initializing FlowTimer...');

                // Configure audio mode for silent mode playback
                try {
                    await setAudioModeAsync({
                        playsInSilentMode: true,
                        allowsRecording: false,
                        shouldPlayInBackground: true,
                        shouldRouteThroughEarpiece: true,
                        interruptionMode: 'doNotMix',
                    });
                    console.log('🔊 Audio mode configured for silent mode playback');
                } catch (error) {
                    console.error('⚠️ Failed to configure audio mode:', error);
                }

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

                    // Only play completion sound if app is in foreground
                    if (appStateRef.current === 'active') {
                        // Cancel the scheduled notification since we're handling completion in app
                        await notificationService.cancelTimerNotifications();
                        await playCompletionSound();
                    } else {
                        // App is backgrounded, just handle timer completion without sound
                        // Keep the scheduled notification so user gets notified
                        handleTimerComplete();
                    }
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

    // Reset animation when timer stops
    useEffect(() => {
        if (!timer.isRunning || timer.isPaused) {
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
        const handleAppStateChange = async (nextAppState: AppStateStatus) => {
            if (Platform.OS === 'web') return;

            appStateRef.current = nextAppState;

            if (nextAppState === 'background') {
                // App going to background - just save state, don't pause timer
                saveTimerState();
                console.log('📱 App backgrounded - timer continues running');
            } else if (nextAppState === 'active') {
                // App coming to foreground - sync with background timer
                console.log('📱 App foregrounded - syncing timer state');
                if (backgroundTimerService.isSupported() && isConnectedToBackground) {
                    try {
                        const backgroundState = await backgroundTimerService.getTimerState();
                        const remainingTime = await backgroundTimerService.getRemainingTime();

                        if (backgroundState && backgroundState.isRunning && remainingTime > 0) {
                            // Timer is still running - sync with current state
                            const minutes = Math.floor(remainingTime / 60);
                            const seconds = remainingTime % 60;

                            setTimer({
                                minutes,
                                seconds,
                                totalSeconds: remainingTime,
                                isRunning: true,
                                isPaused: false,
                                isBreak: backgroundState.isBreak,
                            });
                            console.log('⏰ Timer synced with background state');
                        } else if (!backgroundState || remainingTime <= 0) {
                            // Timer completed while in background
                            console.log('⏰ Timer completed in background');
                            setIsConnectedToBackground(false);
                            setBackgroundSessionId(null);

                            // Cancel any remaining timer notifications and show completion feedback
                            await notificationService.cancelTimerNotifications();
                            await playCompletionSound();
                        }
                    } catch (error) {
                        console.error('Failed to sync with background timer:', error);
                    }
                }
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [saveTimerState, isConnectedToBackground, setTimer]);

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
                        Initializing Timer...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
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
                        onOpenMusicPlayer={handleOpenMusicPlayer}
                        onReset={handleReset}
                        isLoading={timerState.isLoading}
                    />

                    <TimerContainer
                        volumeStyle={volumeStyle}
                        player={player}
                        settings={settings}
                        theme={theme}
                        timer={timer}
                        flowMetrics={flowMetrics}
                        pulseAnimation={pulseAnimation}
                        onToggleTimer={handleToggleTimer}
                        isAuthenticated={false} // Placeholder, replace with actual auth state
                        isPlaying={isPlaying}
                        handlePlayPause={handlePlayPause}
                        handleVolumeChange={handleVolumeChange}
                        selectedTrackData={selectedTrackData}
                        isLoading={timerState.isLoading}
                        currentTime={currentTime}
                        totalPlayTime={totalPlayTime}
                        isLooping={isLooping}
                    />
                </Animated.View>
            </ScrollView>

            {/* Bottom Sheet Music Player */}
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
        flex: 1,
    },
    content: {
        flex: 1,
        paddingVertical: 28,
    },
});

export default FlowTimerScreen;
