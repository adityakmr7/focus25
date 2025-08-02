import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { usePomodoroStore } from '../store/pomodoroStore';
import { useSettingsStore } from '../store/settingsStore';
import { notificationService } from '../services/notificationService';
import { errorHandler } from '../services/errorHandler';
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
        initializeStore: initializeSettings 
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

    // Timer countdown logic
    useEffect(() => {
        if (!timerState.isInitialized) return;

        if (timer.isRunning && !timer.isPaused) {
            intervalRef.current = setInterval(async () => {
                if (timer.totalSeconds <= 0) {
                    // Timer completed - call the completion callback
                    await onTimerComplete();
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

                // Save timer state periodically
                await saveTimerState();
            }, 1000);
        } else {
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
        timer.totalSeconds,
        timer.isBreak,
        timerState.isInitialized,
        setTimer,
        saveTimerState,
        onTimerComplete,
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