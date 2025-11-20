import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { usePomodoroStore } from '@/stores/pomodoro-store';
import { useSettingsStore } from '@/stores/local-settings-store';
import { useAuthStore } from '@/stores/auth-store';
import { backgroundMetronomeService } from '@/services/background-metronome-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TIMER_STATE_KEY = 'pomodoro_timer_state';

interface TimerState {
    timerStatus: 'idle' | 'running' | 'paused' | 'completed';
    timerPhase: 'focus' | 'shortBreak' | 'longBreak';
    timeLeft: number;
    initialTime: number;
    sessionStartTime: string | null;
    backgroundTime: string | null; // When app went to background
    currentSession: number;
    totalSessions: number;
    currentTodoId: string | null;
    currentTodoTitle: string | null;
}

/**
 * Hook to handle app lifecycle events and timer state persistence
 * Saves timer state when app goes to background and restores it when returning
 */
export function useAppLifecycle() {
    const appState = useRef(AppState.currentState);
    const {
        timerStatus,
        timerPhase,
        timeLeft,
        initialTime,
        sessionStartTime,
        currentSession,
        totalSessions,
        currentTodoId,
        currentTodoTitle,
        tick,
        completeTimer,
        completeBreak,
        pauseTimer,
        resumeTimer,
    } = usePomodoroStore();

    const { focusDuration, breakDuration, soundEffects, notifications, metronome } =
        useSettingsStore();
    const { refreshProStatus, isProUser } = useAuthStore();

    // Save timer state to AsyncStorage
    const saveTimerState = useCallback(async () => {
        try {
            const timerState: TimerState = {
                timerStatus,
                timerPhase,
                timeLeft,
                initialTime,
                sessionStartTime: sessionStartTime?.toISOString() || null,
                backgroundTime: new Date().toISOString(),
                currentSession,
                totalSessions,
                currentTodoId,
                currentTodoTitle,
            };

            await AsyncStorage.setItem(TIMER_STATE_KEY, JSON.stringify(timerState));
            console.log('Timer state saved to background:', timerState);

            // Start background metronome if enabled and timer is running
            if (timerStatus === 'running' && metronome && soundEffects) {
                await backgroundMetronomeService.startBackgroundMetronome(
                    true,
                    timerPhase,
                    1, // 1 second interval
                );
            } else {
                // Stop background metronome if not running or disabled
                await backgroundMetronomeService.stopBackgroundMetronome();
            }
        } catch (error) {
            console.error('Failed to save timer state:', error);
        }
    }, [
        timerStatus,
        timerPhase,
        timeLeft,
        initialTime,
        sessionStartTime,
        currentSession,
        totalSessions,
        currentTodoId,
        currentTodoTitle,
        metronome,
        soundEffects,
    ]);

    // Load and restore timer state from AsyncStorage
    const restoreTimerState = useCallback(async () => {
        try {
            const savedState = await AsyncStorage.getItem(TIMER_STATE_KEY);
            if (!savedState) return;

            const timerState: TimerState = JSON.parse(savedState);

            // Only restore if timer was running when app went to background
            if (timerState.timerStatus !== 'running' || !timerState.backgroundTime) {
                await AsyncStorage.removeItem(TIMER_STATE_KEY);
                return;
            }

            const backgroundTime = new Date(timerState.backgroundTime);
            const currentTime = new Date();
            const timeInBackground = Math.floor(
                (currentTime.getTime() - backgroundTime.getTime()) / 1000,
            );

            // Calculate remaining time after background period
            const remainingTime = Math.max(0, timerState.timeLeft - timeInBackground);

            console.log('Restoring timer state:', {
                originalTimeLeft: timerState.timeLeft,
                timeInBackground,
                remainingTime,
                timerPhase: timerState.timerPhase,
            });

            // If timer should have completed while in background
            if (remainingTime <= 0) {
                console.log('Timer completed while in background');

                // Complete the timer
                if (timerState.timerPhase === 'focus') {
                    await completeTimer(soundEffects, focusDuration, breakDuration, notifications);
                } else if (
                    timerState.timerPhase === 'shortBreak' ||
                    timerState.timerPhase === 'longBreak'
                ) {
                    await completeBreak(focusDuration, breakDuration);
                }
            } else {
                // Restore timer with remaining time
                usePomodoroStore.setState({
                    timerStatus: 'running',
                    timerPhase: timerState.timerPhase,
                    timeLeft: remainingTime,
                    initialTime: timerState.initialTime,
                    sessionStartTime: timerState.sessionStartTime
                        ? new Date(timerState.sessionStartTime)
                        : null,
                    currentSession: timerState.currentSession,
                    totalSessions: timerState.totalSessions,
                    currentTodoId: timerState.currentTodoId,
                    currentTodoTitle: timerState.currentTodoTitle,
                });

                console.log('Timer restored with remaining time:', remainingTime, 'seconds');
            }

            // Clear saved state
            await AsyncStorage.removeItem(TIMER_STATE_KEY);

            // Stop background metronome when returning to foreground
            await backgroundMetronomeService.stopBackgroundMetronome();
        } catch (error) {
            console.error('Failed to restore timer state:', error);
        }
    }, [completeTimer, completeBreak, soundEffects, focusDuration, breakDuration, notifications]);

    useEffect(() => {
        const handleAppStateChange = async (nextAppState: AppStateStatus) => {
            console.log('App state changed from', appState.current, 'to', nextAppState);

            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                // App has come to the foreground
                console.log('App returned to foreground - restoring timer state');
                await restoreTimerState();
                
                // Check subscription status when app resumes (grace period handling)
                if (isProUser) {
                    try {
                        console.log('[AppLifecycle] Checking subscription status on app resume');
                        await refreshProStatus();
                    } catch (error) {
                        console.error('[AppLifecycle] Failed to refresh subscription status:', error);
                        // Don't block app functionality if subscription check fails
                    }
                }
            } else if (nextAppState.match(/inactive|background/)) {
                // App has gone to the background
                console.log('App went to background - saving timer state');
                await saveTimerState();
            }

            appState.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription?.remove();
        };
    }, [saveTimerState, restoreTimerState]);

    // Clean up saved state on unmount
    useEffect(() => {
        return () => {
            AsyncStorage.removeItem(TIMER_STATE_KEY).catch(console.error);
        };
    }, []);
}
