import AuthErrorBoundary from '@/components/AuthErrorBoundary';
import EnhancedLoadingScreen from '@/components/EnhancedLoadingScreen';
import TypographyText from '@/components/TypographyText';
import { useTheme } from '@/hooks/useTheme';
import { splashScreenService } from '@/services/splash-screen-service';
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
    const { initializeAuth, error } = useAuthStore();
    const router = useRouter();
    const segments = useSegments();
    const [isSplashScreenReady, setIsSplashScreenReady] = useState(false);

    // Initialize splash screen and services
    useEffect(() => {
        let authCleanup: (() => void) | undefined;

        const initializeApp = async () => {
            try {
                // Initialize splash screen service
                await splashScreenService.initialize();

                // Set up notification response listener
                const notificationListener = Notifications.addNotificationResponseReceivedListener(
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

                // Cleanup function
                return () => {
                    if (authCleanup) {
                        authCleanup();
                    }
                    notificationListener.remove();
                };
            } catch (error) {
                console.error('Failed to initialize app:', error);
                setIsSplashScreenReady(true); // Still show app even if initialization fails
            }
        };

        initializeApp();

        // Cleanup function
        return () => {
            // Cleanup will be handled by individual services
        };
    }, [initializeAuth]);

    // Handle onboarding navigation (NO authentication required for basic app usage)
    useEffect(() => {
        const inAuthGroup = segments[0] === 'onboarding';

        // If user hasn't completed onboarding, show onboarding screen
        if (!onboardingCompleted && !inAuthGroup) {
            router.replace('/onboarding');
            return;
        }

        // If user completed onboarding but is still on onboarding screen, go to main app
        if (onboardingCompleted && inAuthGroup) {
            router.replace('/(tabs)');
            return;
        }
    }, [onboardingCompleted, segments, router]);

    // Show loading screen only while splash screen is not ready
    // Auth initialization is non-blocking - app can function without auth
    if (!isSplashScreenReady) {
        return (
            <HeroUIProvider key={resolvedTheme} initialTheme={resolvedTheme}>
                <SafeAreaProvider>
                    <EnhancedLoadingScreen message="Initializing app..." showProgress={true} />
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
                                backgroundColor: resolvedTheme === 'dark' ? '#007AFF' : '#007AFF',
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
        <AuthErrorBoundary>
            <HeroUIProvider key={resolvedTheme} initialTheme={resolvedTheme}>
                <ToastProvider>
                    <SafeAreaProvider>
                        <Stack>
                            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            <Stack.Screen
                                name="(create-todo)"
                                options={{ headerShown: false, presentation: 'modal' }}
                            />
                            <Stack.Screen
                                name="subscription"
                                options={{ headerShown: false, presentation: 'modal' }}
                            />
                            <Stack.Screen name="+not-found" />
                        </Stack>
                        <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
                    </SafeAreaProvider>
                </ToastProvider>
            </HeroUIProvider>
        </AuthErrorBoundary>
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
