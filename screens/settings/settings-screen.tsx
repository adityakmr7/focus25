import TypographyText from '@/components/TypographyText';
import { useSettingsStore } from '@/stores/local-settings-store';
import { useAuthStore } from '@/stores/auth-store';
import { revenueCatService } from '@/services/revenuecat-service';
import { optionalSyncService } from '@/services/optional-sync-service';
import { notificationService } from '@/services/notification-service';
import { SUBSCRIPTION_CONSTANTS } from '@/constants/subscription';
import { showError, showSuccess } from '@/utils/error-toast';
import React, { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Switch } from '@/components/ui/Switch';
import {
    Text,
    StyleSheet,
    Linking,
    Platform,
    ScrollView,
    TouchableOpacity,
    View,
} from 'react-native';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Host, ContextMenu, Slider, Button as SwiftButton, Picker } from '@expo/ui/swift-ui';
import Avatar from '@/components/ui/avatar';
import { APP_CONFIG } from '@/configs/app-config';
import { SwitchThemeButton } from '@/components/telegram-theme-switch/components/switch-theme';
import { useColorTheme } from '@/hooks/useColorTheme';
import { HStack } from '@/components/ui/HStack';
import { VStack } from '@/components/ui/VStack';
import { SPACING } from '@/constants/spacing';
const Header = () => {
    const colors = useColorTheme();
    return (
        <HStack alignItems="center" pt="unit-6" justifyContent="space-between" px="md" py="sm">
            <Text style={[styles.title, { color: colors.contentPrimary }]}>Settings</Text>
            <SwitchThemeButton
                contentContainerStyle={{
                    height: 40,
                    borderRadius: 20,
                    width: 40,
                }}
            />
        </HStack>
    );
};

const DURATION_OPTIONS = [1, 5, 10, 15, 25];
const ABOUT_OPTIONS = [
    {
        id: 'rate-the-app',
        label: 'Rate the App',
    },
    {
        id: 'feedback-and-support',
        label: 'Feedback & Support',
    },
    {
        id: 'terms-and-conditions',
        label: 'Terms & Conditions',
    },
    {
        id: 'privacy-policy',
        label: 'Privacy Policy',
    },
];
const SettingsScreen = () => {
    const colors = useColorTheme();
    const {
        focusDuration,
        breakDuration,
        setFocusDuration,
        setBreakDuration,
        userName,
        metronome,
        userEmail,
        setMetronome,
        setMetronomeVolume,
        metronomeVolume,
        notifications,
        setNotifications,
    } = useSettingsStore();
    const { isProUser, refreshProStatus, signOut } = useAuthStore();
    const [syncStatus, setSyncStatus] = useState<{
        enabled: boolean;
        lastSyncAt?: string;
        unsyncedChanges: number;
    } | null>(null);

    // Get subscription details if user is pro
    const subscriptionDetails = isProUser
        ? revenueCatService.getSubscriptionDetails(SUBSCRIPTION_CONSTANTS.PRO_ENTITLEMENT_ID)
        : null;

    // Load sync status for pro users
    useEffect(() => {
        const loadSyncStatus = async () => {
            if (isProUser) {
                try {
                    const status = await optionalSyncService.getSyncStatus();
                    setSyncStatus(status);
                } catch (error) {
                    console.error('Failed to load sync status:', error);
                }
            }
        };
        loadSyncStatus();
    }, [isProUser]);

    const handleSeePlanPress = async () => {
        // Navigate to custom plan screen that shows all required Apple subscription information
        // This ensures Apple reviewers can verify all required information is displayed
        router.push({
            pathname: '/plan',
            params: {
                from: 'settings',
            },
        });
    };

    const [focusIndex, setFocusIndex] = useState(
        Math.max(0, DURATION_OPTIONS.indexOf(focusDuration)),
    );
    const [breakIndex, setBreakIndex] = useState(
        Math.max(0, DURATION_OPTIONS.indexOf(breakDuration)),
    );

    const handleMetronomeChange = (value: boolean) => {
        setMetronome(!metronome);
    };
    const handleMetronomeVolumeChange = (value: number) => {
        setMetronomeVolume(value);
    };

    const handleNotificationsChange = async (value: boolean) => {
        if (value) {
            // Request permissions when enabling notifications
            const hasPermission = await notificationService.checkPermissions();
            if (!hasPermission) {
                const granted = await notificationService.requestPermissions();
                if (!granted) {
                    showError(
                        new Error(
                            'Notification permissions are required. Please enable them in your device settings.',
                        ),
                        {
                            action: 'handleNotificationsChange.permission',
                        },
                    );
                    return;
                }
            }
            // Initialize notification service
            await notificationService.initialize();
            setNotifications(true);
            showSuccess('Notifications enabled', 'Settings');
        } else {
            // Cancel any scheduled notifications when disabling
            try {
                await notificationService.cancelTimerNotifications();
            } catch (error) {
                console.error('Failed to cancel notifications:', error);
            }
            setNotifications(false);
            showSuccess('Notifications disabled', 'Settings');
        }
    };
    const handleAboutCardPress = (id: string) => {
        if (id === 'rate-the-app') {
            Linking.openURL(APP_CONFIG.APP_RATING_URL);
        } else if (id === 'feedback-and-support') {
            Linking.openURL(APP_CONFIG.FEEDBACK_FORM_URL);
        } else if (id === 'terms-and-conditions') {
            Linking.openURL(APP_CONFIG.TERM_CONDITIONS_URL);
        } else if (id === 'privacy-policy') {
            Linking.openURL(APP_CONFIG.PRIVACY_POLICY_URL);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            // Error is already handled in signOut function
            console.error('Logout error:', error);
        }
    };

    const ProPlanCard = () => {
        return (
            <View
                style={{
                    backgroundColor: colors.secondary,
                    padding: 16,
                    borderRadius: 16,
                }}
            >
                <LinearGradient
                    // Background Linear Gradient
                    colors={['#007B66', '#258F7E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: 16,
                    }}
                />
                <Text
                    style={{
                        paddingVertical: 16,
                        fontSize: 18,
                        fontWeight: '600',
                        color: colors.contentPrimary,
                    }}
                >
                    Power up with flowzy premium
                </Text>
                <TouchableOpacity onPress={handleSeePlanPress}>
                    <View
                        style={{
                            borderRadius: 18,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: colors.primary,
                            paddingVertical: 8,
                            paddingHorizontal: 16,
                        }}
                    >
                        <Text
                            style={{
                                color: colors.contentPrimary,
                                fontSize: 16,
                            }}
                        >
                            Upgrade to Premium
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.backgroundPrimary }}>
            <Header />
            <ScrollView
                contentContainerStyle={{
                    paddingBottom: SPACING['unit-14'],
                    paddingHorizontal: SPACING['unit-4'],
                }}
                style={{ flex: 1 }}
            >
                {!isProUser && <ProPlanCard />}
                {(userName || userEmail) && (
                    <VStack alignItems="center" gap="unit-2" py="md">
                        <View
                            style={{
                                width: 86,
                                height: 86,
                                borderRadius: 43,
                                overflow: 'hidden',
                                backgroundColor: colors.backgroundPrimary,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Avatar
                                backgroundColor={colors.backgroundSecondary}
                                textColor={colors.contentSecondary}
                                size={86}
                                label={userName || (userEmail ? userEmail.split('@')[0] : 'User')}
                            />
                        </View>
                        <TypographyText variant="title" style={{ color: colors.contentPrimary }}>
                            {userName || (userEmail ? userEmail.split('@')[0] : 'User')}
                        </TypographyText>
                        {userEmail && (
                            <TypographyText
                                variant="body"
                                style={{ color: colors.contentSecondary }}
                                size="sm"
                            >
                                {userEmail}
                            </TypographyText>
                        )}
                    </VStack>
                )}

                {/* Sessions */}
                <VStack gap="unit-3" mt="lg">
                    <TypographyText
                        style={{ color: colors.contentPrimary }}
                        variant="title"
                        color="default"
                    >
                        Sessions
                    </TypographyText>
                    <View
                        style={{
                            backgroundColor: colors.backgroundSecondary,
                            paddingHorizontal: 16,
                            paddingVertical: 16,
                            borderRadius: 16,
                        }}
                    >
                        <VStack gap="unit-2">
                            {/* Flow Duration - dropdown */}
                            <HStack alignItems="center" justifyContent="space-between" py="xs">
                                <TypographyText
                                    style={{ color: colors.contentPrimary }}
                                    variant="body"
                                >
                                    Flow Duration
                                </TypographyText>
                                <Host style={{ width: 80, height: 36 }}>
                                    <ContextMenu>
                                        <ContextMenu.Items>
                                            <Picker
                                                color={colors.contentPrimary}
                                                label="Flow Duration"
                                                options={DURATION_OPTIONS.map((m) => `${m} min`)}
                                                variant="inline"
                                                selectedIndex={focusIndex}
                                                onOptionSelected={({ nativeEvent: { index } }) => {
                                                    setFocusIndex(index);
                                                    setFocusDuration(DURATION_OPTIONS[index]);
                                                }}
                                            />
                                        </ContextMenu.Items>
                                        <ContextMenu.Trigger>
                                            <SwiftButton
                                                color={colors.secondary}
                                                variant="bordered"
                                            >
                                                {`${DURATION_OPTIONS[focusIndex]} min`}
                                            </SwiftButton>
                                        </ContextMenu.Trigger>
                                    </ContextMenu>
                                </Host>
                            </HStack>
                            <View
                                style={{
                                    height: 1,
                                    backgroundColor: colors.surfacePrimary,
                                }}
                            />
                            {/* Break Duration - dropdown */}
                            <HStack alignItems="center" justifyContent="space-between" py="xs">
                                <TypographyText
                                    variant="body"
                                    style={{ color: colors.contentPrimary }}
                                >
                                    Break Duration
                                </TypographyText>
                                <Host style={{ width: 80, height: 36 }}>
                                    <ContextMenu activationMethod="singlePress">
                                        <ContextMenu.Items>
                                            <Picker
                                                color={colors.contentPrimary}
                                                label="Break Duration"
                                                options={DURATION_OPTIONS.map((m) => `${m} min`)}
                                                variant="inline"
                                                selectedIndex={breakIndex}
                                                onOptionSelected={({ nativeEvent: { index } }) => {
                                                    setBreakIndex(index);
                                                    setBreakDuration(DURATION_OPTIONS[index]);
                                                }}
                                            />
                                        </ContextMenu.Items>
                                        <ContextMenu.Trigger>
                                            <SwiftButton
                                                color={colors.secondary}
                                                variant="bordered"
                                            >
                                                {`${DURATION_OPTIONS[breakIndex]} min`}
                                            </SwiftButton>
                                        </ContextMenu.Trigger>
                                    </ContextMenu>
                                </Host>
                            </HStack>
                        </VStack>
                    </View>
                </VStack>

                {/* General */}
                <VStack gap="unit-3" mt="lg">
                    <TypographyText variant="title" style={{ color: colors.contentPrimary }}>
                        General
                    </TypographyText>
                    <View
                        style={{
                            backgroundColor: colors.backgroundSecondary,
                            paddingHorizontal: 16,
                            paddingVertical: 16,
                            borderRadius: 16,
                        }}
                    >
                        <VStack gap="unit-2">
                            <HStack alignItems="center" justifyContent="space-between" py="xs">
                                <TypographyText
                                    variant="body"
                                    style={{ color: colors.contentPrimary }}
                                >
                                    Notifications
                                </TypographyText>
                                <Switch
                                    size="md"
                                    value={notifications}
                                    onChange={handleNotificationsChange}
                                />
                            </HStack>
                            <View
                                style={{
                                    height: 1,
                                    backgroundColor: colors.surfacePrimary,
                                }}
                            />
                            <HStack alignItems="center" justifyContent="space-between" py="xs">
                                <TypographyText
                                    variant="body"
                                    style={{ color: colors.contentPrimary }}
                                >
                                    Metronome
                                </TypographyText>
                                <Switch
                                    size="md"
                                    value={metronome}
                                    onChange={handleMetronomeChange}
                                />
                            </HStack>

                            <Host style={{ minHeight: 60 }}>
                                <Slider
                                    color={colors.secondary}
                                    value={metronomeVolume}
                                    onValueChange={handleMetronomeVolumeChange}
                                />
                            </Host>
                            <View
                                style={{
                                    height: 1,
                                    backgroundColor: colors.surfacePrimary,
                                }}
                            />
                        </VStack>
                    </View>
                </VStack>

                {/* About */}
                <VStack gap="unit-3" mt="lg">
                    <TypographyText variant="title" style={{ color: colors.contentPrimary }}>
                        About
                    </TypographyText>
                    <View
                        style={{
                            backgroundColor: colors.backgroundSecondary,
                            paddingHorizontal: 16,
                            paddingVertical: 16,
                            borderRadius: 16,
                        }}
                    >
                        {ABOUT_OPTIONS.map(({ label, id }, index) => (
                            <React.Fragment key={index}>
                                <TouchableOpacity onPress={() => handleAboutCardPress(id)}>
                                    <VStack py="md">
                                        <HStack alignItems="center" justifyContent="space-between">
                                            <TypographyText
                                                variant="body"
                                                style={{ color: colors.contentPrimary }}
                                            >
                                                {label}
                                            </TypographyText>
                                            <View
                                                style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRightWidth: 2,
                                                    borderTopWidth: 2,
                                                    borderColor: colors.surfacePrimary,
                                                    transform: [{ rotate: '45deg' }],
                                                }}
                                            />
                                        </HStack>
                                    </VStack>
                                </TouchableOpacity>
                                {index < ABOUT_OPTIONS.length - 1 && (
                                    <View
                                        style={{
                                            height: 1,
                                            backgroundColor: colors.surfacePrimary,
                                        }}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </View>
                </VStack>

                {/* Logout */}
                {(userName || userEmail) && (
                    <VStack gap="unit-3" mt="lg">
                        <View
                            style={{
                                backgroundColor: colors.backgroundSecondary,
                                paddingHorizontal: 16,
                                paddingVertical: 16,
                                borderRadius: 16,
                            }}
                        >
                            <TouchableOpacity onPress={handleLogout}>
                                <VStack py="md">
                                    <HStack alignItems="center" justifyContent="center">
                                        <TypographyText
                                            variant="body"
                                            style={{
                                                color: colors.danger,
                                                fontWeight: '600',
                                            }}
                                        >
                                            Log Out
                                        </TypographyText>
                                    </HStack>
                                </VStack>
                            </TouchableOpacity>
                        </View>
                    </VStack>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    title: {
        fontSize: 42,
        fontWeight: '600',
    },
});
export default SettingsScreen;
