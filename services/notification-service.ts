import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform, AppState, AppStateStatus } from 'react-native';

// Task name for background timer
const BACKGROUND_TIMER_TASK = 'BACKGROUND_TIMER_TASK';

// Notification configuration
Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
        // Check if this is a timer completion notification
        const isTimerCompletion = notification.request.content.data?.type === 'timer_completion';
        const onlyIfBackground = notification.request.content.data?.onlyIfBackground === true;
        
        // If it's a timer completion notification that should only show in background,
        // check current app state
        if (isTimerCompletion && onlyIfBackground) {
            const currentAppState = AppState.currentState;
            const isBackground = currentAppState !== 'active';
            
            // Only show notification if app is in background
            if (!isBackground) {
                console.log(
                    '[NotificationService] Suppressing notification - app is in foreground',
                );
                return {
                    shouldShowAlert: false,
                    shouldPlaySound: false,
                    shouldSetBadge: false,
                    shouldShowBanner: false,
                    shouldShowList: false,
                };
            }
        }
        
        // Default: show notification
        return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        };
    },
});

export interface TimerNotificationData {
    timerPhase: 'focus' | 'shortBreak' | 'longBreak';
    timeLeft: number;
    sessionNumber: number;
    todoTitle?: string;
}

class NotificationService {
    private isInitialized = false;
    private backgroundTimerTask: any = null;
    private appState: AppStateStatus = AppState.currentState;
    private appStateListener: any = null;

    async initialize(): Promise<boolean> {
        if (this.isInitialized) return true;

        try {
            // Request permissions
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.warn('Notification permissions not granted');
                return false;
            }

            // Configure notification channel for Android
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('timer-completion', {
                    name: 'Timer Completion',
                    description: 'Notifications when Pomodoro timer completes',
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                    sound: 'default',
                });

                await Notifications.setNotificationChannelAsync('timer-reminder', {
                    name: 'Timer Reminders',
                    description: 'Periodic reminders during timer sessions',
                    importance: Notifications.AndroidImportance.DEFAULT,
                    vibrationPattern: [0, 250],
                    lightColor: '#FF231F7C',
                    sound: 'default',
                });
            }

            // Configure notification categories for iOS
            if (Platform.OS === 'ios') {
                await Notifications.setNotificationCategoryAsync('TIMER_COMPLETION', [
                    {
                        identifier: 'CONTINUE_BREAK',
                        buttonTitle: 'Start Break',
                        options: {
                            isDestructive: false,
                            isAuthenticationRequired: false,
                        },
                    },
                    {
                        identifier: 'CONTINUE_FOCUS',
                        buttonTitle: 'Continue Focus',
                        options: {
                            isDestructive: false,
                            isAuthenticationRequired: false,
                        },
                    },
                ]);
            }

            // Register background task
            this.registerBackgroundTask();

            // Track app state changes
            this.setupAppStateListener();

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize notification service:', error);
            return false;
        }
    }

    private registerBackgroundTask() {
        // Register the background task
        TaskManager.defineTask(BACKGROUND_TIMER_TASK, async ({ data, error }) => {
            if (error) {
                console.error('Background timer task error:', error);
                return;
            }

            if (data) {
                const { timerPhase, timeLeft, sessionNumber, todoTitle } =
                    data as TimerNotificationData;

                // Send notification when timer completes (only in background)
                if (timeLeft <= 0 && this.isAppInBackground()) {
                    await this.sendTimerCompletionNotification(
                        timerPhase,
                        sessionNumber,
                        todoTitle,
                    );
                }
            }
        });
    }

    private setupAppStateListener() {
        // Listen to app state changes
        this.appStateListener = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            this.appState = nextAppState;
        });
    }

    /**
     * Check if app is currently in background
     */
    isAppInBackground(): boolean {
        return this.appState !== 'active';
    }

    /**
     * Get current app state
     */
    getAppState(): AppStateStatus {
        return this.appState;
    }

    async scheduleTimerNotification(data: TimerNotificationData): Promise<string | null> {
        try {
            if (!this.isInitialized) {
                const initialized = await this.initialize();
                if (!initialized) return null;
            }

            const { timerPhase, timeLeft, sessionNumber, todoTitle } = data;

            // Cancel any existing timer notifications
            await this.cancelTimerNotifications();

            // Calculate notification time (when timer will complete)
            const notificationTime = new Date(Date.now() + timeLeft * 1000);

            console.log('Scheduling notification for:', notificationTime.toISOString());
            console.log('Timer phase:', timerPhase, 'Time left:', timeLeft, 'seconds');

            // Create notification content
            const title = this.getNotificationTitle(timerPhase, sessionNumber);
            const body = this.getNotificationBody(timerPhase, todoTitle);

            // Schedule the notification with high priority
            // Note: Scheduled notifications will fire even if app is in foreground,
            // but we'll handle that by checking app state when the notification is received
            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data: {
                        timerPhase,
                        sessionNumber,
                        todoTitle,
                        type: 'timer_completion',
                        completionTime: notificationTime.getTime(),
                        onlyIfBackground: true, // Flag to check when notification fires
                    },
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    categoryIdentifier: 'TIMER_COMPLETION',
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: notificationTime,
                },
            });

            console.log('Notification scheduled with ID:', notificationId);
            return notificationId;
        } catch (error) {
            console.error('Failed to schedule timer notification:', error);
            return null;
        }
    }

    async schedulePreciseTimerNotification(endTime: Date): Promise<string | null> {
        try {
            if (!this.isInitialized) {
                const initialized = await this.initialize();
                if (!initialized) return null;
            }

            console.log('Scheduling precise notification for:', endTime.toISOString());

            // Cancel any existing timer notifications
            await this.cancelTimerNotifications();

            // Schedule notification for exact completion time
            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Timer Complete! 🎉',
                    body: 'Your Pomodoro session is finished',
                    data: {
                        type: 'timer_completion',
                        timestamp: endTime.getTime(),
                    },
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: endTime,
                },
            });

            console.log('Precise notification scheduled with ID:', notificationId);
            return notificationId;
        } catch (error) {
            console.error('Failed to schedule precise timer notification:', error);
            return null;
        }
    }

    async cancelTimerNotifications(): Promise<void> {
        try {
            // Cancel all scheduled notifications
            const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
            const timerNotifications = scheduledNotifications.filter(
                (notification) => notification.content.data?.type === 'timer_completion',
            );

            for (const notification of timerNotifications) {
                await Notifications.cancelScheduledNotificationAsync(notification.identifier);
            }
        } catch (error) {
            console.error('Failed to cancel timer notifications:', error);
        }
    }

    async sendTimerCompletionNotification(
        timerPhase: 'focus' | 'shortBreak' | 'longBreak',
        sessionNumber: number,
        todoTitle?: string,
        onlyIfBackground: boolean = true,
    ): Promise<void> {
        try {
            // Only send notification if app is in background (unless explicitly allowed)
            if (onlyIfBackground && !this.isAppInBackground()) {
                console.log(
                    '[NotificationService] Skipping notification - app is in foreground',
                );
                return;
            }

            const title = this.getNotificationTitle(timerPhase, sessionNumber);
            const body = this.getNotificationBody(timerPhase, todoTitle);

            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data: {
                        timerPhase,
                        sessionNumber,
                        todoTitle,
                        type: 'timer_completion',
                        onlyIfBackground: onlyIfBackground, // Flag for notification handler
                    },
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: null, // Immediate
            });
        } catch (error) {
            console.error('Failed to send timer completion notification:', error);
        }
    }

    private getNotificationTitle(
        timerPhase: 'focus' | 'shortBreak' | 'longBreak',
        sessionNumber: number,
    ): string {
        switch (timerPhase) {
            case 'focus':
                return `🎯 Focus Session ${sessionNumber} Complete!`;
            case 'shortBreak':
                return `☕ Short Break Complete!`;
            case 'longBreak':
                return `🌴 Long Break Complete!`;
            default:
                return '⏰ Timer Complete!';
        }
    }

    private getNotificationBody(
        timerPhase: 'focus' | 'shortBreak' | 'longBreak',
        todoTitle?: string,
    ): string {
        const baseMessage =
            timerPhase === 'focus'
                ? 'Great job! Time for a break.'
                : 'Break time is over. Ready to focus again?';

        return todoTitle ? `${baseMessage}\nTask: ${todoTitle}` : baseMessage;
    }

    async sendBreakReminderNotification(
        timerPhase: 'focus' | 'shortBreak' | 'longBreak',
        timeLeft: number,
    ): Promise<void> {
        try {
            const minutesLeft = Math.ceil(timeLeft / 60);
            const title =
                timerPhase === 'focus'
                    ? `⏰ Focus Session - ${minutesLeft} min left`
                    : `☕ Break Time - ${minutesLeft} min left`;

            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body: 'Keep up the great work!',
                    data: {
                        timerPhase,
                        type: 'timer_reminder',
                    },
                },
                trigger: null, // Immediate
            });
        } catch (error) {
            console.error('Failed to send break reminder notification:', error);
        }
    }

    async checkPermissions(): Promise<boolean> {
        try {
            const { status } = await Notifications.getPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            console.error('Failed to check notification permissions:', error);
            return false;
        }
    }

    async requestPermissions(): Promise<boolean> {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            console.error('Failed to request notification permissions:', error);
            return false;
        }
    }

    // Handle notification responses (iOS action buttons)
    async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
        try {
            const { actionIdentifier, notification } = response;
            const data = notification.request.content.data;

            console.log('Notification response:', actionIdentifier, data);

            if (actionIdentifier === 'CONTINUE_BREAK') {
                // User tapped "Start Break" button
                console.log('User wants to start break');
                // You can emit an event or call a callback here
            } else if (actionIdentifier === 'CONTINUE_FOCUS') {
                // User tapped "Continue Focus" button
                console.log('User wants to continue focus');
                // You can emit an event or call a callback here
            }
        } catch (error) {
            console.error('Failed to handle notification response:', error);
        }
    }

    /**
     * Cleanup method to remove app state listener
     */
    cleanup(): void {
        if (this.appStateListener) {
            this.appStateListener.remove();
            this.appStateListener = null;
        }
    }
}

// Export singleton instance
export const notificationService = new NotificationService();
