import { Platform } from 'react-native';
import { updateWidget, configureWidget, clearWidgetData } from 'focus25-widget-module';
import { errorHandler } from './errorHandler';

class WidgetService {
    private isInitialized = false;

    /**
     * Initialize the widget service
     */
    async initialize(): Promise<void> {
        if (this.isInitialized || Platform.OS !== 'ios') {
            return;
        }

        try {
            await configureWidget({
                appGroupId: 'com.focus25.app.focus25Widget',
                widgetKind: 'focus25Widget',
            });
            
            this.isInitialized = true;
            console.log('✅ Widget service initialized');
        } catch (error) {
            errorHandler.logError(error as Error, {
                context: 'Widget Service Initialization',
                severity: 'low',
            });
            console.warn('Widget service initialization failed:', error);
        }
    }

    /**
     * Update widget with current timer data
     */
    async updateTimerData(data: {
        sessionName: string;
        timeRemaining: string;
        isActive: boolean;
        progress: number;
        totalDuration?: number;
        elapsedTime?: number;
    }): Promise<void> {
        if (Platform.OS !== 'ios' || !this.isInitialized) {
            return;
        }

        try {
            await updateWidget(data);
        } catch (error) {
            errorHandler.logError(error as Error, {
                context: 'Widget Update',
                severity: 'low',
            });
            console.warn('Failed to update widget:', error);
        }
    }

    /**
     * Clear all widget data
     */
    async clearData(): Promise<void> {
        if (Platform.OS !== 'ios' || !this.isInitialized) {
            return;
        }

        try {
            await clearWidgetData();
        } catch (error) {
            errorHandler.logError(error as Error, {
                context: 'Widget Clear Data',
                severity: 'low',
            });
            console.warn('Failed to clear widget data:', error);
        }
    }

    /**
     * Format time for display in widget
     */
    private formatTime(minutes: number, seconds: number): string {
        const formattedMinutes = Math.max(0, minutes).toString().padStart(2, '0');
        const formattedSeconds = Math.max(0, seconds).toString().padStart(2, '0');
        return `${formattedMinutes}:${formattedSeconds}`;
    }

    /**
     * Calculate progress percentage
     */
    private calculateProgress(totalSeconds: number, initialSeconds: number): number {
        if (initialSeconds === 0) return 0;
        return Math.max(0, Math.min(1, (initialSeconds - totalSeconds) / initialSeconds));
    }

    /**
     * Update widget with timer state from the store
     */
    async updateFromTimerState(timer: {
        minutes: number;
        seconds: number;
        isRunning: boolean;
        isPaused: boolean;
        totalSeconds: number;
        initialSeconds: number;
        isBreak: boolean;
    }): Promise<void> {
        if (Platform.OS !== 'ios' || !this.isInitialized) {
            return;
        }

        const sessionName = timer.isBreak ? 'Break Time' : 'Focus Session';
        const timeRemaining = this.formatTime(timer.minutes, timer.seconds);
        const isActive = timer.isRunning && !timer.isPaused;
        const progress = this.calculateProgress(timer.totalSeconds, timer.initialSeconds);
        const totalDuration = Math.floor(timer.initialSeconds / 60);
        const elapsedTime = Math.floor((timer.initialSeconds - timer.totalSeconds) / 60);

        await this.updateTimerData({
            sessionName,
            timeRemaining,
            isActive,
            progress,
            totalDuration,
            elapsedTime,
        });
    }
}

export const widgetService = new WidgetService();