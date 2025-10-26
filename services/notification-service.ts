import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";

// Task name for background timer
const BACKGROUND_TIMER_TASK = "BACKGROUND_TIMER_TASK";

// Notification configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface TimerNotificationData {
  timerPhase: "focus" | "shortBreak" | "longBreak";
  timeLeft: number;
  sessionNumber: number;
  todoTitle?: string;
}

class NotificationService {
  private isInitialized = false;
  private backgroundTimerTask: any = null;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Request permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("Notification permissions not granted");
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("timer-completion", {
          name: "Timer Completion",
          description: "Notifications when Pomodoro timer completes",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
          sound: "default",
        });

        await Notifications.setNotificationChannelAsync("timer-reminder", {
          name: "Timer Reminders",
          description: "Periodic reminders during timer sessions",
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250],
          lightColor: "#FF231F7C",
          sound: "default",
        });
      }

      // Register background task
      this.registerBackgroundTask();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize notification service:", error);
      return false;
    }
  }

  private registerBackgroundTask() {
    // Register the background task
    TaskManager.defineTask(BACKGROUND_TIMER_TASK, async ({ data, error }) => {
      if (error) {
        console.error("Background timer task error:", error);
        return;
      }

      if (data) {
        const { timerPhase, timeLeft, sessionNumber, todoTitle } =
          data as TimerNotificationData;

        // Send notification when timer completes
        if (timeLeft <= 0) {
          await this.sendTimerCompletionNotification(
            timerPhase,
            sessionNumber,
            todoTitle
          );
        }
      }
    });
  }

  async scheduleTimerNotification(
    data: TimerNotificationData
  ): Promise<string | null> {
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

      // Create notification content
      const title = this.getNotificationTitle(timerPhase, sessionNumber);
      const body = this.getNotificationBody(timerPhase, todoTitle);

      // Schedule the notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            timerPhase,
            sessionNumber,
            todoTitle,
            type: "timer_completion",
          },
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationTime,
        },
      });

      return notificationId;
    } catch (error) {
      console.error("Failed to schedule timer notification:", error);
      return null;
    }
  }

  async cancelTimerNotifications(): Promise<void> {
    try {
      // Cancel all scheduled notifications
      const scheduledNotifications =
        await Notifications.getAllScheduledNotificationsAsync();
      const timerNotifications = scheduledNotifications.filter(
        (notification) => notification.content.data?.type === "timer_completion"
      );

      for (const notification of timerNotifications) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
      }
    } catch (error) {
      console.error("Failed to cancel timer notifications:", error);
    }
  }

  async sendTimerCompletionNotification(
    timerPhase: "focus" | "shortBreak" | "longBreak",
    sessionNumber: number,
    todoTitle?: string
  ): Promise<void> {
    try {
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
            type: "timer_completion",
          },
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Immediate
      });
    } catch (error) {
      console.error("Failed to send timer completion notification:", error);
    }
  }

  private getNotificationTitle(
    timerPhase: "focus" | "shortBreak" | "longBreak",
    sessionNumber: number
  ): string {
    switch (timerPhase) {
      case "focus":
        return `🎯 Focus Session ${sessionNumber} Complete!`;
      case "shortBreak":
        return `☕ Short Break Complete!`;
      case "longBreak":
        return `🌴 Long Break Complete!`;
      default:
        return "⏰ Timer Complete!";
    }
  }

  private getNotificationBody(
    timerPhase: "focus" | "shortBreak" | "longBreak",
    todoTitle?: string
  ): string {
    const baseMessage =
      timerPhase === "focus"
        ? "Great job! Time for a break."
        : "Break time is over. Ready to focus again?";

    return todoTitle ? `${baseMessage}\nTask: ${todoTitle}` : baseMessage;
  }

  async sendBreakReminderNotification(
    timerPhase: "focus" | "shortBreak" | "longBreak",
    timeLeft: number
  ): Promise<void> {
    try {
      const minutesLeft = Math.ceil(timeLeft / 60);
      const title =
        timerPhase === "focus"
          ? `⏰ Focus Session - ${minutesLeft} min left`
          : `☕ Break Time - ${minutesLeft} min left`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: "Keep up the great work!",
          data: {
            timerPhase,
            type: "timer_reminder",
          },
        },
        trigger: null, // Immediate
      });
    } catch (error) {
      console.error("Failed to send break reminder notification:", error);
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Failed to check notification permissions:", error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Failed to request notification permissions:", error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
