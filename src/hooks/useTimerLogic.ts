import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { usePomodoroStore } from '../store/pomodoroStore';
import { useSettingsStore } from '../store/settingsStore';
import { notificationService } from '../services/notificationService';
import { errorHandler } from '../services/errorHandler';
import { widgetService } from '../services/widgetService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TIMER_STATE_KEY = 'timer_state';

interface TimerState {
    isInitialized: boolean;
    isLoading: boolean;
    syncStatus: 'idle' | 'syncing' | 'error';
}

interface UseTimerLogicProps {
    onTimerComplete: () => Promise<void>;
}

export const useTimerLogic = ({ onTimerComplete }: UseTimerLogicProps) => {
    const [timerState, setTimerState] = useState<TimerState>({
        isInitialized: false,
        isLoading: true,
        syncStatus: 'idle',
    });

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastSaveTimeRef = useRef<number>(0);

    // Store hooks
    const {
        timer,
        toggleTimer,
        resetTimer,
        handleTimerComplete: storeHandleTimerComplete,
        setTimer,
        updateTimerFromSettings,
        flowMetrics,
        initializeStore: initializePomodoro,
    } = usePomodoroStore();

    const {
        timeDuration,
        breakDuration,
        soundEffects,
        initializeStore: initializeSettings,
    } = useSettingsStore();

    // Save timer state to storage
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

    // Handle timer toggle
    const handleToggleTimer = useCallback(async () => {
        try {
            const wasRunning = timer.isRunning;
            const wasPaused = timer.isPaused;
            toggleTimer();
            // Update widget after timer state change - use non-blocking approach
            Promise.resolve().then(async () => {
                const currentTimer = usePomodoroStore.getState().timer;

                // Run widget updates in parallel to avoid blocking
                const widgetUpdatePromise = widgetService.updateFromTimerState(currentTimer);

                console.log('🔍 Timer toggle debug:', {
                    wasRunning,
                    wasPaused,
                    currentIsRunning: currentTimer.isRunning,
                    currentIsPaused: currentTimer.isPaused,
                    shouldStartLiveActivity: !wasRunning && currentTimer.isRunning,
                });

                // Handle Live Activity operations
                let liveActivityPromise: Promise<void> = Promise.resolve();

                if (!wasRunning && currentTimer.isRunning) {
                    console.log('🚀 Triggering Live Activity start...');
                    liveActivityPromise = widgetService.startLiveActivityForTimer(currentTimer);
                } else if (wasRunning && !wasPaused && currentTimer.isPaused) {
                    console.log('⏸️ Pausing Live Activity...');
                    liveActivityPromise = widgetService.pauseLiveActivityForTimer();
                } else if (wasRunning && wasPaused && !currentTimer.isPaused) {
                    console.log('▶️ Resuming Live Activity...');
                    liveActivityPromise = widgetService.resumeLiveActivityForTimer();
                }

                // Wait for both operations to complete
                await Promise.all([widgetUpdatePromise, liveActivityPromise]);
            });

            // Auto-play music logic would be handled in the parent component
            // since it depends on audio manager
        } catch (error) {
            errorHandler.logError(error as Error, {
                context: 'Timer Toggle',
                severity: 'medium',
            });
            Alert.alert('Timer Error', 'There was an issue with the timer. Please try again.');
        }
    }, [timer.isRunning, timer.isPaused, toggleTimer]);

    // Handle timer reset
    const handleReset = useCallback(async () => {
        try {
            // Cancel any scheduled notifications
            await notificationService.cancelTimerNotifications();

            // Reset timer state
            resetTimer();

            // Force sync with settings to ensure correct state
            updateTimerFromSettings();

            // Update widget after reset and stop Live Activity
            setTimeout(async () => {
                const currentTimer = usePomodoroStore.getState().timer;
                await widgetService.updateFromTimerState(currentTimer);
                await widgetService.stopLiveActivityForTimer();
            }, 100);
        } catch (error) {
            errorHandler.logError(error as Error, {
                context: 'Timer Reset',
                severity: 'low',
            });
        }
    }, [resetTimer, updateTimerFromSettings]);

    // Initialize timer
    const initializeTimer = useCallback(async () => {
        try {
            setTimerState((prev) => ({ ...prev, isLoading: true }));
            console.log('🚀 Initializing Timer...');

            // Initialize stores
            await Promise.all([initializeSettings(), initializePomodoro()]);

            // Sync timer with loaded settings
            updateTimerFromSettings();
            console.log('🔄 Timer synchronized with settings');

            setTimerState((prev) => ({ ...prev, isInitialized: true }));
            console.log('✅ Timer initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Timer:', error);
            Alert.alert(
                'Initialization Error',
                'Failed to initialize the timer. Please restart the app.',
                [{ text: 'OK' }],
            );
        } finally {
            setTimerState((prev) => ({ ...prev, isLoading: false }));
        }
    }, [initializeSettings, initializePomodoro, updateTimerFromSettings]);

    // Timer countdown logic - with stable references to avoid interference
    useEffect(() => {
        if (!timerState.isInitialized) {
            console.log('⚠️ Timer not initialized, skipping countdown setup');
            return;
        }

        const isTimerActive = timer.isRunning && !timer.isPaused;

        if (isTimerActive) {
            // Only create interval if we don't already have one
            if (!intervalRef.current) {
                console.log('🆕 Creating new timer countdown interval');
                intervalRef.current = setInterval(() => {
                    // Get the current timer state from the store to avoid stale closures
                    const currentTimer = usePomodoroStore.getState().timer;

                    if (currentTimer.totalSeconds <= 0) {
                        // Timer completed - call the completion callback
                        console.log('⏰ Timer completed, calling completion callback');
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = null;
                        }
                        // Call completion callback asynchronously to not block
                        onTimerComplete().catch(console.error);
                        return;
                    }

                    // Only update if timer is still running (avoid race conditions)
                    if (!currentTimer.isRunning || currentTimer.isPaused) {
                        console.log('⏸️ Timer stopped or paused during tick, clearing interval');
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = null;
                        }
                        return;
                    }

                    const newTotalSeconds = currentTimer.totalSeconds - 1;
                    const minutes = Math.floor(newTotalSeconds / 60);
                    const seconds = newTotalSeconds % 60;

                    console.log('⏱️ Timer tick - Updating to:', {
                        minutes,
                        seconds,
                        totalSeconds: newTotalSeconds,
                    });

                    // Update timer state synchronously first
                    setTimer({
                        minutes,
                        seconds,
                        totalSeconds: newTotalSeconds,
                    });

                    // Do async operations without blocking the timer update
                    Promise.all([
                        widgetService.updateFromTimerState({
                            ...currentTimer,
                            minutes,
                            seconds,
                            totalSeconds: newTotalSeconds,
                            isRunning: currentTimer.isRunning,
                            isPaused: currentTimer.isPaused,
                            initialSeconds: currentTimer.initialSeconds,
                            isBreak: currentTimer.isBreak,
                        }),
                        saveTimerState(),
                    ]).catch((error) => {
                        console.warn('Timer update async operations failed:', error);
                    });
                }, 1000);
            } else {
                console.log('✅ Timer interval already exists, not creating new one');
            }
        } else {
            console.log('⏸️ Timer not active, clearing interval if exists');
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
        timerState.isInitialized,
        // Removed setTimer, saveTimerState, and onTimerComplete to prevent recreating interval
    ]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    return {
        // State
        timer,
        timerState,
        flowMetrics,
        timeDuration,
        breakDuration,
        soundEffects,

        // Actions
        handleToggleTimer,
        handleReset,
        initializeTimer,
        saveTimerState,
        setTimer,

        // Store actions
        updateTimerFromSettings,
        handleTimerComplete: storeHandleTimerComplete,
    };
};
