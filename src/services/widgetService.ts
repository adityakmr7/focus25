import { Platform } from 'react-native';
import { useTodoStore } from '../store/todoStore';

// Dynamically import widget module to avoid loading issues
let widgetModule: any = null;

const getWidgetModule = async () => {
    if (widgetModule) return widgetModule;

    try {
        console.log('🔄 Loading widget module...');
        widgetModule = await import('focus25-widget-module');
        console.log('✅ Widget module loaded successfully');
        return widgetModule;
    } catch (error) {
        console.warn('❌ Widget module not available:', error);
        return null;
    }
};

class WidgetService {
    private isInitialized = false;
    private liveActivityActive = false;

    /**
     * Initialize the widget service
     */
    async initialize(): Promise<void> {
        if (this.isInitialized || Platform.OS !== 'ios') {
            return;
        }

        try {
            console.log('🔄 Initializing widget service...');
            const module = await getWidgetModule();
            if (!module) {
                console.warn('❌ Widget module not available, skipping initialization');
                this.isInitialized = true;
                return;
            }

            console.log('🔧 Configuring widget...');
            await module.configureWidget({
                appGroupId: 'group.com.focus25.app.focus25Widget',
                widgetKind: 'focus25Widget',
            });

            this.isInitialized = true;
            console.log('✅ Widget service initialized successfully');
        } catch (error) {
            console.warn('❌ Widget service initialization failed:', error);
            this.isInitialized = true;
        }
    }

    /**
     * Get today's todo statistics
     */
    private getTodayTodoStats() {
        const today = new Date().toISOString().split('T')[0];
        const todos = useTodoStore.getState().todos;
        
        const todayTodos = todos.filter(todo => {
            const todoDate = todo.createdAt.split('T')[0];
            return todoDate === today;
        });

        const completedTodos = todayTodos.filter(todo => todo.isCompleted);
        
        return {
            completedCount: completedTodos.length,
            totalCount: todayTodos.length
        };
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
            const module = await getWidgetModule();
            if (!module) return;

            // Get today's todo statistics
            const todoStats = this.getTodayTodoStats();

            // Include todo data with timer data
            const widgetData = {
                ...data,
                todayCompletedTodos: todoStats.completedCount,
                todayTotalTodos: todoStats.totalCount
            };

            await module.updateWidget(widgetData);

            // Also update Live Activity if it's active
            if (this.liveActivityActive) {
                await module.updateLiveActivity(data);
            }
        } catch (error) {
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
            const module = await getWidgetModule();
            if (!module) return;

            await module.clearWidgetData();
        } catch (error) {
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
     * Update widget with just todo data (called when todos change)
     */
    async updateTodoData(): Promise<void> {
        if (Platform.OS !== 'ios' || !this.isInitialized) {
            return;
        }

        try {
            const module = await getWidgetModule();
            if (!module) return;

            // Get current widget data first
            const currentData = await module.getWidgetData();
            if (!currentData) return;

            // Get today's todo statistics
            const todoStats = this.getTodayTodoStats();

            // Update only todo data while preserving timer data
            const widgetData = {
                ...currentData,
                todayCompletedTodos: todoStats.completedCount,
                todayTotalTodos: todoStats.totalCount
            };

            await module.updateWidget(widgetData);
        } catch (error) {
            console.warn('Failed to update todo data in widget:', error);
        }
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
            console.log(
                '📱 Skipping widget update - iOS:',
                Platform.OS === 'ios',
                'Initialized:',
                this.isInitialized,
            );
            return;
        }

        const sessionName = timer.isBreak ? 'Break Time' : 'Focus Session';
        const timeRemaining = this.formatTime(timer.minutes, timer.seconds);
        const isActive = timer.isRunning && !timer.isPaused;
        const progress = this.calculateProgress(timer.totalSeconds, timer.initialSeconds);
        const totalDuration = Math.floor(timer.initialSeconds / 60);
        const elapsedTime = Math.floor((timer.initialSeconds - timer.totalSeconds) / 60);

        console.log('📱 Updating widget with:', {
            sessionName,
            timeRemaining,
            isActive,
            progress: Math.round(progress * 100) + '%',
        });

        await this.updateTimerData({
            sessionName,
            timeRemaining,
            isActive,
            progress,
            totalDuration,
            elapsedTime,
        });
    }

    /**
     * Start Live Activity for Dynamic Island
     */
    async startLiveActivityForTimer(timer: {
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

        try {
            const sessionName = timer.isBreak ? 'Break Time' : 'Focus Session';
            const timeRemaining = this.formatTime(timer.minutes, timer.seconds);
            const isActive = timer.isRunning && !timer.isPaused;
            const progress = this.calculateProgress(timer.totalSeconds, timer.initialSeconds);
            const totalDuration = Math.floor(timer.initialSeconds / 60);

            const module = await getWidgetModule();
            if (!module) {
                console.warn('❌ Widget module not available for Live Activity');
                return;
            }

            console.log('🚀 Starting Live Activity with data:', {
                sessionName,
                timeRemaining,
                isActive,
                progress,
                totalDuration,
            });

            await module.startLiveActivity({
                sessionName,
                timeRemaining,
                isActive,
                progress,
                totalDuration,
                elapsedTime: Math.floor((timer.initialSeconds - timer.totalSeconds) / 60),
            });

            this.liveActivityActive = true;
            console.log('✅ Live Activity started');
        } catch (error) {
            console.warn('Failed to start Live Activity:', error);
        }
    }

    /**
     * Stop Live Activity
     */
    async stopLiveActivityForTimer(): Promise<void> {
        if (Platform.OS !== 'ios' || !this.isInitialized || !this.liveActivityActive) {
            return;
        }

        try {
            const module = await getWidgetModule();
            if (!module) return;

            await module.stopLiveActivity();
            this.liveActivityActive = false;
            console.log('✅ Live Activity stopped');
        } catch (error) {
            console.warn('Failed to stop Live Activity:', error);
        }
    }
}

export const widgetService = new WidgetService();
