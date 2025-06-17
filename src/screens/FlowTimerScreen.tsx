import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Animated,
    Dimensions,
    TouchableOpacity,
    StatusBar,
    Platform,
} from 'react-native';
import { SessionDots } from '../components/SessionDots';
import { PlayPauseButton } from '../components/PlayPauseButton';
import { usePomodoroStore } from '../store/pomodoroStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAudioPlayer } from "expo-av";
import { Ionicons } from '@expo/vector-icons'
import { FlowMetrics } from '../components/FlowMetrics';
import { FlowIntensityIndicator } from '../components/FlowIntensityIndicator';
import { DynamicBackground } from '../components/DynamicBackground';
import { BreathingAnimation } from '../components/BreathingAnimation';
import { GamificationOverlay } from '../components/GamificationOverlay';
import { FocusMusicPlayer } from '../components/FocusMusicPlayer';
import { TimerDisplay } from '../components/TimerDisplay';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../providers/ThemeProvider';

const { width, height } = Dimensions.get('window');

interface FlowTimerScreenProps {
    navigation?: {
        goBack: () => void;
        navigate: (screen: string) => void;
    };
}

const audioSource = require('../../assets/sounds/smooth-completed-notify-starting-alert.mp3');

const FlowTimerScreen: React.FC<FlowTimerScreenProps> = ({ navigation }) => {
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
    } = usePomodoroStore();
    
    const { timeDuration, breakDuration } = useSettingsStore();
    const player = useAudioPlayer(audioSource);
    const { theme } = useTheme();

    const [showBreathingAnimation, setShowBreathingAnimation] = useState(false);
    const [showMusicPlayer, setShowMusicPlayer] = useState(false);
    const [achievements, setAchievements] = useState<string[]>([]);
    const [showAchievements, setShowAchievements] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const pulseAnimation = useSharedValue(1);
    const progressAnimation = useRef(new Animated.Value(0)).current;
    const containerAnimation = useRef(new Animated.Value(0)).current;
    const achievementAnimation = useSharedValue(0);
    const quickActionsAnimation = useRef(new Animated.Value(0)).current;

    // Initialize container animation
    useEffect(() => {
        Animated.timing(containerAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    }, []);

    // Quick actions animation
    useEffect(() => {
        Animated.timing(quickActionsAnimation, {
            toValue: showQuickActions ? 1 : 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [showQuickActions]);

    // Check for achievements
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
        }
    }, [flowMetrics.consecutiveSessions, flowMetrics.currentStreak, flowMetrics.flowIntensity]);

    // Play sound effect
    const playCompletionSound = async () => {
        try {
            await player.play();
            setTimeout(() => {
                player.pause();
            }, 2000);
            handleTimerComplete();
        } catch (error) {
            console.error('Error playing sound:', error);
            handleTimerComplete();
        }
    };

    // Update timer when duration changes in settings
    useEffect(() => {
        if (!timer.isRunning) {
            updateTimerFromSettings();
        }
    }, [timeDuration]);

    // Timer logic
    useEffect(() => {
        if (timer.isRunning && !timer.isPaused) {
            intervalRef.current = setInterval(() => {
                if (timer.totalSeconds <= 0) {
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

    // Progress animation
    useEffect(() => {
        const progress = 1 - (timer.totalSeconds / timer.initialSeconds);
        Animated.timing(progressAnimation, {
            toValue: progress,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [timer.totalSeconds, timer.initialSeconds]);

    // Pulse animation when running
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

    const handleReset = () => {
        resetTimer();
    };

    const handleShowAchievements = () => {
        setShowAchievements(true);
    };

    const handleCloseAchievements = () => {
        setShowAchievements(false);
    };

    const getSessionDurationText = () => {
        if (timer.adaptedDuration && timer.adaptedDuration !== Math.floor(timer.initialSeconds / 60)) {
            return `${Math.floor(timer.initialSeconds / 60)}m (adapted from ${timer.adaptedDuration}m)`;
        }
        return `${Math.floor(timer.initialSeconds / 60)}m session`;
    };

    const containerOpacity = containerAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    const containerTranslateY = containerAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [50, 0],
    });

    const quickActionsOpacity = quickActionsAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    const quickActionsTranslateY = quickActionsAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [20, 0],
    });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            {/* Dynamic Background */}
            <DynamicBackground 
                isRunning={timer.isRunning}
                isBreak={timer.isBreak}
                flowIntensity={flowMetrics.flowIntensity}
                progress={1 - (timer.totalSeconds / timer.initialSeconds)}
            />

            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: containerOpacity,
                        transform: [{ translateY: containerTranslateY }],
                    },
                ]}
            >
                {/* Enhanced Header with Quick Access */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        onPress={handleShowAchievements} 
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
                        onPress={() => setShowQuickActions(!showQuickActions)}
                        style={[styles.menuButton, { backgroundColor: theme.surface }]}
                    >
                        <Ionicons name="ellipsis-horizontal" size={20} color={theme.accent} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleReset} style={[styles.headerButton, { backgroundColor: theme.surface }]}>
                        <Ionicons name="refresh" size={20} color={theme.accent} />
                    </TouchableOpacity>
                </View>

                {/* Quick Actions Panel */}
                <Animated.View 
                    style={[
                        styles.quickActionsPanel,
                        { backgroundColor: theme.surface },
                        {
                            opacity: quickActionsOpacity,
                            transform: [{ translateY: quickActionsTranslateY }],
                        }
                    ]}
                    pointerEvents={showQuickActions ? 'auto' : 'none'}
                >
                    <TouchableOpacity 
                        style={styles.quickActionItem}
                        onPress={() => {
                            setShowMusicPlayer(true);
                            setShowQuickActions(false);
                        }}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: '#4ECDC4' + '20' }]}>
                            <Ionicons name="musical-notes" size={20} color="#4ECDC4" />
                        </View>
                        <Text style={[styles.quickActionText, { color: theme.text }]}>Focus Music</Text>
                        <Text style={[styles.quickActionSubtext, { color: theme.textSecondary }]}>
                            Ambient sounds
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.quickActionItem}
                        onPress={() => {
                            setShowBreathingAnimation(!showBreathingAnimation);
                            setShowQuickActions(false);
                        }}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: '#48BB78' + '20' }]}>
                            <Ionicons name="leaf" size={20} color="#48BB78" />
                        </View>
                        <Text style={[styles.quickActionText, { color: theme.text }]}>Breathing Guide</Text>
                        <Text style={[styles.quickActionSubtext, { color: theme.textSecondary }]}>
                            {showBreathingAnimation ? 'Active' : 'Inactive'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.quickActionItem}
                        onPress={() => {
                            navigation?.navigate('FlowAnalytics');
                            setShowQuickActions(false);
                        }}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: '#9F7AEA' + '20' }]}>
                            <Ionicons name="analytics" size={20} color="#9F7AEA" />
                        </View>
                        <Text style={[styles.quickActionText, { color: theme.text }]}>Analytics</Text>
                        <Text style={[styles.quickActionSubtext, { color: theme.textSecondary }]}>
                            View insights
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Timer Container */}
                <View style={styles.timerContainer}>
                    <Text style={[styles.flowLabel, { color: theme.text }]}>
                        {timer.isBreak ? 'Break Time' : 'Flow State'}
                    </Text>

                    {/* Session duration info - only show when not running for minimal distraction */}
                    {!timer.isBreak && !timer.isRunning && (
                        <Text style={[styles.sessionInfo, { color: theme.textSecondary }]}>
                            {getSessionDurationText()}
                        </Text>
                    )}

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
                        progress={1 - (timer.totalSeconds / timer.initialSeconds)}
                        isRunning={timer.isRunning}
                        pulseAnimation={pulseAnimation}
                    />

                    {/* Flow Intensity Indicator - minimal when running */}
                    {!timer.isBreak && !timer.isRunning && <FlowIntensityIndicator />}

                    {/* Session Dots - only when not running */}
                    {!timer.isBreak && !timer.isRunning && (
                        <SessionDots
                            currentSession={timer.currentSession}
                            totalSessions={timer.totalSessions}
                        />
                    )}

                    {/* Play/Pause Button */}
                    <PlayPauseButton
                        isRunning={timer.isRunning}
                        isPaused={timer.isPaused}
                        onPress={toggleTimer}
                    />

                    {/* Bottom Action Bar - Always visible for easy access */}
                    <View style={styles.bottomActionBar}>
                        <TouchableOpacity 
                            onPress={() => setShowMusicPlayer(true)}
                            style={[styles.actionBarButton, { backgroundColor: theme.surface }]}
                        >
                            <Ionicons name="musical-notes" size={18} color="#4ECDC4" />
                            <Text style={[styles.actionBarText, { color: theme.textSecondary }]}>Music</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={handleShowAchievements}
                            style={[styles.actionBarButton, { backgroundColor: theme.surface }]}
                        >
                            <Ionicons name="trophy" size={18} color="#FFD700" />
                            <Text style={[styles.actionBarText, { color: theme.textSecondary }]}>Rewards</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={() => setShowBreathingAnimation(!showBreathingAnimation)}
                            style={[styles.actionBarButton, { backgroundColor: theme.surface }]}
                        >
                            <Ionicons 
                                name="leaf" 
                                size={18} 
                                color={showBreathingAnimation ? "#48BB78" : theme.textSecondary} 
                            />
                            <Text style={[styles.actionBarText, { color: theme.textSecondary }]}>Breathe</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>

            {/* Focus Music Player */}
            {showMusicPlayer && (
                <FocusMusicPlayer onClose={() => setShowMusicPlayer(false)} />
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 0 : 20,
        paddingBottom: 10,
        marginBottom: 20,
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
        marginHorizontal: 24,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    quickActionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
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
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
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