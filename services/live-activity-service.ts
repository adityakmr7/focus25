import * as LiveActivity from 'expo-live-activity';
import { Platform } from 'react-native';

export interface TimerLiveActivityData {
    phase: 'focus' | 'shortBreak' | 'longBreak';
    remainingTime: number; // in seconds
    totalTime: number; // in seconds
    todoTitle?: string;
    sessionNumber: number;
    totalSessions: number;
    isRunning: boolean;
    startTime: string; // ISO string
}

/**
 * Live Activity Service
 * Manages Live Activities for Pomodoro timer display on lock screen and Dynamic Island
 * Uses the real expo-live-activity package by Software Mansion Labs
 */
class LiveActivityService {
    private isInitialized = false;
    private currentActivityId: string | null = null;
    private updateInterval: ReturnType<typeof setInterval> | null = null;

    async initialize(): Promise<boolean> {
        try {
            if (this.isInitialized) return true;

            // Check if Live Activities are supported
            if (Platform.OS !== 'ios') {
                console.log('Live Activities only supported on iOS');
                return false;
            }

            // Note: expo-live-activity doesn't have isSupported method
            // We'll assume it's supported on iOS 16.1+ devices
            console.log('Live Activity service initialized');
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize Live Activity service:', error);
            return false;
        }
    }

    /**
     * Start a Live Activity for the Pomodoro timer
     */
    async startTimerActivity(data: TimerLiveActivityData): Promise<boolean> {
        try {
            if (!this.isInitialized) {
                const initialized = await this.initialize();
                if (!initialized) return false;
            }

            // Stop any existing activity
            await this.stopTimerActivity();

            // Create Live Activity state
            const activityState: LiveActivity.LiveActivityState = {
                title: this.getPhaseTitle(data.phase),
                subtitle: data.todoTitle || `Session ${data.sessionNumber}/${data.totalSessions}`,
                progressBar: {
                    date: new Date(Date.now() + data.remainingTime * 1000).getTime(),
                },
                imageName: this.getPhaseImageName(data.phase),
                dynamicIslandImageName: this.getPhaseImageName(data.phase),
            };

            // Create Live Activity config
            const activityConfig: LiveActivity.LiveActivityConfig = {
                backgroundColor: this.getPhaseBackgroundColor(data.phase),
                titleColor: '#FFFFFF',
                subtitleColor: '#FFFFFF',
                progressViewTint: this.getPhaseProgressColor(data.phase),
                progressViewLabelColor: '#FFFFFF',
                deepLinkUrl: '/pomodoro',
                timerType: 'circular',
                padding: { horizontal: 20, top: 16, bottom: 16 },
                imagePosition: 'left',
                imageAlign: 'center',
                imageSize: 60,
            };

            // Start the Live Activity
            const activityId = await LiveActivity.startActivity(activityState, activityConfig);
            this.currentActivityId = activityId || null;

            console.log('Live Activity started:', activityId);

            // Start update interval if timer is running
            if (data.isRunning) {
                this.startUpdateInterval(data);
            }

            return true;
        } catch (error) {
            console.error('Failed to start Live Activity:', error);
            return false;
        }
    }

    /**
     * Update the Live Activity with new timer data
     */
    async updateTimerActivity(data: TimerLiveActivityData): Promise<boolean> {
        try {
            if (!this.currentActivityId) return false;

            // Create updated Live Activity state
            const activityState: LiveActivity.LiveActivityState = {
                title: this.getPhaseTitle(data.phase),
                subtitle: data.todoTitle || `Session ${data.sessionNumber}/${data.totalSessions}`,
                progressBar: {
                    date: new Date(Date.now() + data.remainingTime * 1000).getTime(),
                },
                imageName: this.getPhaseImageName(data.phase),
                dynamicIslandImageName: this.getPhaseImageName(data.phase),
            };

            // Update the Live Activity
            await LiveActivity.updateActivity(this.currentActivityId, activityState);

            // Manage update interval based on running state
            if (data.isRunning && !this.updateInterval) {
                this.startUpdateInterval(data);
            } else if (!data.isRunning && this.updateInterval) {
                this.stopUpdateInterval();
            }

            return true;
        } catch (error) {
            console.error('Failed to update Live Activity:', error);
            return false;
        }
    }

    /**
     * Stop the Live Activity
     */
    async stopTimerActivity(): Promise<boolean> {
        try {
            if (!this.currentActivityId) return true;

            // Create final state for completion
            const finalState: LiveActivity.LiveActivityState = {
                title: 'Timer Completed!',
                subtitle: 'Great work! Time for a break.',
                progressBar: {
                    progress: 1.0,
                },
                imageName: 'focus_complete',
                dynamicIslandImageName: 'focus_complete',
            };

            await LiveActivity.stopActivity(this.currentActivityId, finalState);
            this.currentActivityId = null;

            // Stop update interval
            this.stopUpdateInterval();

            console.log('Live Activity stopped');
            return true;
        } catch (error) {
            console.error('Failed to stop Live Activity:', error);
            return false;
        }
    }

    /**
     * Handle Live Activity actions (pause/resume)
     */
    async handleActivityAction(action: 'pause' | 'resume'): Promise<void> {
        try {
            console.log('Live Activity action:', action);

            // This would integrate with an event system or directly call store methods
            // For now, we'll handle this in the integration phase
        } catch (error) {
            console.error('Failed to handle Live Activity action:', error);
        }
    }

    /**
     * Check if Live Activity is currently active
     */
    isActivityActive(): boolean {
        return this.currentActivityId !== null;
    }

    /**
     * Get current activity ID
     */
    getCurrentActivityId(): string | null {
        return this.currentActivityId;
    }

    /**
     * Start update interval for real-time updates
     */
    private startUpdateInterval(data: TimerLiveActivityData): void {
        this.stopUpdateInterval(); // Clear any existing interval

        this.updateInterval = setInterval(async () => {
            if (!this.currentActivityId) return;

            // Calculate new remaining time
            const startTime = new Date(data.startTime);
            const currentTime = new Date();
            const elapsed = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
            const remainingTime = Math.max(0, data.totalTime - elapsed);

            if (remainingTime <= 0) {
                // Timer completed
                await this.stopTimerActivity();
                return;
            }

            // Update Live Activity with new remaining time
            const updatedData = {
                ...data,
                remainingTime,
            };

            await this.updateTimerActivity(updatedData);
        }, 1000); // Update every second
    }

    /**
     * Stop update interval
     */
    private stopUpdateInterval(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Get title for timer phase
     */
    private getPhaseTitle(phase: 'focus' | 'shortBreak' | 'longBreak'): string {
        switch (phase) {
            case 'focus':
                return '🍅 Focus Session';
            case 'shortBreak':
                return '☕ Short Break';
            case 'longBreak':
                return '🌴 Long Break';
            default:
                return '🍅 Focus Session';
        }
    }

    /**
     * Get image name for timer phase
     */
    private getPhaseImageName(phase: 'focus' | 'shortBreak' | 'longBreak'): string {
        switch (phase) {
            case 'focus':
                return 'focus_icon';
            case 'shortBreak':
                return 'break_icon';
            case 'longBreak':
                return 'long_break_icon';
            default:
                return 'focus_icon';
        }
    }

    /**
     * Get background color for timer phase
     */
    private getPhaseBackgroundColor(phase: 'focus' | 'shortBreak' | 'longBreak'): string {
        switch (phase) {
            case 'focus':
                return '#FF6B6B'; // Red for focus
            case 'shortBreak':
                return '#4ECDC4'; // Teal for short break
            case 'longBreak':
                return '#45B7D1'; // Blue for long break
            default:
                return '#FF6B6B';
        }
    }

    /**
     * Get progress color for timer phase
     */
    private getPhaseProgressColor(phase: 'focus' | 'shortBreak' | 'longBreak'): string {
        switch (phase) {
            case 'focus':
                return '#FF5252'; // Darker red
            case 'shortBreak':
                return '#26A69A'; // Darker teal
            case 'longBreak':
                return '#2196F3'; // Darker blue
            default:
                return '#FF5252';
        }
    }

    /**
     * Cleanup resources
     */
    async cleanup(): Promise<void> {
        try {
            await this.stopTimerActivity();
            this.stopUpdateInterval();
        } catch (error) {
            console.error('Failed to cleanup Live Activity service:', error);
        }
    }
}

// Export singleton instance
export const liveActivityService = new LiveActivityService();
