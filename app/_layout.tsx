import React from 'react';
import AuthErrorBoundary from '@/components/AuthErrorBoundary';
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';
import OfflineIndicator from '@/components/OfflineIndicator';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import EnhancedLoadingScreen from '@/components/EnhancedLoadingScreen';
import TypographyText from '@/components/TypographyText';
import { useTheme } from '@/hooks/useTheme';
import { splashScreenService } from '@/services/splash-screen-service';
import { networkService } from '@/services/network-service';
import { errorHandlingService } from '@/services/error-handling-service';
import { showError } from '@/utils/error-toast';
import { useAuthStore } from '@/stores/auth-store';
import { useSettingsStore } from '@/stores/local-settings-store';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HeroUIProvider, ToastProvider } from 'react-native-heroui';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
// Inner component that uses the theme hook
function AppContent() {
    const { resolvedTheme } = useTheme();
    const { onboardingCompleted } = useSettingsStore();
    const { initializeAuth, isInitialized, loading, error } = useAuthStore();
    const router = useRouter();
    const segments = useSegments();
    const [isSplashScreenReady, setIsSplashScreenReady] = useState(false);

    // Initialize splash screen and services
    useEffect(() => {
        let authCleanup: (() => void) | undefined;
        let notificationListener: Notifications.Subscription | undefined;

        const initializeApp = async () => {
            try {
                // Initialize network service
                await networkService.initialize();

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

    // Handle onboarding navigation (authentication is now handled by ProtectedRoute)
    useEffect(() => {
        const { user } = useAuthStore.getState();
        const inAuthGroup = segments[0] === 'onboarding';

        // If user is authenticated and has completed onboarding but is on onboarding screen
        if (user && onboardingCompleted && inAuthGroup) {
            router.replace('/(tabs)');
            return;
        }

        // If user is authenticated but hasn't completed onboarding and not on onboarding screen
        if (user && !onboardingCompleted && !inAuthGroup) {
            router.replace('/onboarding');
            return;
        }
    }, [onboardingCompleted, segments, router]);

    // Show loading screen while splash screen is not ready or auth is initializing
    if (!isSplashScreenReady || !isInitialized || loading) {
        return (
            <HeroUIProvider key={resolvedTheme} initialTheme={resolvedTheme}>
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
            </HeroUIProvider>
        );
    }

    // Show error screen if there's an auth error
    if (error) {
        return (
            <HeroUIProvider key={resolvedTheme} initialTheme={resolvedTheme}>
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
            </HeroUIProvider>
        );
    }

    return (
        <GlobalErrorBoundary>
            <AuthErrorBoundary>
                <HeroUIProvider key={resolvedTheme} initialTheme={resolvedTheme}>
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
                                <Stack.Screen name="+not-found" />
                            </Stack>
                            <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
                        </SafeAreaProvider>
                    </ToastProvider>
                </HeroUIProvider>
            </AuthErrorBoundary>
        </GlobalErrorBoundary>
    );
}

export default function RootLayout() {
    const [loaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });

    if (!loaded) {
        // Async font loading only occurs in development.
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AppContent />
        </GestureHandlerRootView>
    );
}
