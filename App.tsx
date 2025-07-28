import 'react-native-get-random-values';

import React, { useEffect, useState } from 'react';
import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from '@react-navigation/native';
import { AppStackNavigation } from './src/navigations';
import './global.css';
import { Alert, Platform, useColorScheme, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useThemeStore } from './src/store/themeStore';
import { shouldShowOnboarding } from './src/components/OnboardingFlow';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// New optimized hooks and services
import { useAppInitialization } from './src/hooks/useAppInitialization';
import { useAppStateHandling } from './src/hooks/useAppStateHandling';
import { notificationManager } from './src/services/notificationManager';
// Enable screens before any navigation components are rendered
enableScreens();

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const AppContent = () => {
    const { mode, getCurrentTheme } = useThemeStore();
    const systemColorScheme = useColorScheme();

    // Use optimized initialization hook
    const { isReady, isInitializing, error } = useAppInitialization();

    // Handle app state changes
    useAppStateHandling();

    const [showOnboarding, setShowOnboarding] = useState(false);
    const [notificationCleanup, setNotificationCleanup] = useState<(() => void) | null>(null);

    // Setup notification handlers and request permissions
    useEffect(() => {
        const setupNotifications = async () => {
            // Setup notification handlers
            const cleanup = notificationManager.setupNotificationHandlers();
            setNotificationCleanup(() => cleanup);

            // Request permissions (non-blocking)
            const granted = await notificationManager.requestPermissions();

            if (!granted && Platform.OS !== 'web') {
                // Show non-blocking alert for denied permissions
                setTimeout(() => {
                    Alert.alert(
                        'Notifications Disabled',
                        'Enable notifications in settings to get timer alerts and reminders.',
                        [{ text: 'OK' }],
                    );
                }, 500);
            }
        };

        setupNotifications();

        return () => {
            if (notificationCleanup) {
                notificationCleanup();
            }
        };
    }, []);

    // Check onboarding status once app is ready
    useEffect(() => {
        if (isReady) {
            shouldShowOnboarding()
                .then(setShowOnboarding)
                .catch((error) => {
                    console.warn('Failed to check onboarding status:', error);
                    setShowOnboarding(false);
                });
        }
    }, [isReady]);

    // Show loading state while initializing
    if (!isReady) {
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
            {/*{showOnboarding && (*/}
            {/*    <OnboardingFlow*/}
            {/*        visible={showOnboarding}*/}
            {/*        onComplete={() => setShowOnboarding(false)}*/}
            {/*    />*/}
            {/*)}*/}
        </>
    );
};

export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AppContent />
        </GestureHandlerRootView>
    );
}

// Development utilities for debugging database
if (__DEV__) {
    // Load debug utilities dynamically to avoid import issues
    Promise.all([import('./src/data/local/localDatabase'), import('./src/utils/seedData')])
        .then(([{ localDatabaseService }, { seedDatabase }]) => {
            (global as Record<string, any>).debugDB = {
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
        })
        .catch(() => {
            console.warn('Failed to load debug utilities');
        });
}
