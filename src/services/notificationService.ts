import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettingsStore } from '../store/settingsStore';

const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

export interface NotificationSettings {
    enabled: boolean;
    sessionComplete: boolean;
    breakComplete: boolean;
    dailyReminders: boolean;
    weeklyReports: boolean;
    motivationalMessages: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    reminderTime: string; // HH:MM format
}

const defaultSettings: NotificationSettings = {
    enabled: true,
    sessionComplete: true,
    breakComplete: true,
    dailyReminders: false, // Disabled by default to reduce spam
    weeklyReports: false, // Disabled by default to reduce spam
    motivationalMessages: false, // Disabled by default to reduce spam
    soundEnabled: true,
    vibrationEnabled: true,
    reminderTime: '09:00',
};

export class NotificationService {
    private static instance: NotificationService;
    private settings: NotificationSettings = defaultSettings;
    private isInitialized = false;

    static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    private isNotificationsEnabled(): boolean {
        const settingsStore = useSettingsStore.getState();
        return settingsStore.notifications;
    }

    async initialize(): Promise<boolean> {
        if (this.isInitialized) return true;

        try {
            // Load saved settings
            await this.loadSettings();

            // Request permissions
            const hasPermission = await this.requestPermissions();

            if (hasPermission) {
                // Schedule daily reminders if enabled
                if (this.settings.dailyReminders) {
                    await this.scheduleDailyReminder();
                }
            }

            this.isInitialized = true;
            return hasPermission;
        } catch (error) {
            console.error('Failed to initialize notification service:', error);
            return false;
        }
    }

    async requestPermissions(): Promise<boolean> {
        if (Platform.OS === 'web') {
            console.log('Notifications not supported on web');
            return false;
        }

        if (!Device.isDevice) {
            console.log('Must use physical device for notifications');
            return false;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return false;
        }

        // Configure notification channel for Android
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Flow Focus',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#48BB78',
                sound: 'default',
            });

            await Notifications.setNotificationChannelAsync('reminders', {
                name: 'Daily Reminders',
                importance: Notifications.AndroidImportance.DEFAULT,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#4299E1',
                sound: 'default',
            });
        }

        return true;
    }

    async loadSettings(): Promise<void> {
        try {
            const settingsString = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
            if (settingsString) {
                this.settings = { ...defaultSettings, ...JSON.parse(settingsString) };
            }
        } catch (error) {
            console.error('Failed to load notification settings:', error);
        }
    }

    async saveSettings(settings: Partial<NotificationSettings>): Promise<void> {
        try {
            this.settings = { ...this.settings, ...settings };
            await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save notification settings:', error);
        }
    }

    getSettings(): NotificationSettings {
        return { ...this.settings };
    }

    async scheduleSessionComplete(isBreak: boolean = false): Promise<void> {
        if (
            !this.isNotificationsEnabled() ||
            !this.settings.enabled ||
            (!this.settings.sessionComplete && !isBreak) ||
            (!this.settings.breakComplete && isBreak)
        ) {
            return;
        }

        const motivationalMessages = [
            "🎉 Amazing work! You're building incredible focus habits!",
            "🔥 You're on fire! That focus session was fantastic!",
            "⭐ Excellent! You're becoming a productivity master!",
            "🚀 Outstanding focus! You're reaching new heights!",
            '💪 Incredible dedication! Your consistency is inspiring!',
        ];

        const randomMessage =
            motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

        await Notifications.scheduleNotificationAsync({
            content: {
                title: isBreak ? 'Break Complete! 🌟' : 'Focus Session Complete! 🎯',
                body: isBreak
                    ? 'Ready to dive back into deep work?'
                    : this.settings.motivationalMessages
                      ? randomMessage
                      : 'Time for a well-deserved break!',
                sound: this.settings.soundEnabled,
                data: {
                    type: isBreak ? 'break_complete' : 'session_complete',
                    timestamp: Date.now(),
                },
            },
            trigger: null,
        });
    }

    async scheduleTimerCompletion(seconds: number, isBreak: boolean = false): Promise<void> {
        if (
            !this.isNotificationsEnabled() ||
            !this.settings.enabled ||
            (!this.settings.sessionComplete && !isBreak) ||
            (!this.settings.breakComplete && isBreak)
        ) {
            return;
        }

        // Cancel any existing timer notifications
        await this.cancelTimerNotifications();

        const motivationalMessages = [
            "🎉 Amazing work! You're building incredible focus habits!",
            "🔥 You're on fire! That focus session was fantastic!",
            "⭐ Excellent! You're becoming a productivity master!",
            "🚀 Outstanding focus! You're reaching new heights!",
            '💪 Incredible dedication! Your consistency is inspiring!',
        ];

        const randomMessage =
            motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: isBreak ? 'Break Complete! 🌟' : 'Focus Session Complete! 🎯',
                body: isBreak
                    ? 'Ready to dive back into deep work?'
                    : this.settings.motivationalMessages
                      ? randomMessage
                      : 'Time for a well-deserved break!',
                sound: this.settings.soundEnabled,
                data: {
                    type: isBreak ? 'break_complete' : 'session_complete',
                    isTimerNotification: true,
                    timestamp: Date.now(),
                },
            },
            trigger: {
                seconds: seconds,
            } as Notifications.TimeIntervalTriggerInput,
        });
    }

    async cancelTimerNotifications(): Promise<void> {
        const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

        for (const notification of scheduledNotifications) {
            if (notification.content.data?.isTimerNotification) {
                await Notifications.cancelScheduledNotificationAsync(notification.identifier);
                console.log(`🚫 Cancelled timer notification: ${notification.identifier}`);
            }
        }
    }

    async scheduleBreakReminder(minutes: number): Promise<void> {
        if (!this.isNotificationsEnabled() || !this.settings.enabled) return;

        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Break Time! ☕',
                body: `Take a ${minutes}-minute break to recharge your mind.`,
                sound: this.settings.soundEnabled,
                data: {
                    type: 'break_reminder',
                    duration: minutes,
                },
            },
            trigger: null,
        });
    }

    async scheduleDailyReminder(): Promise<void> {
        if (
            !this.isNotificationsEnabled() ||
            !this.settings.enabled ||
            !this.settings.dailyReminders
        )
            return;

        // Cancel existing daily reminders
        await this.cancelNotificationsByType('daily_reminder');

        const [hours, minutes] = this.settings.reminderTime.split(':').map(Number);

        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Time to Focus! 🎯',
                body: 'Start your day with a productive focus session.',
                sound: this.settings.soundEnabled,
                data: {
                    type: 'daily_reminder',
                },
            },

            trigger: {
                channelId: 'scheduleNotificationAsync',
                hour: hours,
                minute: minutes,
                repeats: true,
            },
        });
    }

    async cancelAllNotifications(): Promise<void> {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }

    async cancelNotificationsByType(type: string): Promise<void> {
        const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

        for (const notification of scheduledNotifications) {
            if (notification.content.data?.type === type) {
                await Notifications.cancelScheduledNotificationAsync(notification.identifier);
            }
        }
    }

    async updateReminderTime(time: string): Promise<void> {
        await this.saveSettings({ reminderTime: time });
        if (this.settings.dailyReminders) {
            await this.scheduleDailyReminder();
        }
    }

    async toggleNotificationType(
        type: keyof NotificationSettings,
        enabled: boolean,
    ): Promise<void> {
        await this.saveSettings({ [type]: enabled });

        // Reschedule relevant notifications
        if (type === 'dailyReminders') {
            if (enabled) {
                await this.scheduleDailyReminder();
            } else {
                await this.cancelNotificationsByType('daily_reminder');
            }
        } else if (type === 'weeklyReports') {
            if (enabled) {
                await this.scheduleWeeklyReport();
            } else {
                await this.cancelNotificationsByType('weekly_report');
            }
        }
    }

    isSupported(): boolean {
        return Platform.OS !== 'web' && Device.isDevice;
    }
}

export const notificationService = NotificationService.getInstance();
