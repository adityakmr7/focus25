import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TIMER_STATE_KEY = 'timer_background_state';

interface ManualTimerState {
    isRunning: boolean;
    startTime: number;
    duration: number; // in seconds
    isBreak: boolean;
    sessionId: string;
    pausedAt?: number; // timestamp when paused
    totalPausedTime?: number; // total time spent paused in ms
}

export class ManualTimerService {
    private static instance: ManualTimerService;

    static getInstance(): ManualTimerService {
        if (!ManualTimerService.instance) {
            ManualTimerService.instance = new ManualTimerService();
        }
        return ManualTimerService.instance;
    }

    async initialize(): Promise<void> {
        console.log('Manual timer service initialized');
    }

    async startTimer(duration: number, isBreak: boolean = false): Promise<string> {
        const sessionId = (Platform.OS === 'web' ? 'web-session-' : 'session-') + Date.now();
        const timerState: ManualTimerState = {
            isRunning: true,
            startTime: Date.now(),
            duration: duration * 60, // Convert minutes to seconds
            isBreak,
            sessionId,
            totalPausedTime: 0,
        };

        try {
            await AsyncStorage.setItem(TIMER_STATE_KEY, JSON.stringify(timerState));
            console.log('Manual timer started:', sessionId);
            return sessionId;
        } catch (error) {
            console.error('Failed to start manual timer:', error);
            throw error;
        }
    }

    async stopTimer(): Promise<void> {
        try {
            await AsyncStorage.removeItem(TIMER_STATE_KEY);
            console.log('Manual timer stopped');
        } catch (error) {
            console.error('Failed to stop manual timer:', error);
        }
    }

    async pauseTimer(): Promise<void> {
        try {
            const timerStateString = await AsyncStorage.getItem(TIMER_STATE_KEY);
            if (timerStateString) {
                const timerState: ManualTimerState = JSON.parse(timerStateString);
                timerState.isRunning = false;
                timerState.pausedAt = Date.now();
                await AsyncStorage.setItem(TIMER_STATE_KEY, JSON.stringify(timerState));
            }
        } catch (error) {
            console.error('Failed to pause manual timer:', error);
        }
    }

    async resumeTimer(): Promise<void> {
        try {
            const timerStateString = await AsyncStorage.getItem(TIMER_STATE_KEY);
            if (timerStateString) {
                const timerState: ManualTimerState = JSON.parse(timerStateString);
                
                if (timerState.pausedAt) {
                    // Calculate time spent paused
                    const pauseDuration = Date.now() - timerState.pausedAt;
                    timerState.totalPausedTime = (timerState.totalPausedTime || 0) + pauseDuration;
                }
                
                timerState.isRunning = true;
                delete timerState.pausedAt;
                
                await AsyncStorage.setItem(TIMER_STATE_KEY, JSON.stringify(timerState));
            }
        } catch (error) {
            console.error('Failed to resume manual timer:', error);
        }
    }

    async getTimerState(): Promise<ManualTimerState | null> {
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
            if (!timerState) {
                return 0;
            }

            const now = Date.now();
            const totalPausedTime = timerState.totalPausedTime || 0;
            
            // If currently paused, add current pause duration
            let currentPauseDuration = 0;
            if (!timerState.isRunning && timerState.pausedAt) {
                currentPauseDuration = now - timerState.pausedAt;
            }
            
            // Calculate elapsed time excluding pauses
            const totalElapsed = now - timerState.startTime;
            const activeElapsed = Math.floor((totalElapsed - totalPausedTime - currentPauseDuration) / 1000);
            
            return Math.max(0, timerState.duration - activeElapsed);
        } catch (error) {
            console.error('Failed to get remaining time:', error);
            return 0;
        }
    }

    isSupported(): boolean {
        return true; // Manual timer works on all platforms
    }

    async checkTimerCompletion(): Promise<boolean> {
        const remainingTime = await this.getRemainingTime();
        const timerState = await this.getTimerState();
        
        if (timerState && remainingTime <= 0) {
            await this.stopTimer();
            return true; // Timer completed
        }
        return false;
    }
}

export const manualTimerService = ManualTimerService.getInstance();

// Export with old name for compatibility
export const backgroundTimerService = manualTimerService;
