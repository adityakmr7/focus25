import AuthErrorBoundary from '@/components/AuthErrorBoundary';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import TypographyText from '@/components/TypographyText';
import { useTheme } from '@/hooks/useTheme';
import { notificationService } from '@/services/notification-service';
import { localDatabaseService } from '@/services/local-database-service';
import { optionalSyncService } from '@/services/optional-sync-service';
import { backgroundMetronomeService } from '@/services/background-metronome-service';
import { useAuthStore } from '@/stores/auth-store';
import { useSettingsStore } from '@/stores/local-settings-store';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
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

    // Initialize services on app start
    useEffect(() => {
        let authCleanup: (() => void) | undefined;

        const initializeServices = async () => {
            try {
                // Initialize local database first
                await localDatabaseService.initialize();
                console.log('Local database initialized');

                // Initialize auth state listener
                authCleanup = initializeAuth();

                // Initialize notification service
                await notificationService.initialize();

                // Initialize background metronome service
                await backgroundMetronomeService.initialize();

                // Initialize optional sync service
                await optionalSyncService.initialize();

                // Load settings from database
                await useSettingsStore.getState().loadSettings();
                console.log('Settings loaded from database');
            } catch (error) {
                console.error('Failed to initialize services:', error);
            }
        };

        initializeServices();

        // Set up notification response listener
        const notificationListener = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                notificationService.handleNotificationResponse(response);
            },
        );

        // Cleanup function
        return () => {
            if (authCleanup) {
                authCleanup();
            }
            // Close local database
            localDatabaseService.close();
            // Cleanup background metronome service
            backgroundMetronomeService.cleanup();
            // Remove notification listener
            notificationListener.remove();
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

    // Show loading screen while auth is initializing
    if (!isInitialized || loading) {
        return (
            <HeroUIProvider key={resolvedTheme} initialTheme={resolvedTheme}>
                <SafeAreaProvider>
                    <AuthLoadingScreen
                        message={loading ? 'Signing in...' : 'Initializing authentication...'}
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
