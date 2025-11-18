import CustomTabBar from '@/components/ui/custom-tab-bar';
import HugeIconView from '@/components/ui/huge-icon-view';
import { Tabs, router } from 'expo-router';
import React from 'react';
import { Home01Icon, Settings01Icon, Timer01Icon } from '@hugeicons/core-free-icons';

export default function TabLayout() {
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
