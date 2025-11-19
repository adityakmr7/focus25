import React, { useState, useEffect } from 'react';
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';
import OfflineIndicator from '@/components/OfflineIndicator';
import EnhancedLoadingScreen from '@/components/EnhancedLoadingScreen';
import TypographyText from '@/components/TypographyText';
import { splashScreenService } from '@/services/splash-screen-service';
import { networkService } from '@/services/network-service';
import { errorHandlingService } from '@/services/error-handling-service';
import { revenueCatService } from '@/services/revenuecat-service';
import { useAuthStore } from '@/stores/auth-store';
import { useSettingsStore } from '@/stores/local-settings-store';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, View, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HeroUIProvider, ToastProvider, useTheme } from 'react-native-heroui';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
// Inner component that uses the theme hook
function AppContent() {
    const { theme, themeMode } = useTheme();
    const { onboardingCompleted } = useSettingsStore();
    const { initializeAuth, isInitialized, loading, error } = useAuthStore();
    const [isSplashScreenReady, setIsSplashScreenReady] = useState(false);

    // Initialize splash screen and services
    useEffect(() => {
        let authCleanup: (() => void) | undefined;
        let notificationListener: Notifications.Subscription | undefined;

        const initializeApp = async () => {
            try {
                // Initialize network service
                await networkService.initialize();

                // Initialize RevenueCat service (iOS only)
                await revenueCatService.initialize();

                // Initialize splash screen service
                await splashScreenService.initialize();

                // Set up notification response listener
                notificationListener = Notifications.addNotificationResponseReceivedListener(
                    (response) => {
                        // Handle notification response when services are ready
                        // This will be handled by the notification service after initialization
                    },
                );

                // Wait for all initialization to complete
                await splashScreenService.waitForInitialization();

                // Get auth cleanup function
                authCleanup = initializeAuth();

                setIsSplashScreenReady(true);
            } catch (error) {
                errorHandlingService.processError(error, { action: 'initializeApp' });
                setIsSplashScreenReady(true); // Still show app even if initialization fails
            }
        };

        initializeApp();

        // Cleanup function
        return () => {
            if (authCleanup) {
                authCleanup();
            }
            if (notificationListener) {
                notificationListener.remove();
            }
            networkService.cleanup();
        };
    }, [initializeAuth]);

    // Show loading screen while splash screen is not ready or auth is initializing
    if (!isSplashScreenReady || !isInitialized || loading) {
        return (
            <SafeAreaProvider>
                <EnhancedLoadingScreen
                    message={
                        !isSplashScreenReady
                            ? 'Initializing app...'
                            : loading
                              ? 'Signing in...'
                              : 'Initializing authentication...'
                    }
                    showProgress={!isSplashScreenReady}
                />
            </SafeAreaProvider>
        );
    }

    // Show error screen if there's an auth error
    if (error) {
        return (
            <SafeAreaProvider>
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 20,
                    }}
                >
                    <TypographyText
                        variant="title"
                        style={{ marginBottom: 16, textAlign: 'center' }}
                    >
                        Authentication Error
                    </TypographyText>
                    <TypographyText
                        variant="body"
                        style={{ marginBottom: 24, textAlign: 'center', opacity: 0.7 }}
                    >
                        {error}
                    </TypographyText>
                    <TouchableOpacity
                        onPress={() => {
                            // Clear error and retry
                            useAuthStore.getState().clearError();
                            // Restart the app by reinitializing auth
                            const cleanup = useAuthStore.getState().initializeAuth();
                            setTimeout(() => cleanup(), 100);
                        }}
                        style={{
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                            backgroundColor: '#007AFF',
                            borderRadius: 8,
                            marginTop: 16,
                        }}
                    >
                        <TypographyText
                            variant="body"
                            style={{ color: 'white', textAlign: 'center' }}
                        >
                            Try Again
                        </TypographyText>
                    </TouchableOpacity>
                </View>
            </SafeAreaProvider>
        );
    }

    return (
        <GlobalErrorBoundary>
            <ToastProvider>
                <SafeAreaProvider>
                    <OfflineIndicator />
                    <Stack>
                        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen
                            name="(create-todo)"
                            options={{ headerShown: false, presentation: 'modal' }}
                        />
                        <Stack.Screen
                            name="plan"
                            options={{ headerShown: false, presentation: 'modal' }}
                        />
                        <Stack.Screen name="+not-found" />
                    </Stack>
                    <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
                </SafeAreaProvider>
            </ToastProvider>
        </GlobalErrorBoundary>
    );
}

export default function RootLayout() {
    const [loaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });
    const systemColorScheme = useColorScheme();
    const { themeMode } = useSettingsStore();
    const resolvedTheme =
        themeMode === 'system' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : themeMode;

    if (!loaded) {
        // Async font loading only occurs in development.
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <HeroUIProvider key={resolvedTheme} initialTheme={resolvedTheme}>
                <AppContent />
            </HeroUIProvider>
        </GestureHandlerRootView>
    );
}
