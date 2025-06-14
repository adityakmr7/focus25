import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Animated,
    Dimensions,
    StatusBar,
} from 'react-native';
import { SessionDots } from '../components/SessionDots';
import { PlayPauseButton } from '../components/PlayPauseButton';
import { usePomodoroStore } from '../store/pomodoroStore';
import { useSettingsStore } from '../store/settingsStore';

const { width, height } = Dimensions.get('window');

interface FlowTimerScreenProps {
    navigation?: {
        goBack: () => void;
        navigate: (screen: string) => void;
    };
}

const FlowTimerScreen: React.FC<FlowTimerScreenProps> = ({ navigation }) => {
    const {
        timer,
        toggleTimer,
        resetTimer,
        stopTimer,
        handleTimerComplete,
        setTimer,
        updateTimerFromSettings,
    } = usePomodoroStore();

    const { settings } = useSettingsStore();

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const pulseAnimation = useRef(new Animated.Value(1)).current;
    const progressAnimation = useRef(new Animated.Value(0)).current;

    // Update timer when duration changes in settings
    useEffect(() => {
        if (!timer.isRunning) {
            updateTimerFromSettings();
        }
    }, [settings.timeDuration]);

    // Timer logic
    useEffect(() => {
        if (timer.isRunning && !timer.isPaused) {
            intervalRef.current = setInterval(() => {
                if (timer.totalSeconds <= 0) {
                    handleTimerComplete();
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
    }, [timer.isRunning, timer.isPaused, timer.totalSeconds]);

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

    return (
        <SafeAreaView className={"flex-1  bg-bg-100 dark:bg-dark-bg-100"} >
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            <View style={styles.timerContainer}>
                <Text className={"color-text-primary dark:color-dark-text-primary"} style={styles.flowLabel}>Flow</Text>

                <Animated.View
                    style={[
                        styles.timerDisplay,
                        { transform: [{ scale: pulseAnimation }] }
                    ]}
                >
                    <Text className={"text-text-primary dark:text-text-primary"} style={styles.timerText}>
                        {formatTime(timer.minutes, timer.seconds)}
                    </Text>
                </Animated.View>

                <SessionDots
                    currentSession={timer.currentSession}
                    totalSessions={timer.totalSessions}
                />

                <PlayPauseButton
                    isRunning={timer.isRunning}
                    isPaused={timer.isPaused}
                    onPress={toggleTimer}
                />

            </View>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    timerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    flowLabel: {
        fontSize: 24,
        fontWeight: '400',
        marginBottom: 60,
        letterSpacing: 1,
    },
    timerDisplay: {
        marginBottom: 80,
    },
    timerText: {
        fontSize: 80,
        fontWeight: '300',
        fontFamily: 'System',
        letterSpacing: -2,
    },
    actionButton: {
        position: 'absolute',
        right: 40,
        bottom: height * 0.25,
    },
    actionButtonInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#333333',
    },
});

export default FlowTimerScreen;
