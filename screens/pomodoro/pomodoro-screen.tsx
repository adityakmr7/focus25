import { usePomodoroTimer } from '@/hooks/usePomodoroTimer';
import { useAppLifecycle } from '@/hooks/useAppLifecycle';
import { usePomodoroStore } from '@/stores/pomodoro-store';
import { useSettingsStore } from '@/stores/local-settings-store';
import { useUnifiedTodoStore } from '@/hooks/useUnifiedTodoStore';
import BottomSheet from '@gorhom/bottom-sheet';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import PomodoroControls from './components/pomodoro-controls';
import PomodoroTimer from './components/pomodoro-timer';
import SessionCounter from './components/session-counter';
import HugeIconView from '@/components/ui/huge-icon-view';
import { RefreshIcon } from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/Colors';
import { useColorTheme } from '@/hooks/useColorTheme';
export default function PomodoroScreen() {
    const colors = useColorTheme();

    // Animation values
    const progressValue = useSharedValue(0);
    const buttonScale = useSharedValue(1);

    // Stores
    const {
        currentTodoId,
        selectTodo,
        timerStatus,
        timeLeft,
        initialTime,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        skipSession,
        updateTimerDuration,
    } = usePomodoroStore();
    const { loadTodos } = useUnifiedTodoStore();
    const { focusDuration, breakDuration, soundEffects, notifications } = useSettingsStore();

    // Start the timer interval with sound settings
    usePomodoroTimer(soundEffects);

    // Handle app lifecycle events for background timer support
    useAppLifecycle();

    // Load todos on mount
    useEffect(() => {
        loadTodos();
    }, [loadTodos]);

    // Update timer duration when settings change
    useEffect(() => {
        updateTimerDuration(focusDuration, breakDuration);
    }, [focusDuration, breakDuration, updateTimerDuration]);

    // Update progress animation when time changes
    useEffect(() => {
        const progress = ((initialTime - timeLeft) / initialTime) * 100;
        progressValue.value = withTiming(progress, { duration: 1000 });
    }, [timeLeft, progressValue, initialTime]);

    // Handle play/pause button
    const handlePlayPause = async () => {
        buttonScale.value = withSpring(0.95, {}, () => {
            buttonScale.value = withSpring(1);
        });

        if (timerStatus === 'idle') {
            await startTimer(focusDuration, breakDuration, notifications);
        } else if (timerStatus === 'running') {
            await pauseTimer();
        } else if (timerStatus === 'paused') {
            resumeTimer();
        } else if (timerStatus === 'completed') {
            // Restart after completion
            await startTimer(focusDuration, breakDuration, notifications);
        }
    };

    // Handle reset button
    const handleReset = async () => {
        buttonScale.value = withSpring(0.95, {}, () => {
            buttonScale.value = withSpring(1);
        });

        await resetTimer();
        progressValue.value = withTiming(0, { duration: 500 });
    };

    // Handle skip button
    const handleSkip = () => {
        buttonScale.value = withSpring(0.95, {}, () => {
            buttonScale.value = withSpring(1);
        });

        skipSession(focusDuration, breakDuration);
        progressValue.value = withTiming(0, { duration: 500 });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingTop: 16,
                }}
            >
                <View />
                <Animated.View>
                    <TouchableOpacity onPress={handleReset}>
                        <HugeIconView icon={RefreshIcon} size={24} color={Colors.light.secondary} />
                    </TouchableOpacity>
                </Animated.View>
            </View>
            <View style={styles.content}>
                <PomodoroTimer timeLeft={timeLeft} progressValue={progressValue} />

                <SessionCounter />

                <PomodoroControls
                    onReset={handleReset}
                    onPlayPause={handlePlayPause}
                    onSkip={handleSkip}
                    buttonScale={buttonScale}
                    timerStatus={timerStatus}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    gestureContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
});
