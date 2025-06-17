import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from "@react-navigation/native";
import { AppStackNavigation } from "./src/navigations";
import "./global.css";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Alert } from "react-native";
import { useSettingsStore } from "./src/store/settingsStore";
import { ThemeProvider } from "./src/providers/ThemeProvider";

// Enable screens before any navigation components are rendered
enableScreens();

const AppContent = () => {
  const { updateNotification } = useSettingsStore();

  useEffect(() => {
    (async () => {
      try {
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