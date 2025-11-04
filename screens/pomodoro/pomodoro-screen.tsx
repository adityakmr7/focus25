import { usePomodoroTimer } from '@/hooks/usePomodoroTimer';
import { useAppLifecycle } from '@/hooks/useAppLifecycle';
import { usePomodoroStore } from '@/stores/pomodoro-store';
import { useSettingsStore } from '@/stores/local-settings-store';
import { useTodoStore } from '@/stores/todo-store';
import BottomSheet from '@gorhom/bottom-sheet';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from 'react-native-heroui';
import { useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import PomodoroControls from './components/pomodoro-controls';
import PomodoroHeader from './components/pomodoro-header';
import PomodoroTimer from './components/pomodoro-timer';
import SessionCounter from './components/session-counter';
import TodoSelectionButton from './components/todo-selection-button';
import TodoSelectionSheet from './components/todo-selection-sheet';

export default function PomodoroScreen() {
    const { theme } = useTheme();

    // Animation values
    const progressValue = useSharedValue(0);
    const buttonScale = useSharedValue(1);

    // Stores
    const {
        currentTodoId,
        currentTodoTitle,
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
    const { loadTodos } = useTodoStore();
    const { focusDuration, breakDuration, soundEffects, notifications } = useSettingsStore();

    // Start the timer interval with sound settings
    usePomodoroTimer(soundEffects);

    // Handle app lifecycle events for background timer support
    useAppLifecycle();

    // Bottom sheet ref
    const bottomSheetRef = useRef<BottomSheet>(null);

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

    const handleOpenBottomSheet = () => {
        bottomSheetRef.current?.expand();
    };

    const handleSelectTodo = (todoId: string | null, todoTitle: string | null) => {
        selectTodo(todoId, todoTitle);
    };

    return (
        <GestureHandlerRootView style={styles.gestureContainer}>
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={styles.content}>
                    <PomodoroHeader />
                    {/* 
                    <TodoSelectionButton
                        selectedTodoTitle={currentTodoTitle}
                        onPress={handleOpenBottomSheet}
                    /> */}

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

                <TodoSelectionSheet
                    ref={bottomSheetRef}
                    onSelectTodo={handleSelectTodo}
                    selectedTodoId={currentTodoId}
                />
            </SafeAreaView>
        </GestureHandlerRootView>
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
