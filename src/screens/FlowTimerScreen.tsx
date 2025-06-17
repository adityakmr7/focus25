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

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const pulseAnimation = useSharedValue(1);
    const progressAnimation = useRef(new Animated.Value(0)).current;
    const containerAnimation = useRef(new Animated.Value(0)).current;
    const achievementAnimation = useSharedValue(0);

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
            
            // Auto hide after 3 seconds
            setTimeout(() => {
                setShowAchievements(false);
            }, 3000);
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
                {/* Minimal Header - Only Reset Button */}
                <View style={styles.header}>
                    <View style={styles.placeholder} />
                    <TouchableOpacity onPress={handleReset} style={[styles.headerButton, { backgroundColor: theme.surface }]}>
                        <Ionicons name="refresh" size={20} color={theme.accent} />
                    </TouchableOpacity>
                </View>

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

                    {/* Minimal Controls - only when not running */}
                    {!timer.isRunning && (
                        <View style={styles.controls}>
                            <TouchableOpacity 
                                onPress={() => setShowBreathingAnimation(!showBreathingAnimation)}
                                style={[styles.controlButton, { backgroundColor: theme.surface }]}
                            >
                                <Ionicons 
                                    name="leaf" 
                                    size={16} 
                                    color={showBreathingAnimation ? theme.accent : theme.textSecondary} 
                                />
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                onPress={() => setShowMusicPlayer(true)}
                                style={[styles.controlButton, { backgroundColor: theme.surface }]}
                            >
                                <Ionicons 
                                    name="musical-notes" 
                                    size={16} 
                                    color={theme.textSecondary} 
                                />
                            </TouchableOpacity>
                        </View>
                    )}
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
    placeholder: {
        width: 40,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
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
    controls: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 40,
    },
    controlButton: {
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
});

export default FlowTimerScreen;