import CustomTabBar from '@/components/ui/custom-tab-bar';
import HugeIconView from '@/components/ui/huge-icon-view';
import { Tabs, router, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { Home01Icon, Settings01Icon, Timer01Icon } from '@hugeicons/core-free-icons';
import { useAuthStore } from '@/stores/auth-store';
import { useSettingsStore } from '@/stores/local-settings-store';

export default function TabLayout() {
    const { user, isInitialized } = useAuthStore();
    const { onboardingCompleted } = useSettingsStore();

    // Additional protection for tab routes
    useEffect(() => {
        if (!isInitialized) return;

        // If user is not authenticated, redirect will be handled by root layout
        // But we add an extra check here for safety
        if (!user) {
            router.replace('/auth');
            return;
        }

        // Note: Onboarding check is skipped since onboarding route doesn't exist yet
        // When onboarding is implemented, uncomment:
        // if (!onboardingCompleted) {
        //     router.replace('/onboarding' as any);
        //     return;
        // }
    }, [user, isInitialized, onboardingCompleted, router]);

    const handleOnFabPress = () => {
        router.push('/(create-todo)/create-todo');
    };

    return (
        <Tabs
            tabBar={(props) => <CustomTabBar onFabPress={handleOnFabPress} {...props} />}
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    display: 'none', // Hide default tab bar
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <HugeIconView icon={Home01Icon} color={color} />,
                }}
            />
            <Tabs.Screen
                name="pomodoro"
                options={{
                    title: 'Pomodoro',
                    tabBarIcon: ({ color }) => <HugeIconView icon={Timer01Icon} color={color} />,
                }}
            />

            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color }) => <HugeIconView icon={Settings01Icon} color={color} />,
                }}
            />
        </Tabs>
    );
}
