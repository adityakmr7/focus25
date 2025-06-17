import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from "@react-navigation/native";
import { AppStackNavigation } from "./src/navigations";
import "./global.css";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useEffect } from "react";
import { Alert, Platform } from "react-native";
import { useSettingsStore } from "./src/store/settingsStore";
import { ThemeProvider } from "./src/providers/ThemeProvider";

// Enable screens before any navigation components are rendered
enableScreens();

const AppContent = () => {
  const { updateNotification } = useSettingsStore();

  useEffect(() => {
    (async () => {
      try {
        // Check if we're on a physical device (required for push notifications)
        if (Platform.OS === 'android' && !Device.isDevice) {
          console.warn('Must use physical device for push notifications');
        }

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
      } catch (error) {
        console.error("Error requesting notification permissions:", error);
        // Set a default status if permission request fails
        updateNotification("denied");
      }
    })();
  }, [updateNotification]);
  
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