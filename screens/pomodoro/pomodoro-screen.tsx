import { usePomodoroTimer } from '@/hooks/usePomodoroTimer';
import { useAppLifecycle } from '@/hooks/useAppLifecycle';
import { usePomodoroStore } from '@/stores/pomodoro-store';
import { useSettingsStore } from '@/stores/local-settings-store';
import { useUnifiedTodoStore } from '@/hooks/useUnifiedTodoStore';
import BottomSheet from '@gorhom/bottom-sheet';
import React, { useEffect, useRef, useCallback, useMemo } from 'react';
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

function PomodoroScreen() {
    const colors = useColorTheme();

    // Animation values - memoized to prevent recreation
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

    // Load todos on mount - memoized to prevent re-creation
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

    // Memoize handlers to prevent child re-renders
    const handlePlayPause = useCallback(async () => {
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
    }, [timerStatus, focusDuration, breakDuration, notifications, startTimer, pauseTimer, resumeTimer, buttonScale]);

    const handleReset = useCallback(async () => {
        buttonScale.value = withSpring(0.95, {}, () => {
            buttonScale.value = withSpring(1);
        });

        await resetTimer();
        progressValue.value = withTiming(0, { duration: 500 });
    }, [resetTimer, buttonScale, progressValue]);

    const handleSkip = useCallback(() => {
        buttonScale.value = withSpring(0.95, {}, () => {
            buttonScale.value = withSpring(1);
        });

        skipSession(focusDuration, breakDuration);
        progressValue.value = withTiming(0, { duration: 500 });
    }, [skipSession, focusDuration, breakDuration, buttonScale, progressValue]);

    // Memoize container style
    const containerStyle = useMemo(() => [
        styles.container,
        { backgroundColor: colors.backgroundPrimary }
    ], [colors.backgroundPrimary]);

    return (
        <SafeAreaView style={containerStyle}>
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

// Memoize the component to prevent unnecessary re-renders
export default React.memo(PomodoroScreen);

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
