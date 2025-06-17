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
import { useAudioPlayer } from "expo-audio";
import { Ionicons } from '@expo/vector-icons'
import { FlowMetrics } from '../components/FlowMetrics';
import { FlowIntensityIndicator } from '../components/FlowIntensityIndicator';
import { DynamicBackground } from '../components/DynamicBackground';
import { BreathingAnimation } from '../components/BreathingAnimation';
import { GamificationOverlay } from '../components/GamificationOverlay';
import { FocusMusicPlayer } from '../components/FocusMusicPlayer';

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

    const [showBreathingAnimation, setShowBreathingAnimation] = useState(false);
    const [showMusicPlayer, setShowMusicPlayer] = useState(false);
    const [achievements, setAchievements] = useState<string[]>([]);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const pulseAnimation = useRef(new Animated.Value(1)).current;
    const progressAnimation = useRef(new Animated.Value(0)).current;
    const containerAnimation = useRef(new Animated.Value(0)).current;
    const achievementAnimation = useRef(new Animated.Value(0)).current;

    // Initialize container animation
    useEffect(() => {
        Animated.timing(containerAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    }, []);

    // Check for achievements
    useEffect(() => {
        const newAchievements = [];
        
        if (flowMetrics.consecutiveSessions >= 5) {
            newAchievements.push('🔥 Flow Master!');
        }
        if (flowMetrics.currentStreak >= 7) {
            newAchievements.push('⭐ Week Warrior!');
        }
        if (flowMetrics.flowIntensity === 'high') {
            newAchievements.push('🚀 Deep Focus!');
        }
        
        if (newAchievements.length > achievements.length) {
            setAchievements(newAchievements);
            // Animate achievement
            Animated.sequence([
                Animated.timing(achievementAnimation, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.delay(2000),
                Animated.timing(achievementAnimation, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [flowMetrics]);

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
            const pulse = () => {
                Animated.sequence([
                    Animated.timing(pulseAnimation, {
                        toValue: 1.05,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnimation, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    if (timer.isRunning && !timer.isPaused) {
                        pulse();
                    }
                });
            };
            pulse();
        } else {
            Animated.timing(pulseAnimation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [timer.isRunning, timer.isPaused]);

    const formatTime = (minutes: number, seconds: number): string => {
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleReset = () => {
        resetTimer();
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

    return (
        <SafeAreaView className="flex-1 bg-bg-100 dark:bg-dark-bg-100">
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
                    styles.container,
                    {
                        opacity: containerOpacity,
                        transform: [{ translateY: containerTranslateY }],
                    },
                ]}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        onPress={() => setShowMusicPlayer(!showMusicPlayer)}
                        style={styles.headerButton}
                    >
                        <Ionicons name="musical-notes" size={24} color="#48BB78" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        onPress={() => setShowBreathingAnimation(!showBreathingAnimation)}
                        style={styles.headerButton}
                    >
                        <Ionicons name="leaf" size={24} color="#48BB78" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleReset} style={styles.headerButton}>
                        <Ionicons name="refresh" size={24} color="#48BB78" />
                    </TouchableOpacity>
                </View>

                {/* Flow Metrics */}
                <FlowMetrics showDetailed={false} />

                {/* Timer Container */}
                <View style={styles.timerContainer}>
                    <Text className="color-text-primary dark:color-dark-text-primary" style={styles.flowLabel}>
                        {timer.isBreak ? 'Break Time' : 'Flow State'}
                    </Text>

                    {/* Session duration info */}
                    {!timer.isBreak && (
                        <Text className="text-text-secondary dark:text-dark-text-secondary" style={styles.sessionInfo}>
                            {getSessionDurationText()}
                        </Text>
                    )}

                    {/* Breathing Animation */}
                    {showBreathingAnimation && timer.isRunning && (
                        <BreathingAnimation />
                    )}

                    {/* Timer Display */}
                    <Animated.View
                        style={[
                            styles.timerDisplay,
                            { transform: [{ scale: pulseAnimation }] }
                        ]}
                    >
                        <View style={styles.timerCircle}>
                            <Animated.View
                                style={[
                                    styles.progressRing,
                                    {
                                        transform: [{
                                            rotate: progressAnimation.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0deg', '360deg'],
                                            })
                                        }]
                                    }
                                ]}
                            />
                            <Text className="text-text-primary dark:text-text-primary" style={styles.timerText}>
                                {formatTime(timer.minutes, timer.seconds)}
                            </Text>
                        </View>
                    </Animated.View>

                    {/* Flow Intensity Indicator */}
                    {!timer.isBreak && <FlowIntensityIndicator />}

                    {/* Session Dots */}
                    {!timer.isBreak && (
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
                </View>

                {/* Focus Music Player */}
                {showMusicPlayer && (
                    <FocusMusicPlayer onClose={() => setShowMusicPlayer(false)} />
                )}

                {/* Gamification Overlay */}
                <GamificationOverlay
                    flowMetrics={flowMetrics}
                    isVisible={achievements.length > 0}
                    achievements={achievements}
                    animationValue={achievementAnimation}
                />
            </Animated.View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
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
        backgroundColor: 'rgba(72, 187, 120, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    timerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    flowLabel: {
        fontSize: 28,
        fontWeight: '300',
        marginBottom: 20,
        letterSpacing: 2,
        textAlign: 'center',
    },
    sessionInfo: {
        fontSize: 14,
        marginBottom: 40,
        textAlign: 'center',
        opacity: 0.7,
    },
    timerDisplay: {
        marginBottom: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerCircle: {
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.1,
                shadowRadius: 24,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    progressRing: {
        position: 'absolute',
        width: 290,
        height: 290,
        borderRadius: 145,
        borderWidth: 3,
        borderColor: '#48BB78',
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
    },
    timerText: {
        fontSize: 64,
        fontWeight: '200',
        fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
        letterSpacing: -2,
    },
});

export default FlowTimerScreen;