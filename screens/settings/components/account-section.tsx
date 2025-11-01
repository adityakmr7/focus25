import { useAuthStore } from '@/stores/auth-store';
import { useSettingsStore } from '@/stores/local-settings-store';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Avatar, Badge, HStack, Spinner, toast } from 'react-native-heroui';
import ChevronRight from './chevron-right';
import Divider from './divider';
import SettingItem from './setting-item';
import SettingsSection from './settings-section';

const AccountSection: React.FC = () => {
    const { userName, userEmail, isAccountBackedUp } = useSettingsStore();
    const { signOut, user } = useAuthStore();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoggingOut(true);
                        try {
                            await signOut();
                            // Navigation will be handled automatically by ProtectedRoute
                            // but we can explicitly navigate for clarity
                            router.replace('/onboarding');
                            toast.show('Logged out successfully');
                        } catch (error) {
                            console.error('Logout failed:', error);
                            toast.show('Failed to logout. Please try again.');
                        } finally {
                            setIsLoggingOut(false);
                        }
                    },
                },
            ],
            { cancelable: true },
        );
    };

    return (
        <SettingsSection title="Account">
            {user && (
                <>
                    <SettingItem
                        title={userName || 'Guest User'}
                        subtitle={userEmail || 'No email provided'}
                        icon={<Avatar size="md" src="https://i.pravatar.cc/150?u=john" />}
                        rightElement={<ChevronRight />}
                    />
                    <Divider />
                </>
            )}
            <SettingItem
                title={isAccountBackedUp ? 'Account Backed Up' : 'Account Not Backed Up'}
                rightElement={
                    !isAccountBackedUp ? (
                        <HStack alignItems="center" gap="xs">
                            <Badge
                                variant="solid"
                                content="1"
                                color="danger"
                                size="md"
                                isOneChar={true}
                            />
                            <ChevronRight />
                        </HStack>
                    ) : (
                        <ChevronRight />
                    )
                }
            />
            {user && (
                <>
                    <Divider />
                    <SettingItem
                        title="Logout"
                        subtitle="Sign out of your account"
                        onPress={handleLogout}
                        disabled={isLoggingOut}
                        rightElement={
                            isLoggingOut ? (
                                <Spinner size="sm" color="danger" />
                            ) : (
                                <ChevronRight />
                            )
                        }
                    />
                </>
            )}
        </SettingsSection>
    );
};

export default AccountSection;
