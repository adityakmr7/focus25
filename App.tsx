import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from "@react-navigation/native";
import { AppStackNavigation } from "./src/navigations";
import "./global.css";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Alert } from "react-native";
import { useSettingsStore } from "./src/store/settingsStore";
import { useGoalsStore } from "./src/store/goalsStore";
import { useStatisticsStore } from "./src/store/statisticsStore";
import { usePomodoroStore } from "./src/store/pomodoroStore";
import { useThemeStore } from "./src/store/themeStore";
import { ThemeProvider } from "./src/providers/ThemeProvider";
import { initializeDatabase } from "./src/services/database";

// Enable screens before any navigation components are rendered
enableScreens();

const AppContent = () => {
  const { updateNotification, initializeStore: initializeSettings } = useSettingsStore();
  const { initializeStore: initializeGoals } = useGoalsStore();
  const { initializeStore: initializeStatistics } = useStatisticsStore();
  const { initializeStore: initializePomodoro } = usePomodoroStore();
  const { initializeStore: initializeTheme } = useThemeStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize database first
        await initializeDatabase();
        
        // Initialize all stores
        await Promise.all([
          initializeSettings(),
          initializeGoals(),
          initializeStatistics(),
          initializePomodoro(),
          initializeTheme(),
        ]);
        
        console.log('App initialized successfully');
      } catch (error) {
        console.error('Failed to initialize app:', error);
        Alert.alert(
          'Initialization Error',
          'Failed to initialize the app. Some features may not work properly.'
        );
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    (async () => {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status: requestedStatus } =
          await Notifications.requestPermissionsAsync();
        finalStatus = requestedStatus;
      }

      updateNotification(finalStatus);
      if (finalStatus !== "granted") {
        Alert.alert(
          "Notifications Disabled",
          "Please enable notifications in your device settings."
        );
      }
    })();
  }, []);
  
  return (
    <NavigationContainer>
      <AppStackNavigation />
    </NavigationContainer>
  );
};

export default function App() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}