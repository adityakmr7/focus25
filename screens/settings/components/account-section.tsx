import { useAuthStore } from '@/stores/auth-store';
import { useSettingsStore } from '@/stores/local-settings-store';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Badge, HStack, Spinner, useTheme } from 'react-native-heroui';
import TypographyText from '@/components/TypographyText';
import ChevronRight from './chevron-right';
import Divider from './divider';
import SettingItem from './setting-item';
import SettingsSection from './settings-section';

const AccountSection: React.FC = () => {
    const { userName, userEmail, isAccountBackedUp } = useSettingsStore();
    const { signOut, loading } = useAuthStore();
    const { theme } = useTheme();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Get display name: use userName if available and not empty, otherwise use email prefix
    let displayName = userName;
    if (!displayName || displayName.trim() === '' || displayName === 'User') {
        if (userEmail) {
            displayName = userEmail.split('@')[0];
        } else {
            displayName = 'Guest User';
        }
    }

    // Get first character for avatar from displayName
    const avatarInitial = displayName.charAt(0).toUpperCase();

    const handleLogout = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out? You will need to sign in again to access your account.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoggingOut(true);
                        try {
                            await signOut();
                            // Navigation will be handled by ProtectedRoute automatically
                        } catch (error: any) {
                            Alert.alert(
                                'Error',
                                error.message || 'Failed to sign out. Please try again.',
                            );
                            setIsLoggingOut(false);
                        }
                    },
                },
            ],
        );
    };

    return (
        <SettingsSection title="Account">
            <SettingItem
                title={displayName}
                subtitle={userEmail || 'No email provided'}
                icon={
                    <View
                        style={[
                            styles.avatar,
                            {
                                backgroundColor: theme.colors.primary + '20',
                            },
                        ]}
                    >
                        <TypographyText
                            variant="title"
                            weight="bold"
                            style={[
                                styles.avatarText,
                                {
                                    color: theme.colors.primary,
                                },
                            ]}
                        >
                            {avatarInitial}
                        </TypographyText>
                    </View>
                }
                rightElement={<ChevronRight />}
            />
            <Divider />

            <SettingItem
                title="Sign Out"
                subtitle="Sign out of your account"
                onPress={handleLogout}
                disabled={isLoggingOut || loading}
                rightElement={
                    isLoggingOut || loading ? (
                        <Spinner size="sm" color="danger" />
                    ) : (
                        <ChevronRight />
                    )
                }
            />
        </SettingsSection>
    );
};

const styles = StyleSheet.create({
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 16,
    },
});

export default AccountSection;
