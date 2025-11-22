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
import { Stack, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, View, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HeroUIProvider, ToastProvider, useTheme } from 'react-native-heroui';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { SwitchThemeProvider } from '@/components/telegram-theme-switch/components/switch-theme';
import { ThemeProvider } from '@/components/telegram-theme-switch/components/theme-provider';
// Inner component that uses the theme hook
function AppContent() {
    const { themeMode } = useTheme();
    const { onboardingCompleted } = useSettingsStore();
    const { initializeAuth, isInitialized, loading, error, user } = useAuthStore();
    const [isSplashScreenReady, setIsSplashScreenReady] = useState(false);
    const segments = useSegments();
    const router = useRouter();

    // Initialize splash screen and services
    useEffect(() => {
        let authCleanup: (() => void) | undefined;
        let notificationListener: Notifications.Subscription | undefined;

        const initializeApp = async () => {
            try {
                // Initialize network service
                await networkService.initialize();

                // Initialize RevenueCat service (iOS only)
                // await revenueCatService.initialize();

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

    // Handle route protection based on authentication state
    useEffect(() => {
        if (!isSplashScreenReady || !isInitialized || loading) {
            return; // Don't navigate while loading
        }

        const currentRoute = segments[0];
        const inAuthGroup = currentRoute === 'auth';

        if (!user && !inAuthGroup) {
            // User is not authenticated and not on auth screen, redirect to auth
            router.replace('/auth' as any);
        } else if (user && inAuthGroup) {
            // User is authenticated but on auth screen, redirect to main app
            // Skip onboarding check for now since onboarding route doesn't exist
            router.replace('/(tabs)' as any);
        }
        // Note: Onboarding check is skipped since onboarding route doesn't exist yet
        // When onboarding is implemented, uncomment:
        // else if (user && !onboardingCompleted && !inOnboardingGroup && !inAuthGroup && !inTabsGroup) {
        //     router.replace('/onboarding' as any);
        // }
    }, [user, isInitialized, loading, isSplashScreenReady, segments, onboardingCompleted, router]);

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
                        <Stack.Screen name="auth" options={{ headerShown: false }} />
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
            <HeroUIProvider>
                <SwitchThemeProvider>
                    <ThemeProvider>
                        <AppContent />
                    </ThemeProvider>
                </SwitchThemeProvider>
            </HeroUIProvider>
        </GestureHandlerRootView>
    );
}
