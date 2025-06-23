import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_TIMER_TASK = 'background-timer-task';
const TIMER_STATE_KEY = 'timer_background_state';

interface BackgroundTimerState {
    isRunning: boolean;
    startTime: number;
    duration: number; // in seconds
    isBreak: boolean;
    sessionId: string;
}

// Define the background task
TaskManager.defineTask(BACKGROUND_TIMER_TASK, async () => {
    try {
        const timerStateString = await AsyncStorage.getItem(TIMER_STATE_KEY);
        if (!timerStateString) {
            return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        const timerState: BackgroundTimerState = JSON.parse(timerStateString);

        if (!timerState.isRunning) {
            return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        const now = Date.now();
        const elapsed = Math.floor((now - timerState.startTime) / 1000);
        const remaining = timerState.duration - elapsed;

        // Check if timer should complete
        if (remaining <= 0) {
            // Timer completed - send notification
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: timerState.isBreak ? 'Break Complete!' : 'Focus Session Complete!',
                    body: timerState.isBreak
                        ? 'Ready for your next focus session?'
                        : 'Time for a well-deserved break!',
                    sound: true,
                    data: {
                        sessionId: timerState.sessionId,
                        type: timerState.isBreak ? 'break_complete' : 'session_complete',
                    },
                },
                trigger: null,
            });

            // Clear the timer state
            await AsyncStorage.removeItem(TIMER_STATE_KEY);

            return BackgroundFetch.BackgroundFetchResult.NewData;
        }

        // Timer still running - update progress notification if needed
        if (remaining % 300 === 0) {
            // Every 5 minutes
            const minutesRemaining = Math.ceil(remaining / 60);
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: timerState.isBreak ? 'Break in Progress' : 'Focus Session Active',
                    body: `${minutesRemaining} minutes remaining`,
                    sound: false,
                    data: {
                        sessionId: timerState.sessionId,
                        type: 'progress_update',
                        remaining: remaining,
                    },
                },
                trigger: null,
            });
        }

        return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
        console.error('Background timer task error:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

export class BackgroundTimerService {
    private static instance: BackgroundTimerService;
    private isRegistered = false;

    static getInstance(): BackgroundTimerService {
        if (!BackgroundTimerService.instance) {
            BackgroundTimerService.instance = new BackgroundTimerService();
        }
        return BackgroundTimerService.instance;
    }

    async initialize(): Promise<void> {
        if (Platform.OS === 'web') {
            console.log('Background timer not supported on web');
            return;
        }

        try {
            // Register background fetch
            await BackgroundFetch.registerTaskAsync(BACKGROUND_TIMER_TASK, {
                minimumInterval: 15000, // 15 seconds minimum
                stopOnTerminate: false,
                startOnBoot: true,
            });

            this.isRegistered = true;
            console.log('Background timer service initialized');
        } catch (error) {
            console.error('Failed to register background task:', error);
        }
    }

    async startTimer(duration: number, isBreak: boolean = false): Promise<string> {
        if (Platform.OS === 'web') {
            return 'web-session-' + Date.now();
        }

        const sessionId = 'session-' + Date.now();
        const timerState: BackgroundTimerState = {
            isRunning: true,
            startTime: Date.now(),
            duration: duration * 60, // Convert minutes to seconds
            isBreak,
            sessionId,
        };

        try {
            await AsyncStorage.setItem(TIMER_STATE_KEY, JSON.stringify(timerState));
            console.log('Background timer started:', sessionId);
            return sessionId;
        } catch (error) {
            console.error('Failed to start background timer:', error);
            throw error;
        }
    }

    async stopTimer(): Promise<void> {
        try {
            await AsyncStorage.removeItem(TIMER_STATE_KEY);
            console.log('Background timer stopped');
        } catch (error) {
            console.error('Failed to stop background timer:', error);
        }
    }

    async pauseTimer(): Promise<void> {
        try {
            const timerStateString = await AsyncStorage.getItem(TIMER_STATE_KEY);
            if (timerStateString) {
                const timerState: BackgroundTimerState = JSON.parse(timerStateString);
                timerState.isRunning = false;
                await AsyncStorage.setItem(TIMER_STATE_KEY, JSON.stringify(timerState));
            }
        } catch (error) {
            console.error('Failed to pause background timer:', error);
        }
    }

    async resumeTimer(): Promise<void> {
        try {
            const timerStateString = await AsyncStorage.getItem(TIMER_STATE_KEY);
            if (timerStateString) {
                const timerState: BackgroundTimerState = JSON.parse(timerStateString);
                timerState.isRunning = true;
                timerState.startTime = Date.now(); // Reset start time
                await AsyncStorage.setItem(TIMER_STATE_KEY, JSON.stringify(timerState));
            }
        } catch (error) {
            console.error('Failed to resume background timer:', error);
        }
    }

    async getTimerState(): Promise<BackgroundTimerState | null> {
        try {
            const timerStateString = await AsyncStorage.getItem(TIMER_STATE_KEY);
            return timerStateString ? JSON.parse(timerStateString) : null;
        } catch (error) {
            console.error('Failed to get timer state:', error);
            return null;
        }
    }

    async getRemainingTime(): Promise<number> {
        try {
            const timerState = await this.getTimerState();
            if (!timerState || !timerState.isRunning) {
                return 0;
            }

            const now = Date.now();
            const elapsed = Math.floor((now - timerState.startTime) / 1000);
            const remaining = Math.max(0, timerState.duration - elapsed);

            return remaining;
        } catch (error) {
            console.error('Failed to get remaining time:', error);
            return 0;
        }
    }

    isSupported(): boolean {
        return Platform.OS !== 'web' && this.isRegistered;
    }
}

export const backgroundTimerService = BackgroundTimerService.getInstance();
