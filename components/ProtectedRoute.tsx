import TypographyText from "@/components/TypographyText";
import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/setting-store";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-heroui";
import AuthLoadingScreen from "./AuthLoadingScreen";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isInitialized, loading } = useAuthStore();
  const { onboardingCompleted } = useSettingsStore();
  const { theme } = useTheme();

  useEffect(() => {
    // If auth is initialized and user is not authenticated, redirect to onboarding
    if (isInitialized && !user) {
      router.replace("/onboarding");
      return;
    }

    // If user is authenticated but hasn't completed onboarding, redirect to onboarding
    if (user && !onboardingCompleted) {
      router.replace("/onboarding");
      return;
    }
  }, [user, isInitialized, onboardingCompleted]);

  // Show loading screen while checking authentication
  if (!isInitialized || loading) {
    return (
      <AuthLoadingScreen
        message={loading ? "Verifying authentication..." : "Loading..."}
      />
    );
  }

  // If user is not authenticated, show access denied message
  if (!user) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <TypographyText variant="title" style={styles.title}>
          Access Denied
        </TypographyText>
        <TypographyText variant="body" style={styles.message}>
          You need to sign in to access this screen.
        </TypographyText>
      </View>
    );
  }

  // If user is authenticated but hasn't completed onboarding
  if (user && !onboardingCompleted) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <TypographyText variant="title" style={styles.title}>
          Complete Setup
        </TypographyText>
        <TypographyText variant="body" style={styles.message}>
          Please complete the onboarding process to continue.
        </TypographyText>
      </View>
    );
  }

  // User is authenticated and has completed onboarding, render the protected content
  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    opacity: 0.7,
  },
});

export default ProtectedRoute;
