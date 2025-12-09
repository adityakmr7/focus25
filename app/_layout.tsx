import React, { useState, useEffect, useCallback } from 'react';
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';
import OfflineIndicator from '@/components/OfflineIndicator';
import EnhancedLoadingScreen from '@/components/EnhancedLoadingScreen';
import TypographyText from '@/components/TypographyText';
import { splashScreenService } from '@/services/splash-screen-service';
import { networkService } from '@/services/network-service';
import { errorHandlingService } from '@/services/error-handling-service';
import { revenueCatService } from '@/services/revenuecat-service';
import { performanceMonitor } from '@/services/performance-monitor';
import { useAuthStore } from '@/stores/auth-store';
import { useSettingsStore } from '@/stores/local-settings-store';
import { useFonts } from 'expo-font';
import { Stack, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, View, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { SwitchThemeProvider } from '@/components/telegram-theme-switch/components/switch-theme';
import { ThemeProvider } from '@/components/telegram-theme-switch/components/theme-provider';
import { useColorTheme } from '@/hooks/useColorTheme';

// Inner component that uses the theme hook
function AppContent() {
    const colors = useColorTheme();
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
                // Start tracking app initialization
                performanceMonitor.startMetric('app-initialization');

                // Parallelize service initialization for better performance
                const [networkResult, revenueCatResult, splashScreenResult] = await Promise.allSettled([
                    networkService.initialize(),
                    revenueCatService.initialize(), // iOS only, will handle gracefully on Android
                    splashScreenService.initialize(),
                ]);

                // Log any initialization failures (but don't block app startup)
                if (networkResult.status === 'rejected') {
                    errorHandlingService.processError(networkResult.reason, { action: 'initializeNetwork' });
                }
                if (revenueCatResult.status === 'rejected') {
                    errorHandlingService.processError(revenueCatResult.reason, { action: 'initializeRevenueCat' });
                }
                if (splashScreenResult.status === 'rejected') {
                    errorHandlingService.processError(splashScreenResult.reason, { action: 'initializeSplashScreen' });
                }

                // Set up notification response listener (non-blocking)
                notificationListener = Notifications.addNotificationResponseReceivedListener(
                    (response) => {
                        // Handle notification response when services are ready
                        // This will be handled by the notification service after initialization
                    },
                );

                // Wait for splash screen initialization to complete
                await splashScreenService.waitForInitialization();

                // Initialize auth (this is critical, so we do it after core services)
                performanceMonitor.startMetric('auth-initialization');
                authCleanup = initializeAuth();
                performanceMonitor.endMetric('auth-initialization');

                // Mark app as ready
                setIsSplashScreenReady(true);

                // End tracking and log startup time
                performanceMonitor.endMetric('app-initialization');
                performanceMonitor.trackTimeToInteractive();
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
    // Memoize the navigation logic to prevent unnecessary re-renders
    const handleRouteProtection = useCallback(() => {
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
    }, [user, isInitialized, loading, isSplashScreenReady, segments, router]);

    useEffect(() => {
        handleRouteProtection();
    }, [handleRouteProtection]);

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
                            backgroundColor: colors.backgroundSecondary,
                            borderRadius: 8,
                            marginTop: 16,
                        }}
                    >
                        <TypographyText
                            variant="body"
                            style={{ color: colors.contentPrimary, textAlign: 'center' }}
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
                <StatusBar style={colors.backgroundPrimary === '#FFFFFF' ? 'light' : 'dark'} />
            </SafeAreaProvider>
        </GlobalErrorBoundary>
    );
}

export default function RootLayout() {
    const [loaded, error] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });

    // Don't block app startup if fonts fail to load
    // The app will use system fonts as fallback
    if (error) {
        console.warn('[RootLayout] Font loading error:', error);
    }

    if (!loaded && !error) {
        // Only show loading state if fonts are still loading and no error occurred
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SwitchThemeProvider>
                <ThemeProvider>
                    <AppContent />
                </ThemeProvider>
            </SwitchThemeProvider>
        </GestureHandlerRootView>
    );
}
