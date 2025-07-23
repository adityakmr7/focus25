import { NativeModules, Platform } from 'react-native';

interface WidgetDataManager {
    updateTimerData: (
        timerState: string,
        timeRemaining: number,
        isBreak: boolean,
        sessionCount: number,
        dailyMinutes: number
    ) => void;
    updateDailyStats: (
        date: string,
        minutes: number,
        sessions: number
    ) => void;
}

const { WidgetDataManager } = NativeModules as {
    WidgetDataManager: WidgetDataManager;
};

export class WidgetService {
    static updateTimer(
        timerState: 'idle' | 'running' | 'paused' | 'completed',
        timeRemaining: number,
        isBreak: boolean,
        sessionCount: number,
        dailyMinutes: number
    ) {
        if (Platform.OS === 'ios' && WidgetDataManager) {
            try {
                WidgetDataManager.updateTimerData(
                    timerState,
                    timeRemaining,
                    isBreak,
                    sessionCount,
                    dailyMinutes
                );
            } catch (error) {
                console.warn('Failed to update widget data:', error);
            }
        }
    }

    static updateDailyStats(date: Date, minutes: number, sessions: number) {
        if (Platform.OS === 'ios' && WidgetDataManager) {
            try {
                const dateString = date.toISOString().split('T')[0];
                WidgetDataManager.updateDailyStats(dateString, minutes, sessions);
            } catch (error) {
                console.warn('Failed to update widget stats:', error);
            }
        }
    }

    static formatTimerState(timer: any): 'idle' | 'running' | 'paused' | 'completed' {
        if (timer.totalSeconds <= 0) return 'completed';
        if (timer.isRunning && !timer.isPaused) return 'running';
        if (timer.isPaused) return 'paused';
        return 'idle';
    }
}