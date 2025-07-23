import { useCallback, useEffect, useState } from 'react';
import { backgroundTimerService } from '../services/backgroundTimer';
import { notificationService } from '../services/notificationService';
import { errorHandler } from '../services/errorHandler';

interface BackgroundTimerState {
    backgroundSessionId: string | null;
    isConnectedToBackground: boolean;
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
    const [backgroundState, setBackgroundState] = useState<BackgroundTimerState>({
        backgroundSessionId: null,
        isConnectedToBackground: false,
    });

    // Start background timer
    const startBackgroundTimer = useCallback(async () => {
        try {
            if (backgroundTimerService.isSupported()) {
                const sessionId = await backgroundTimerService.startTimer(
                    Math.floor(timer.totalSeconds / 60),
                    timer.isBreak,
                );
                setBackgroundState({
                    backgroundSessionId: sessionId,
                    isConnectedToBackground: true,
                });
                return sessionId;
            }
        } catch (error) {
            errorHandler.logError(error as Error, {
                context: 'Background Timer Start',
                severity: 'medium',
            });
        }
        return null;
    }, [timer.totalSeconds, timer.isBreak]);

    // Stop background timer
    const stopBackgroundTimer = useCallback(async () => {
        try {
            if (backgroundTimerService.isSupported()) {
                await backgroundTimerService.stopTimer();
                setBackgroundState({
                    backgroundSessionId: null,
                    isConnectedToBackground: false,
                });
            }
        } catch (error) {
            errorHandler.logError(error as Error, {
                context: 'Background Timer Stop',
                severity: 'low',
            });
        }
    }, []);

    // Pause background timer
    const pauseBackgroundTimer = useCallback(async () => {
        try {
            if (backgroundTimerService.isSupported()) {
                await backgroundTimerService.pauseTimer();
            }
        } catch (error) {
            errorHandler.logError(error as Error, {
                context: 'Background Timer Pause',
                severity: 'low',
            });
        }
    }, []);

    // Resume background timer
    const resumeBackgroundTimer = useCallback(async () => {
        try {
            if (backgroundTimerService.isSupported()) {
                await backgroundTimerService.resumeTimer();
            }
        } catch (error) {
            errorHandler.logError(error as Error, {
                context: 'Background Timer Resume',
                severity: 'low',
            });
        }
    }, []);

    // Sync with background timer on app resume
    const syncWithBackgroundTimer = useCallback(async () => {
        try {
            if (backgroundTimerService.isSupported() && backgroundState.isConnectedToBackground) {
                const backgroundTimerState = await backgroundTimerService.getTimerState();
                const remainingTime = await backgroundTimerService.getRemainingTime();

                if (backgroundTimerState && backgroundTimerState.isRunning && remainingTime > 0) {
                    // Timer is still running - sync with current state
                    const minutes = Math.floor(remainingTime / 60);
                    const seconds = remainingTime % 60;

                    setTimer({
                        minutes,
                        seconds,
                        totalSeconds: remainingTime,
                        isRunning: true,
                        isPaused: false,
                        isBreak: backgroundTimerState.isBreak,
                    });
                    console.log('⏰ Timer synced with background state');
                    return 'synced';
                } else if (!backgroundTimerState || remainingTime <= 0) {
                    // Timer completed while in background
                    console.log('⏰ Timer completed in background');
                    setBackgroundState({
                        backgroundSessionId: null,
                        isConnectedToBackground: false,
                    });

                    // Cancel any remaining timer notifications
                    await notificationService.cancelTimerNotifications();
                    return 'completed';
                }
            }
        } catch (error) {
            console.error('Failed to sync with background timer:', error);
            errorHandler.logError(error as Error, {
                context: 'Background Timer Sync',
                severity: 'medium',
            });
        }
        return 'no-sync';
    }, [backgroundState.isConnectedToBackground, setTimer]);

    // Handle timer toggle with background support
    const handleTimerToggleWithBackground = useCallback(async (
        wasRunning: boolean,
        wasPaused: boolean,
        toggleTimerFn: () => void
    ) => {
        try {
            toggleTimerFn();

            // Background timer handling
            if (backgroundTimerService.isSupported()) {
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
                context: 'Timer Toggle with Background',
                severity: 'medium',
            });
        }
    }, [startBackgroundTimer, pauseBackgroundTimer, resumeBackgroundTimer]);

    // Initialize background timer sync
    useEffect(() => {
        const initializeBackgroundSync = async () => {
            try {
                if (backgroundTimerService.isSupported()) {
                    const backgroundTimerState = await backgroundTimerService.getTimerState();
                    const remainingTime = await backgroundTimerService.getRemainingTime();

                    if (backgroundTimerState && remainingTime > 0) {
                        setBackgroundState({
                            isConnectedToBackground: true,
                            backgroundSessionId: backgroundTimerState.sessionId,
                        });

                        const minutes = Math.floor(remainingTime / 60);
                        const seconds = remainingTime % 60;

                        setTimer({
                            minutes,
                            seconds,
                            totalSeconds: remainingTime,
                            isRunning: backgroundTimerState.isRunning,
                            isBreak: backgroundTimerState.isBreak,
                        });
                    }
                }
            } catch (error) {
                errorHandler.logError(error as Error, {
                    context: 'Background Timer Sync',
                    severity: 'medium',
                });
            }
        };

        if (isInitialized) {
            initializeBackgroundSync();
        }
    }, [isInitialized, setTimer]);

    return {
        // State
        backgroundSessionId: backgroundState.backgroundSessionId,
        isConnectedToBackground: backgroundState.isConnectedToBackground,
        
        // Actions
        startBackgroundTimer,
        stopBackgroundTimer,
        pauseBackgroundTimer,
        resumeBackgroundTimer,
        syncWithBackgroundTimer,
        handleTimerToggleWithBackground,
        
        // Utils
        isBackgroundSupported: backgroundTimerService.isSupported(),
    };
};