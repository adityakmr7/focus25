import { useCallback, useEffect, useState } from 'react';
import { manualTimerService } from '../services/backgroundTimer';
import { notificationService } from '../services/notificationService';
import { errorHandler } from '../services/errorHandler';

interface ManualTimerState {
    timerSessionId: string | null;
    isConnected: boolean;
}

interface UseBackgroundTimerProps {
    timer: {
        isRunning: boolean;
        isPaused: boolean;
        totalSeconds: number;
        isBreak: boolean;
    };
    setTimer: (timer: any) => void;
    isInitialized: boolean;
}

export const useBackgroundTimer = ({ 
    timer, 
    setTimer, 
    isInitialized 
}: UseBackgroundTimerProps) => {
    const [timerState, setTimerState] = useState<ManualTimerState>({
        timerSessionId: null,
        isConnected: false,
    });

    // Start manual timer
    const startBackgroundTimer = useCallback(async () => {
        try {
            if (manualTimerService.isSupported()) {
                const sessionId = await manualTimerService.startTimer(
                    Math.floor(timer.totalSeconds / 60),
                    timer.isBreak,
                );
                setTimerState({
                    timerSessionId: sessionId,
                    isConnected: true,
                });
                return sessionId;
            }
        } catch (error) {
            errorHandler.logError(error as Error, {
                context: 'Manual Timer Start',
                severity: 'medium',
            });
        }
        return null;
    }, [timer.totalSeconds, timer.isBreak]);

    // Stop manual timer
    const stopBackgroundTimer = useCallback(async () => {
        try {
            if (manualTimerService.isSupported()) {
                await manualTimerService.stopTimer();
                setTimerState({
                    timerSessionId: null,
                    isConnected: false,
                });
            }
        } catch (error) {
            errorHandler.logError(error as Error, {
                context: 'Manual Timer Stop',
                severity: 'low',
            });
        }
    }, []);

    // Pause manual timer
    const pauseBackgroundTimer = useCallback(async () => {
        try {
            if (manualTimerService.isSupported()) {
                await manualTimerService.pauseTimer();
            }
        } catch (error) {
            errorHandler.logError(error as Error, {
                context: 'Manual Timer Pause',
                severity: 'low',
            });
        }
    }, []);

    // Resume manual timer
    const resumeBackgroundTimer = useCallback(async () => {
        try {
            if (manualTimerService.isSupported()) {
                await manualTimerService.resumeTimer();
            }
        } catch (error) {
            errorHandler.logError(error as Error, {
                context: 'Manual Timer Resume',
                severity: 'low',
            });
        }
    }, []);

    // Sync with manual timer on app resume
    const syncWithBackgroundTimer = useCallback(async () => {
        try {
            if (manualTimerService.isSupported() && timerState.isConnected) {
                const savedTimerState = await manualTimerService.getTimerState();
                const remainingTime = await manualTimerService.getRemainingTime();

                if (savedTimerState && remainingTime > 0) {
                    // Timer is still active - sync with current state
                    const minutes = Math.floor(remainingTime / 60);
                    const seconds = remainingTime % 60;

                    setTimer({
                        minutes,
                        seconds,
                        totalSeconds: remainingTime,
                        isRunning: savedTimerState.isRunning,
                        isPaused: !savedTimerState.isRunning,
                        isBreak: savedTimerState.isBreak,
                    });
                    console.log('⏰ Timer synced with saved state');
                    return 'synced';
                } else if (!savedTimerState || remainingTime <= 0) {
                    // Timer completed while app was closed/backgrounded
                    console.log('⏰ Timer completed while app was backgrounded');
                    setTimerState({
                        timerSessionId: null,
                        isConnected: false,
                    });

                    // Cancel any remaining timer notifications
                    await notificationService.cancelTimerNotifications();
                    return 'completed';
                }
            }
        } catch (error) {
            console.error('Failed to sync with manual timer:', error);
            errorHandler.logError(error as Error, {
                context: 'Manual Timer Sync',
                severity: 'medium',
            });
        }
        return 'no-sync';
    }, [timerState.isConnected, setTimer]);

    // Handle timer toggle with manual timer support
    const handleTimerToggleWithBackground = useCallback(async (
        wasRunning: boolean,
        wasPaused: boolean,
        toggleTimerFn: () => void
    ) => {
        try {
            toggleTimerFn();

            // Manual timer handling
            if (manualTimerService.isSupported()) {
                if (!wasRunning && !wasPaused) {
                    // Starting timer from stopped state
                    await startBackgroundTimer();
                } else if (wasRunning && !wasPaused) {
                    // Timer was running, so user is pausing it
                    await pauseBackgroundTimer();
                } else if (!wasRunning && wasPaused) {
                    // Timer was paused, so user is resuming it
                    await resumeBackgroundTimer();
                }
            }
        } catch (error) {
            errorHandler.logError(error as Error, {
                context: 'Timer Toggle with Manual Timer',
                severity: 'medium',
            });
        }
    }, [startBackgroundTimer, pauseBackgroundTimer, resumeBackgroundTimer]);

    // Initialize manual timer sync
    useEffect(() => {
        const initializeTimerSync = async () => {
            try {
                if (manualTimerService.isSupported()) {
                    const savedTimerState = await manualTimerService.getTimerState();
                    const remainingTime = await manualTimerService.getRemainingTime();

                    if (savedTimerState && remainingTime > 0) {
                        setTimerState({
                            isConnected: true,
                            timerSessionId: savedTimerState.sessionId,
                        });

                        const minutes = Math.floor(remainingTime / 60);
                        const seconds = remainingTime % 60;

                        setTimer({
                            minutes,
                            seconds,
                            totalSeconds: remainingTime,
                            isRunning: savedTimerState.isRunning,
                            isPaused: !savedTimerState.isRunning,
                            isBreak: savedTimerState.isBreak,
                        });
                    }
                }
            } catch (error) {
                errorHandler.logError(error as Error, {
                    context: 'Manual Timer Sync',
                    severity: 'medium',
                });
            }
        };

        if (isInitialized) {
            initializeTimerSync();
        }
    }, [isInitialized, setTimer]);

    return {
        // State
        backgroundSessionId: timerState.timerSessionId,
        isConnectedToBackground: timerState.isConnected,
        
        // Actions
        startBackgroundTimer,
        stopBackgroundTimer,
        pauseBackgroundTimer,
        resumeBackgroundTimer,
        syncWithBackgroundTimer,
        handleTimerToggleWithBackground,
        
        // Utils
        isBackgroundSupported: manualTimerService.isSupported(),
    };
};