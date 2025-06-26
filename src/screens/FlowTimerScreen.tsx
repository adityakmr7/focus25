import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { SessionDots } from '../components/SessionDots';
import { PlayPauseButton } from '../components/PlayPauseButton';
import { usePomodoroStore } from '../store/pomodoroStore';
import { useSettingsStore } from '../store/settingsStore';
import { AudioPlayer, useAudioPlayer } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { BreathingAnimation } from '../components/BreathingAnimation';
import { GamificationOverlay } from '../components/GamificationOverlay';
import { BottomSheetMusicPlayer } from '../components/BottomSheetMusicPlayer';
import { TimerDisplay } from '../components/TimerDisplay';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
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
import MiniAudioPlayer from '../components/MiniAudioPlayer';
import useCachedAudio from '../hooks/useCachedAudio';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MUSIC_SETTINGS_KEY = 'music_settings';
// Types
interface FlowTimerScreenProps {
    navigation?: {
        goBack: () => void;
        navigate: (screen: string) => void;
    };
}

interface HeaderProps {
    theme: any;
    flowMetrics: any;
    onShowAchievements: () => void;
    onToggleQuickActions: () => void;
    onReset: () => void;
    showQuickActions: boolean;
}

interface AuthStatusProps {
    isAuthenticated: boolean;
}

interface QuickActionsPanelProps {
    theme: any;
    showQuickActions: boolean;
    quickActionsAnimation: any;
    onOpenMusicPlayer: () => void;
    onToggleBreathing: () => void;
    showBreathingAnimation: boolean;
}

interface TimerContainerProps {
    theme: any;
    timer: any;
    flowMetrics: any;
    showBreathingAnimation: boolean;
    pulseAnimation: any;
    onToggleTimer: () => void;
    isAuthenticated: boolean;
    handlePlayPause: () => void;
    handleVolumeChange: (delta: number) => void;
    selectedTrackData: any;
    settings: MusicSettings;
    player: AudioPlayer;
    volumeStyle: ViewStyle;
    isPlaying: boolean;
}

// Components
const AuthStatus: React.FC<AuthStatusProps> = ({ isAuthenticated }) => {
    return (
        <View style={styles.centerStatus}>
            {isAuthenticated ? (
                <View style={styles.authStatus}>
                    <Ionicons name="cloud-done" size={16} color="#10B981" />
                    <Text style={[styles.authStatusText, { color: '#10B981' }]}>Synced</Text>
                </View>
            ) : (
                <View style={styles.authStatus}>
                    <Ionicons name="cloud-offline" size={16} color="#F59E0B" />
                    <Text style={[styles.authStatusText, { color: '#F59E0B' }]}>Local Only</Text>
                </View>
            )}
        </View>
    );
};

const Header: React.FC<HeaderProps> = ({
    theme,
    flowMetrics,
    onShowAchievements,
    onToggleQuickActions,
    onReset,
    showQuickActions,
}) => {
    return (
        <View style={styles.header}>
            <TouchableOpacity
                onPress={onShowAchievements}
                style={[styles.headerButton, { backgroundColor: theme.surface }]}
            >
                <Ionicons name="trophy" size={20} color="#FFD700" />
                {flowMetrics.currentStreak > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{flowMetrics.currentStreak}</Text>
                    </View>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                onPress={onToggleQuickActions}
                style={[styles.menuButton, { backgroundColor: theme.surface }]}
            >
                <Ionicons name="ellipsis-horizontal" size={20} color={theme.accent} />
            </TouchableOpacity>

            <TouchableOpacity
                onPress={onReset}
                style={[styles.headerButton, { backgroundColor: theme.surface }]}
            >
                <Ionicons name="refresh" size={20} color={theme.accent} />
            </TouchableOpacity>
        </View>
    );
};

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
    theme,
    showQuickActions,
    quickActionsAnimation,
    onOpenMusicPlayer,
    onToggleBreathing,
    showBreathingAnimation,
}) => {
    const quickActionsAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(quickActionsAnimation.value, [0, 1], [0, 1]),
            transform: [
                {
                    translateY: interpolate(quickActionsAnimation.value, [0, 1], [20, 0]),
                },
            ],
        };
    });

    if (!showQuickActions) return null;

    return (
        <Animated.View
            style={[
                styles.quickActionsPanel,
                { backgroundColor: theme.surface },
                quickActionsAnimatedStyle,
            ]}
            pointerEvents={showQuickActions ? 'auto' : 'none'}
        >
            <TouchableOpacity style={styles.quickActionItem} onPress={onOpenMusicPlayer}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#4ECDC4' + '20' }]}>
                    <Ionicons name="musical-notes" size={20} color="#4ECDC4" />
                </View>
                <Text style={[styles.quickActionText, { color: theme.text }]}>Focus Music</Text>
                <Text style={[styles.quickActionSubtext, { color: theme.textSecondary }]}>
                    Ambient sounds
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionItem} onPress={onToggleBreathing}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#48BB78' + '20' }]}>
                    <Ionicons name="leaf" size={20} color="#48BB78" />
                </View>
                <Text style={[styles.quickActionText, { color: theme.text }]}>Breathing Guide</Text>
                <Text style={[styles.quickActionSubtext, { color: theme.textSecondary }]}>
                    {showBreathingAnimation ? 'Active' : 'Inactive'}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const TimerContainer: React.FC<TimerContainerProps> = ({
    theme,
    timer,
    flowMetrics,
    showBreathingAnimation,
    pulseAnimation,
    onToggleTimer,
    isAuthenticated,
    handlePlayPause,
    handleVolumeChange,
    selectedTrackData,
    settings,
    player,
    volumeStyle,
    isPlaying,
}) => {
    return (
        <View style={styles.timerContainer}>
            <AuthStatus isAuthenticated={isAuthenticated} />

            <Text style={[styles.flowLabel, { color: theme.text }]}>
                {timer.isBreak ? 'Break Time' : 'Flow'}
            </Text>

            {/* Breathing Animation - only when running and enabled */}
            {showBreathingAnimation && timer.isRunning && (
                <View style={styles.breathingContainer}>
                    <BreathingAnimation />
                </View>
            )}

            {/* Timer Display */}
            <TimerDisplay
                minutes={timer.minutes}
                seconds={timer.seconds}
                progress={1 - timer.totalSeconds / timer.initialSeconds}
                isRunning={timer.isRunning}
                pulseAnimation={pulseAnimation}
            />

            {/* Session Dots */}
            <SessionDots
                currentSession={timer.currentSession}
                totalSessions={timer.totalSessions}
            />

            {/* Play/Pause Button */}
            <PlayPauseButton
                isRunning={timer.isRunning}
                isPaused={timer.isPaused}
                onPress={onToggleTimer}
            />

            {/* Mini Audio Player */}
            {player?.isLoaded && (
                <MiniAudioPlayer
                    isPlaying={isPlaying}
                    handlePlayPause={handlePlayPause}
                    handleVolumeChange={handleVolumeChange}
                    selectedTrackData={selectedTrackData}
                    settings={settings}
                    player={player}
                    volumeStyle={volumeStyle}
                />
            )}
        </View>
    );
};

interface MusicSettings {
    volume: number;
    autoPlay: boolean;
    fadeInOut: boolean;
    lastPlayedTrack: string | null;
    favoriteTrackIds: string[];
}

const defaultSettings: MusicSettings = {
    volume: 0.7,
    autoPlay: false,
    fadeInOut: true,
    lastPlayedTrack: null,
    favoriteTrackIds: [],
};
// Main Component
const FlowTimerScreen: React.FC<FlowTimerScreenProps> = ({ navigation }) => {
    // Hooks and State
    const { user, isAuthenticated } = useAuthContext();
    const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const { player, isReady, status, uri, isDownloading, downloadError, downloadProgress } =
        useCachedAudio(
            selectedTrack ? musicTracks.find((t) => t.id === selectedTrack)?.source || null : null,
        );
    const [settings, setSettings] = useState<MusicSettings>(defaultSettings);
    const [showSettings, setShowSettings] = useState(false);
    const [isLoadingTrack, setIsLoadingTrack] = useState(false);
    const alertPlayer = useAudioPlayer(audioSource);
    const { theme } = useTheme();

    const [showBreathingAnimation, setShowBreathingAnimation] = useState(false);
    const [achievements, setAchievements] = useState<string[]>([]);
    const [showAchievements, setShowAchievements] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [backgroundSessionId, setBackgroundSessionId] = useState<string | null>(null);
    const [isConnectedToBackground, setIsConnectedToBackground] = useState(false);

    // Bottom Sheet ref
    const bottomSheetRef = useRef<BottomSheetMethods>(null);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pulseAnimation = useSharedValue(1);
    const progressAnimation = useSharedValue(0);
    const containerAnimation = useSharedValue(0);
    const achievementAnimation = useSharedValue(0);
    const quickActionsAnimation = useSharedValue(0);
    const volumeAnimation = useSharedValue(settings.volume);
    const {
        timer,
        toggleTimer,
        resetTimer,
        stopTimer,
        handleTimerComplete,
        setTimer,
        updateTimerFromSettings,
        startBreak,
        endBreak,
        flowMetrics,
        initializeStore: initializePomodoro,
    } = usePomodoroStore();

    const handlePlayPause = async () => {
        try {
            if (!player || !isReady) {
                Alert.alert('Error', 'Audio player not ready');
                return;
            }

            if (!status?.isLoaded) {
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
            Alert.alert('Playback Error', 'Failed to control playback.');
        }
    };

    const saveSettings = async (newSettings: Partial<MusicSettings>) => {
        try {
            const updatedSettings = { ...settings, ...newSettings };
            setSettings(updatedSettings);
            await AsyncStorage.setItem(MUSIC_SETTINGS_KEY, JSON.stringify(updatedSettings));
        } catch (error) {
            console.error('Failed to save music settings:', error);
        }
    };
    const handleTrackSelection = async (trackId: string) => {
        try {
            // If selecting a different track
            if (selectedTrack !== trackId) {
                // Stop current playback first
                if (isPlaying && player && status?.isLoaded) {
                    await player.pause();
                    setIsPlaying(false);
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
            Alert.alert('Playback Error', 'Failed to play the selected track.');
            setIsLoadingTrack(false);
        }
    };

    const { timeDuration, breakDuration, initializeStore: initializeSettings } = useSettingsStore();

    // Add this useEffect to handle auto-play when track is ready
    useEffect(() => {
        if (
            player &&
            isReady &&
            status?.isLoaded &&
            selectedTrack &&
            settings.autoPlay &&
            !isPlaying &&
            isLoadingTrack
        ) {
            setIsLoadingTrack(false);
            // Set initial volume
            player.volume = settings.volume;
            handlePlayPause();
        } else if (isReady && isLoadingTrack) {
            setIsLoadingTrack(false);
        }
    }, [player, isReady, status?.isLoaded, selectedTrack, settings.autoPlay, isLoadingTrack]);
    // Effects (keeping all existing useEffect hooks)
    useEffect(() => {
        hybridDatabaseService.setAuthState(isAuthenticated, user?.id);
    }, [isAuthenticated, user?.id]);

    useEffect(() => {
        const initializeStores = async () => {
            try {
                await Promise.all([initializeSettings(), initializePomodoro()]);
            } catch (error) {
                console.error('Failed to initialize stores:', error);
            }
        };

        initializeStores();
    }, []);

    useEffect(() => {
        containerAnimation.value = withTiming(1, {
            duration: 1000,
        });
    }, []);

    useEffect(() => {
        quickActionsAnimation.value = withTiming(showQuickActions ? 1 : 0, {
            duration: 300,
        });
    }, [showQuickActions]);

    useEffect(() => {
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

        if (newAchievements.length > 0 && newAchievements.length !== achievements.length) {
            setAchievements(newAchievements);
            setShowAchievements(true);

            newAchievements.forEach((achievement) => {
                notificationService.scheduleGoalAchievement(achievement);
            });
        }
    }, [flowMetrics.consecutiveSessions, flowMetrics.currentStreak, flowMetrics.flowIntensity]);

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

        syncWithBackgroundTimer();
    }, []);

    useEffect(() => {
        if (!timer.isRunning) {
            updateTimerFromSettings();
        }
    }, [timeDuration]);

    useEffect(() => {
        if (timer.isRunning && !timer.isPaused) {
            intervalRef.current = setInterval(async () => {
                if (timer.totalSeconds <= 0) {
                    if (backgroundTimerService.isSupported()) {
                        await backgroundTimerService.stopTimer();
                        setBackgroundSessionId(null);
                        setIsConnectedToBackground(false);
                    }

                    if (timer.isBreak) {
                        endBreak();
                    } else {
                        playCompletionSound();
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
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [timer.isRunning, timer.isPaused, timer.totalSeconds, timer.isBreak]);

    useEffect(() => {
        const progress = 1 - timer.totalSeconds / timer.initialSeconds;
        progressAnimation.value = withTiming(progress, {
            duration: 300,
        });
    }, [timer.totalSeconds, timer.initialSeconds]);

    useEffect(() => {
        if (timer.isRunning && !timer.isPaused) {
            pulseAnimation.value = withTiming(1.05, { duration: 1000 });
            setTimeout(() => {
                pulseAnimation.value = withTiming(1, { duration: 1000 });
            }, 1000);
        } else {
            pulseAnimation.value = withTiming(1, { duration: 300 });
        }
    }, [timer.isRunning, timer.isPaused]);

    // Handler Functions
    const playCompletionSound = async () => {
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
    };

    const handleToggleTimer = async () => {
        try {
            const wasRunning = timer.isRunning;
            toggleTimer();

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
        } catch (error) {
            errorHandler.logError(error as Error, {
                context: 'Timer Toggle',
                severity: 'medium',
            });

            Alert.alert('Timer Error', 'There was an issue with the timer. Please try again.');
        }
    };

    const handleReset = async () => {
        try {
            resetTimer();

            if (backgroundTimerService.isSupported()) {
                await backgroundTimerService.stopTimer();
                setBackgroundSessionId(null);
                setIsConnectedToBackground(false);
            }
        } catch (error) {
            errorHandler.logError(error as Error, {
                context: 'Timer Reset',
                severity: 'low',
            });
        }
    };

    // In FlowTimerScreen component, replace the handleVolumeChange function:
    const handleVolumeChange = async (delta: number) => {
        const newVolume = Math.max(0, Math.min(1, settings.volume + delta));
        await saveSettings({ volume: newVolume });

        // Apply volume to player if available and ready
        if (player && isReady && status?.isLoaded) {
            try {
                player.volume = newVolume;
            } catch (error) {
                console.error('Failed to set volume:', error);
            }
        }
    };

    const handleShowAchievements = () => {
        setShowAchievements(true);
    };

    const handleCloseAchievements = () => {
        setShowAchievements(false);
    };

    const handleToggleQuickActions = () => {
        setShowQuickActions(!showQuickActions);
    };

    const handleOpenMusicPlayer = () => {
        bottomSheetRef.current?.expand();
        setShowQuickActions(false);
    };

    const handleToggleBreathing = () => {
        setShowBreathingAnimation(!showBreathingAnimation);
        setShowQuickActions(false);
    };

    // Animation Styles
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
    const selectedTrackData = musicTracks.find((track) => track.id === selectedTrack);
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView className="flex-1 " contentContainerStyle={{ flex: 1 }}>
                {/*<DynamicBackground*/}
                {/*    isRunning={timer.isRunning}*/}
                {/*    isBreak={timer.isBreak}*/}
                {/*    flowIntensity={flowMetrics.flowIntensity}*/}
                {/*    progress={1 - timer.totalSeconds / timer.initialSeconds}*/}
                {/*/>*/}

                <Animated.View style={[styles.content, containerAnimatedStyle]}>
                    <Header
                        theme={theme}
                        flowMetrics={flowMetrics}
                        onShowAchievements={handleShowAchievements}
                        onToggleQuickActions={handleToggleQuickActions}
                        onReset={handleReset}
                        showQuickActions={showQuickActions}
                    />

                    <QuickActionsPanel
                        theme={theme}
                        showQuickActions={showQuickActions}
                        quickActionsAnimation={quickActionsAnimation}
                        onOpenMusicPlayer={handleOpenMusicPlayer}
                        onToggleBreathing={handleToggleBreathing}
                        showBreathingAnimation={showBreathingAnimation}
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
                    />
                </Animated.View>

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

                <GamificationOverlay
                    flowMetrics={flowMetrics}
                    isVisible={showAchievements}
                    achievements={achievements}
                    animationValue={achievementAnimation}
                    onClose={handleCloseAchievements}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

// Styles remain the same
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingVertical: 28,
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 0 : 20,
        paddingBottom: 10,
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        position: 'relative',
    },
    menuButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    centerStatus: {
        flex: 1,
        alignItems: 'center',
    },
    authStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        gap: 6,
    },
    authStatusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#FF6B6B',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    quickActionsPanel: {
        marginHorizontal: Dimensions.get('screen').width * 0.1,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
        zIndex: 100,
        position: 'absolute',
        top: 80,
        width: Dimensions.get('screen').width * 0.8,
    },
    quickActionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        width: 'auto',
    },
    quickActionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    quickActionText: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    quickActionSubtext: {
        fontSize: 12,
        opacity: 0.7,
    },
    timerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        marginTop: 30,
    },
    flowLabel: {
        fontSize: 24,
        fontWeight: '300',
        marginBottom: 20,
        letterSpacing: 1,
        textAlign: 'center',
    },
    sessionInfo: {
        fontSize: 14,
        marginBottom: 40,
        textAlign: 'center',
        opacity: 0.7,
    },
    breathingContainer: {
        position: 'absolute',
        top: '30%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottomActionBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
        gap: 20,
        paddingHorizontal: 20,
    },
    actionBarButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        minWidth: 70,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    actionBarText: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
    },
});

export default FlowTimerScreen;
