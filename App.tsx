import 'react-native-get-random-values';

import React, { useEffect, useState } from 'react';
import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from '@react-navigation/native';
import { AppStackNavigation } from './src/navigations';
import './global.css';
import * as Notifications from 'expo-notifications';
import { Alert, AppState, AppStateStatus, Platform, View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSettingsStore } from './src/store/settingsStore';
import { useStatisticsStore } from './src/store/statisticsStore';
import { usePomodoroStore } from './src/store/pomodoroStore';
import { useThemeStore } from './src/store/themeStore';
import { AuthProvider } from './src/components/AuthProvider';
import { hybridDatabaseService } from './src/data/hybridDatabase';
import { backgroundTimerService } from './src/services/backgroundTimer';
import { notificationService } from './src/services/notificationService';
import { errorHandler } from './src/services/errorHandler';
import { updateService } from './src/services/updateService';
import { shouldShowOnboarding } from './src/components/OnboardingFlow';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AudioCacheManager } from './src/utils/audioCache';
import { MusicTrack, musicTracks } from './src/utils/constants';
import { localDatabaseService } from './src/data/local/localDatabase';
import { seedDatabase } from './src/utils/seedData';
import * as Font from 'expo-font';
// Enable screens before any navigation components are rendered
enableScreens();

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const AppContent = () => {
    const { updateNotification, initializeStore: initializeSettings } = useSettingsStore();
    const { initializeStore: initializeStatistics } = useStatisticsStore();
    const { initializeStore: initializePomodoro } = usePomodoroStore();
    const { initializeStore: initializeTheme, mode, getCurrentTheme } = useThemeStore();
    const systemColorScheme = useColorScheme();

    const [showOnboarding, setShowOnboarding] = useState(false);
    const [isAppReady, setIsAppReady] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);

    // Database initialization and seeding
    useEffect(() => {
        const initializeDatabaseAndSeed = async () => {
            try {
                console.log('🔄 Initializing database...');

                // Initialize local database first
                await localDatabaseService.initializeDatabase();
                console.log('✅ Local database initialized');

                // Check if database needs seeding (only in development)
                if (__DEV__) {
                    setIsSeeding(true);

                    try {
                        const [statistics] = await Promise.all([
                            localDatabaseService.getStatistics(),
                        ]);

                        console.log('📊 Database status:', {
                            hasStatistics: statistics.totalCount > 0,
                        });

                        // Seed if database is empty
                        if (statistics.totalCount === 0) {
                            console.log('🌱 Database is empty, starting seeding...');
                            await seedDatabase(localDatabaseService, { all: true });
                            console.log('✅ Database seeding completed successfully!');
                        } else {
                            console.log('📚 Database already contains data, skipping seeding');
                        }
                    } catch (seedError) {
                        console.error('❌ Seeding failed:', seedError);
                        // Don't throw - app should still work without seed data
                    } finally {
                        setIsSeeding(false);
                    }
                }
            } catch (error) {
                console.error('❌ Database initialization failed:', error);
                setIsSeeding(false);
                throw error; // Re-throw to be handled by main initialization
            }
        };

        initializeDatabaseAndSeed();
    }, []);

    // Main app initialization
    useEffect(() => {
        const initializeApp = async () => {
            try {
                console.log('🚀 Starting app initialization...');

                // Load fonts first
                await Font.loadAsync({
                    'SF-Pro-Display-Ultralight': require('./assets/fonts/SF-Pro-Display-Ultralight.otf'),
                    'SF-Pro-Display-Thin': require('./assets/fonts/SF-Pro-Display-Thin.otf'),
                    'SF-Pro-Display-Light': require('./assets/fonts/SF-Pro-Display-Light.otf'),
                    'SF-Pro-Display-Regular': require('./assets/fonts/SF-Pro-Display-Regular.otf'),
                    'SF-Pro-Display-Medium': require('./assets/fonts/SF-Pro-Display-Medium.otf'),
                    'SF-Pro-Display-Semibold': require('./assets/fonts/SF-Pro-Display-Semibold.otf'),
                    'SF-Pro-Display-Bold': require('./assets/fonts/SF-Pro-Display-Bold.otf'),
                    'SF-Pro-Display-Heavy': require('./assets/fonts/SF-Pro-Display-Heavy.otf'),
                });
                console.log('✅ SF Pro Display fonts loaded');

                // Initialize error handler first
                await errorHandler.initialize();
                console.log('✅ Error handler initialized');

                // Initialize hybrid database service
                await hybridDatabaseService.initializeDatabase();
                console.log('✅ Hybrid database service initialized');

                // Initialize all stores in parallel
                console.log('🔄 Initializing stores...');
                await Promise.all([
                    initializeSettings(),
                    initializeStatistics(),
                    initializePomodoro(),
                    initializeTheme(),
                ]);
                console.log('✅ All stores initialized');

                // Initialize background services (mobile only)
                if (Platform.OS !== 'web') {
                    console.log('🔄 Initializing background services...');
                    await Promise.all([
                        backgroundTimerService.initialize(),
                        notificationService.initialize(),
                        updateService.initialize(),
                    ]);
                    console.log('✅ Background services initialized');
                }

                // Check onboarding status
                const shouldShow = await shouldShowOnboarding();
                setShowOnboarding(shouldShow);
                console.log('🎯 Onboarding status:', shouldShow ? 'show' : 'skip');

                // Request notification permissions (mobile only)
                if (Platform.OS !== 'web') {
                    await handleNotificationPermissions();
                }

                // Pre-download popular music tracks
                await preDownloadPopularTracks();

                // Check for app updates (mobile only)
                if (Platform.OS !== 'web') {
                    try {
                        console.log('🔄 Checking for app updates...');
                        await updateService.checkForUpdatesAndShow();
                        console.log('✅ Update check completed');
                    } catch (error) {
                        console.warn('Update check failed:', error);
                        // Don't block app initialization for update check failures
                    }
                }

                console.log('🎉 App initialization completed successfully');
                setIsAppReady(true);
            } catch (error) {
                console.error('💥 Failed to initialize app:', error);

                errorHandler.logError(error as Error, {
                    context: 'App Initialization',
                    severity: 'critical',
                });

                Alert.alert(
                    'Initialization Error',
                    'Some features may not work properly. Please restart the app.',
                    [
                        {
                            text: 'Continue Anyway',
                            onPress: () => setIsAppReady(true),
                        },
                        {
                            text: 'Restart App',
                            onPress: () => {
                                // In a real app, you might use a restart library
                                console.log('App restart requested');
                            },
                        },
                    ],
                );

                setIsAppReady(true);
            } finally {
                // Always hide splash screen
                try {
                    await SplashScreen.hideAsync();
                } catch (splashError) {
                    console.warn('Failed to hide splash screen:', splashError);
                }
            }
        };

        initializeApp();
    }, []);

    // Handle notification permissions
    const handleNotificationPermissions = async () => {
        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status: requestedStatus } = await Notifications.requestPermissionsAsync();
                finalStatus = requestedStatus;
            }

            updateNotification(finalStatus);

            if (finalStatus !== 'granted') {
                Alert.alert(
                    'Notifications Disabled',
                    'Enable notifications in settings to get timer alerts and reminders.',
                    [{ text: 'OK' }],
                );
            } else {
                console.log('✅ Notification permissions granted');
            }
        } catch (error) {
            console.error('Failed to handle notification permissions:', error);
        }
    };

    // Pre-download popular tracks
    const preDownloadPopularTracks = async () => {
        try {
            const popularTrackUrls = musicTracks
                .slice(0, 3) // Download first 3 tracks
                .map((track: MusicTrack) => track.source);

            await AudioCacheManager.preDownloadAudio(popularTrackUrls);
            console.log('✅ Popular tracks pre-downloaded');
        } catch (error) {
            console.warn('Failed to pre-download tracks:', error);
            // Non-critical error, don't block app initialization
        }
    };

    // Handle notification responses
    useEffect(() => {
        const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data;

            console.log('📱 Notification response received:', data);

            switch (data?.type) {
                case 'session_complete':
                case 'break_complete':
                    // Navigate to timer screen or show completion modal
                    console.log('Timer notification received:', data);
                    break;
                case 'daily_reminder':
                    // Navigate to timer screen
                    console.log('Daily reminder received');
                    break;
                case 'goal_achievement':
                    // Show achievement celebration
                    console.log('Goal achievement notification:', data);
                    break;
                default:
                    console.log('Unknown notification type:', data?.type);
            }
        });

        return () => subscription.remove();
    }, []);

    // Handle app state changes for background timer
    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (Platform.OS === 'web') return; // Skip for web

            if (nextAppState === 'background') {
                console.log('📱 App backgrounded - background timer active');
                // Background timer will handle timing
            } else if (nextAppState === 'active') {
                console.log('📱 App foregrounded - syncing with background timer');
                // Sync timer state with background timer
                try {
                    // You might want to sync your pomodoro store here
                    // pomodoroStore.syncWithBackgroundTimer();
                } catch (error) {
                    console.error('Failed to sync with background timer:', error);
                }
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, []);

    // Show loading state while seeding
    if (!isAppReady || isSeeding) {
        return null; // Splash screen is still showing
    }

    const isDark = mode === 'auto' ? systemColorScheme === 'dark' : mode === 'dark';
    const theme = getCurrentTheme();

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <View style={{ flex: 1, backgroundColor: theme.background }}>
                <NavigationContainer>
                    <AppStackNavigation />
                </NavigationContainer>
            </View>

            {/* Onboarding Flow */}
            {/* Uncomment when ready to use onboarding */}
            {/* {showOnboarding && (
                <OnboardingFlow
                    visible={showOnboarding}
                    onComplete={() => setShowOnboarding(false)}
                />
            )} */}
        </>
    );
};

export default function App() {
    // Configure notification handler
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
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AppContent />
        </GestureHandlerRootView>
    );
}

// Development utilities for debugging database
if (__DEV__) {
    // Add global functions for debugging in development
    (global as any).debugDB = {
        async seedNow() {
            try {
                await seedDatabase(localDatabaseService, { clearFirst: true });
                console.log('🎉 Manual seeding completed!');
            } catch (error) {
                console.error('💥 Manual seeding failed:', error);
            }
        },

        async clearDB() {
            try {
                await localDatabaseService.clearAllData();
                console.log('🧹 Database cleared!');
            } catch (error) {
                console.error('💥 Failed to clear database:', error);
            }
        },

        async checkDB() {
            try {
                const [stats] = await Promise.all([localDatabaseService.getStatistics()]);
                console.log('📊 Database status:', {
                    stats: stats.totalCount,
                });
            } catch (error) {
                console.error('💥 Failed to check database:', error);
            }
        },
    };

    console.log('🛠️ Debug utilities available:');
    console.log('- debugDB.seedNow() - Seed database with sample data');
    console.log('- debugDB.clearDB() - Clear all database data');
    console.log('- debugDB.checkDB() - Check database status');
}
