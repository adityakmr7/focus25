import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useSettingsStore } from '../store/settingsStore';

export class NotificationManager {
  private static instance: NotificationManager | null = null;

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status: requestedStatus } =
          await Notifications.requestPermissionsAsync();
        finalStatus = requestedStatus;
      }

      // Update settings store with permission status
      const { updateNotification } = useSettingsStore.getState();
      updateNotification(finalStatus);

      const granted = finalStatus === 'granted';

      if (granted) {
        console.log('✅ Notification permissions granted');
      } else {
        console.log('❌ Notification permissions denied');
      }

      return granted;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  setupNotificationHandlers(): () => void {
    if (Platform.OS === 'web') {
      return () => {};
    }

    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Handle notification responses
    const subscription = Notifications.addNotificationResponseReceivedListener(
      response => {
        const data = response.notification.request.content.data;
        console.log('📱 Notification response received:', data);

        this.handleNotificationResponse(data);
      }
    );

    return () => subscription.remove();
  }

  private handleNotificationResponse(data: Record<string, any>): void {
    switch (data?.type) {
      case 'session_complete':
      case 'break_complete':
        console.log('Timer notification received:', data);
        // Could navigate to timer screen or show completion modal
        break;
      case 'daily_reminder':
        console.log('Daily reminder received');
        // Could navigate to timer screen
        break;
      case 'goal_achievement':
        console.log('Goal achievement notification:', data);
        // Could show achievement celebration
        break;
      default:
        console.log('Unknown notification type:', data?.type);
    }
  }
}

export const notificationManager = NotificationManager.getInstance();
