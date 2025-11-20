import TypographyText from '@/components/TypographyText';
import { useSettingsStore } from '@/stores/local-settings-store';
import { useAuthStore } from '@/stores/auth-store';
import { revenueCatService } from '@/services/revenuecat-service';
import { optionalSyncService } from '@/services/optional-sync-service';
import { notificationService } from '@/services/notification-service';
import { SUBSCRIPTION_CONSTANTS } from '@/constants/subscription';
import { showError, showSuccess } from '@/utils/error-toast';
import React, { useEffect, useState } from 'react';
import { Linking, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import {
    Card,
    CardBody,
    HStack,
    SPACING,
    VStack,
    useTheme,
    Switch,
    Button,
} from 'react-native-heroui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Host, ContextMenu, Slider, Button as SwiftButton, Picker } from '@expo/ui/swift-ui';
import Avatar from '@/components/ui/avatar';
import { LazyRequireImages } from '@/assets/images/lazy-require-image';
import { Image } from 'expo-image';
import { APP_CONFIG } from '@/configs/app-config';
const Header = () => {
    const { theme } = useTheme();
    return (
        <HStack alignItems="center" justifyContent="space-between" px="md" py="sm">
            <TypographyText variant="title" color="default">
                Settings
            </TypographyText>
            <TouchableOpacity
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: theme.borderRadius.lg,
                    backgroundColor: theme.colors.background,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                disabled
            >
                {/* Dots placeholder */}
                <HStack gap="unit-1">
                    <View
                        style={{
                            width: 4,
                            height: 4,
                            borderRadius: theme.borderRadius.sm,
                            backgroundColor: theme.colors.foreground,
                        }}
                    />
                    <View
                        style={{
                            width: 4,
                            height: 4,
                            borderRadius: theme.borderRadius.sm,
                            backgroundColor: theme.colors.foreground,
                        }}
                    />
                    <View
                        style={{
                            width: 4,
                            height: 4,
                            borderRadius: theme.borderRadius.sm,
                            backgroundColor: theme.colors.foreground,
                        }}
                    />
                </HStack>
            </TouchableOpacity>
        </HStack>
    );
};

const SubscriptionCard = ({ handleSeePlanPress }: { handleSeePlanPress: () => void }) => {
    const { theme } = useTheme();

    return (
        <Card variant="bordered" style={{ borderRadius: 20 }}>
            <CardBody>
                <HStack alignItems="center" justifyContent="space-between" gap="unit-4">
                    <HStack alignItems="center" gap="unit-3">
                        <View
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: theme.borderRadius.lg,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Image
                                source={LazyRequireImages.starImage()}
                                style={{ width: 40, height: 40 }}
                            />
                        </View>
                        <VStack>
                            <TypographyText variant="body" weight="semibold">
                                Upgrade to Premium
                            </TypographyText>
                            <TypographyText variant="caption">
                                Unlock advance feature
                            </TypographyText>
                        </VStack>
                    </HStack>
                    <TouchableOpacity
                        onPress={handleSeePlanPress}
                        style={{
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            backgroundColor: theme.colors.foreground,
                            borderRadius: theme.borderRadius.lg,
                        }}
                    >
                        <TypographyText
                            variant="body"
                            size="sm"
                            style={{ color: theme.colors.content1 }}
                        >
                            See Plan
                        </TypographyText>
                    </TouchableOpacity>
                </HStack>
            </CardBody>
        </Card>
    );
};

const SubscriptionStatusCard = ({
    subscriptionDetails,
    onManagePress,
    onRestorePress,
    isRestoring,
}: {
    subscriptionDetails: {
        isActive: boolean;
        expiryDate: Date | null;
        willRenew: boolean;
        productIdentifier: string | null;
    };
    onManagePress: () => void;
    onRestorePress: () => void;
    isRestoring: boolean;
}) => {
    const { theme } = useTheme();

    const formatDate = (date: Date | null): string => {
        if (!date) return 'N/A';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <Card variant="bordered" style={{ borderRadius: 20 }}>
            <CardBody>
                <VStack gap="unit-4">
                    <HStack alignItems="center" justifyContent="space-between" gap="unit-4">
                        <HStack alignItems="center" gap="unit-3">
                            <View
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: theme.borderRadius.lg,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Image
                                    source={LazyRequireImages.starImage()}
                                    style={{ width: 40, height: 40 }}
                                />
                            </View>
                            <VStack>
                                <TypographyText variant="body" weight="semibold">
                                    Flowzy Premium
                                </TypographyText>
                                <TypographyText variant="caption">
                                    {subscriptionDetails.isActive
                                        ? 'Active Subscription'
                                        : 'Expired'}
                                </TypographyText>
                            </VStack>
                        </HStack>
                        <View
                            style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 12,
                                backgroundColor: subscriptionDetails.isActive
                                    ? theme.colors.success
                                    : theme.colors.danger,
                            }}
                        >
                            <TypographyText
                                variant="caption"
                                style={{
                                    color: '#fff',
                                    fontWeight: '600',
                                }}
                            >
                                {subscriptionDetails.isActive ? 'Active' : 'Expired'}
                            </TypographyText>
                        </View>
                    </HStack>

                    {subscriptionDetails.expiryDate && (
                        <VStack gap="unit-1">
                            <TypographyText variant="caption" style={{ opacity: 0.7 }}>
                                {subscriptionDetails.willRenew ? 'Renews on' : 'Expired on'}
                            </TypographyText>
                            <TypographyText variant="body" weight="semibold">
                                {formatDate(subscriptionDetails.expiryDate)}
                            </TypographyText>
                        </VStack>
                    )}

                    <HStack gap="unit-2" mt="xs">
                        {Platform.OS !== 'web' && (
                            <>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onPress={onManagePress}
                                    style={{ flex: 1 }}
                                >
                                    <TypographyText variant="body" size="sm">
                                        Manage
                                    </TypographyText>
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onPress={onRestorePress}
                                    isLoading={isRestoring}
                                    isDisabled={isRestoring}
                                    style={{ flex: 1 }}
                                >
                                    <TypographyText variant="body" size="sm">
                                        Restore
                                    </TypographyText>
                                </Button>
                            </>
                        )}
                    </HStack>
                </VStack>
            </CardBody>
        </Card>
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
];
const SettingsScreen = () => {
    const { theme } = useTheme();
    const {
        focusDuration,
        breakDuration,
        setFocusDuration,
        setBreakDuration,
        userName,
        metronome,
        userEmail,
        themeMode,
        setThemeMode,
        setMetronome,
        setMetronomeVolume,
        metronomeVolume,
        notifications,
        setNotifications,
    } = useSettingsStore();
    const { isProUser, refreshProStatus } = useAuthStore();
    const [isRestoring, setIsRestoring] = useState(false);
    const [syncStatus, setSyncStatus] = useState<{
        enabled: boolean;
        lastSyncAt?: string;
        unsyncedChanges: number;
    } | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

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
        try {
            const paywallResult = await RevenueCatUI.presentPaywallIfNeeded({
                requiredEntitlementIdentifier: 'flowzy_premium',
            });

            if (
                paywallResult === PAYWALL_RESULT.PURCHASED ||
                paywallResult === PAYWALL_RESULT.RESTORED
            ) {
                console.log('User has access to pro features');
                // Handle successful purchase or restore here
            }
        } catch (error) {
            console.error('Error presenting paywall:', error);
        }
        // router.push({
        //     pathname: '/plan',
        //     params: {
        //         from: 'settings',
        //     },
        // });
    };

    const handleManageSubscription = () => {
        // Open App Store subscription management
        if (Platform.OS === 'ios') {
            Linking.openURL('https://apps.apple.com/account/subscriptions');
        } else if (Platform.OS === 'android') {
            Linking.openURL('https://play.google.com/store/account/subscriptions');
        } else {
            showError(new Error('Subscription management is only available on iOS and Android.'), {
                action: 'handleManageSubscription.platformCheck',
            });
        }
    };

    const handleRestorePurchases = async () => {
        if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
            showError(new Error('Restore purchases is only available on iOS and Android.'), {
                action: 'handleRestorePurchases.platformCheck',
            });
            return;
        }

        setIsRestoring(true);
        try {
            // Ensure RevenueCat is initialized
            if (!revenueCatService.isInitialized()) {
                await revenueCatService.initialize();
            }

            const customerInfo = await revenueCatService.restorePurchases();

            if (customerInfo) {
                // Check if restore found an active subscription
                const hasActiveSubscription = revenueCatService.hasActiveEntitlement(
                    SUBSCRIPTION_CONSTANTS.PRO_ENTITLEMENT_ID,
                );

                if (hasActiveSubscription) {
                    await refreshProStatus();
                    showSuccess('Purchases restored successfully!', 'Restore Successful');
                } else {
                    showError(
                        new Error(
                            'No active subscription found. If you have an active subscription, please contact support.',
                        ),
                        {
                            action: 'handleRestorePurchases.noSubscription',
                        },
                    );
                }
            } else {
                showError(new Error('Failed to restore purchases. Please try again.'), {
                    action: 'handleRestorePurchases.failed',
                });
            }
        } catch (error: any) {
            showError(error, {
                action: 'handleRestorePurchases',
            });
        } finally {
            setIsRestoring(false);
        }
    };

    const handleManualSync = async () => {
        if (!isProUser) {
            showError(new Error('Cloud sync is only available for Premium users.'), {
                action: 'handleManualSync.notPro',
            });
            return;
        }

        setIsSyncing(true);
        try {
            const success = await optionalSyncService.forceSync();
            if (success) {
                showSuccess('Sync completed successfully', 'Sync Complete');
                // Refresh sync status
                const status = await optionalSyncService.getSyncStatus();
                setSyncStatus(status);
            } else {
                showError(new Error('Sync failed. Please check your connection and try again.'), {
                    action: 'handleManualSync.failed',
                });
            }
        } catch (error) {
            showError(error, {
                action: 'handleManualSync',
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const formatSyncTime = (dateString?: string): string => {
        if (!dateString) return 'Never';
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
            if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
            if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
            });
        } catch {
            return 'Unknown';
        }
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
        }
    };
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <Header />
            <ScrollView
                contentContainerStyle={{
                    paddingBottom: SPACING['unit-14'],
                    paddingHorizontal: SPACING['unit-4'],
                }}
                style={{ flex: 1 }}
            >
                {(userName || userEmail) && (
                    <VStack alignItems="center" gap="unit-2" py="md">
                        <View
                            style={{
                                width: 86,
                                height: 86,
                                borderRadius: 43,
                                overflow: 'hidden',
                                backgroundColor: theme.colors.background,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Avatar
                                size={86}
                                label={userName || (userEmail ? userEmail.split('@')[0] : 'User')}
                            />
                        </View>
                        <TypographyText variant="title" color="default">
                            {userName || (userEmail ? userEmail.split('@')[0] : 'User')}
                        </TypographyText>
                        {userEmail && (
                            <TypographyText variant="body" color="default" size="sm">
                                {userEmail}
                            </TypographyText>
                        )}
                    </VStack>
                )}

                {/* Conditionally render subscription card based on pro status */}
                {isProUser && subscriptionDetails ? (
                    <SubscriptionStatusCard
                        subscriptionDetails={subscriptionDetails}
                        onManagePress={handleManageSubscription}
                        onRestorePress={handleRestorePurchases}
                        isRestoring={isRestoring}
                    />
                ) : (
                    <SubscriptionCard handleSeePlanPress={handleSeePlanPress} />
                )}

                {/* Sessions */}
                <VStack gap="unit-3" mt="lg">
                    <TypographyText variant="title" color="default">
                        Sessions
                    </TypographyText>
                    <Card variant="bordered" style={{ borderRadius: 16 }}>
                        <CardBody>
                            <VStack gap="unit-2">
                                {/* Flow Duration - dropdown */}
                                <HStack alignItems="center" justifyContent="space-between" py="xs">
                                    <TypographyText variant="body">Flow Duration</TypographyText>
                                    <Host style={{ width: 80, height: 36 }}>
                                        <ContextMenu>
                                            <ContextMenu.Items>
                                                <Picker
                                                    label="Flow Duration"
                                                    options={DURATION_OPTIONS.map(
                                                        (m) => `${m} min`,
                                                    )}
                                                    variant="inline"
                                                    selectedIndex={focusIndex}
                                                    onOptionSelected={({
                                                        nativeEvent: { index },
                                                    }) => {
                                                        setFocusIndex(index);
                                                        setFocusDuration(DURATION_OPTIONS[index]);
                                                    }}
                                                />
                                            </ContextMenu.Items>
                                            <ContextMenu.Trigger>
                                                <SwiftButton variant="bordered">
                                                    {`${DURATION_OPTIONS[focusIndex]} min`}
                                                </SwiftButton>
                                            </ContextMenu.Trigger>
                                        </ContextMenu>
                                    </Host>
                                </HStack>

                                {/* Break Duration - dropdown */}
                                <HStack alignItems="center" justifyContent="space-between" py="xs">
                                    <TypographyText variant="body">Break Duration</TypographyText>
                                    <Host style={{ width: 80, height: 36 }}>
                                        <ContextMenu activationMethod="singlePress">
                                            <ContextMenu.Items>
                                                <Picker
                                                    label="Break Duration"
                                                    options={DURATION_OPTIONS.map(
                                                        (m) => `${m} min`,
                                                    )}
                                                    variant="inline"
                                                    selectedIndex={breakIndex}
                                                    onOptionSelected={({
                                                        nativeEvent: { index },
                                                    }) => {
                                                        setBreakIndex(index);
                                                        setBreakDuration(DURATION_OPTIONS[index]);
                                                    }}
                                                />
                                            </ContextMenu.Items>
                                            <ContextMenu.Trigger>
                                                <SwiftButton variant="bordered">
                                                    {`${DURATION_OPTIONS[breakIndex]} min`}
                                                </SwiftButton>
                                            </ContextMenu.Trigger>
                                        </ContextMenu>
                                    </Host>
                                </HStack>
                            </VStack>
                        </CardBody>
                    </Card>
                </VStack>

                {/* General */}
                <VStack gap="unit-3" mt="lg">
                    <TypographyText variant="title" color="default">
                        General
                    </TypographyText>
                    <Card variant="bordered" style={{ borderRadius: 16 }}>
                        <CardBody>
                            <VStack gap="unit-2">
                                <HStack alignItems="center" justifyContent="space-between" py="xs">
                                    <TypographyText variant="body">Notifications</TypographyText>
                                    <Switch
                                        size="md"
                                        value={notifications}
                                        onChange={handleNotificationsChange}
                                    />
                                </HStack>
                                <HStack alignItems="center" justifyContent="space-between" py="xs">
                                    <TypographyText variant="body">Metronome</TypographyText>
                                    <Switch
                                        size="md"
                                        value={metronome}
                                        onChange={handleMetronomeChange}
                                    />
                                </HStack>
                                <Host style={{ minHeight: 60 }}>
                                    <Slider
                                        value={metronomeVolume}
                                        onValueChange={handleMetronomeVolumeChange}
                                    />
                                </Host>
                                <HStack alignItems="center" justifyContent="space-between" py="xs">
                                    <TypographyText variant="body">Appearance</TypographyText>
                                    <Host style={{ width: 90, height: 36 }}>
                                        <ContextMenu>
                                            <ContextMenu.Items>
                                                {(
                                                    [
                                                        {
                                                            label: 'System',
                                                            value: 'system' as const,
                                                        },
                                                        { label: 'Dark', value: 'dark' as const },
                                                        { label: 'Light', value: 'light' as const },
                                                    ] as const
                                                ).map((opt) => (
                                                    <SwiftButton
                                                        key={opt.value}
                                                        onPress={() => setThemeMode(opt.value)}
                                                    >
                                                        {opt.label}
                                                    </SwiftButton>
                                                ))}
                                            </ContextMenu.Items>
                                            <ContextMenu.Trigger>
                                                <SwiftButton variant="bordered">
                                                    {themeMode === 'system'
                                                        ? 'System'
                                                        : themeMode === 'dark'
                                                          ? 'Dark'
                                                          : 'Light'}
                                                </SwiftButton>
                                            </ContextMenu.Trigger>
                                        </ContextMenu>
                                    </Host>
                                </HStack>
                            </VStack>
                        </CardBody>
                    </Card>
                </VStack>

                {/* Cloud Sync - Only for Pro Users */}
                {isProUser && syncStatus !== null && (
                    <VStack gap="unit-3" mt="lg">
                        <TypographyText variant="title" color="default">
                            Cloud Sync
                        </TypographyText>
                        <Card variant="bordered" style={{ borderRadius: 16 }}>
                            <CardBody>
                                <VStack gap="unit-3">
                                    <HStack
                                        alignItems="center"
                                        justifyContent="space-between"
                                        py="xs"
                                    >
                                        <VStack gap="unit-1">
                                            <TypographyText variant="body" weight="semibold">
                                                Sync Status
                                            </TypographyText>
                                            <TypographyText
                                                variant="caption"
                                                style={{ opacity: 0.7 }}
                                            >
                                                {syncStatus.enabled ? 'Enabled' : 'Disabled'}
                                            </TypographyText>
                                        </VStack>
                                        <View
                                            style={{
                                                paddingHorizontal: 12,
                                                paddingVertical: 6,
                                                borderRadius: 12,
                                                backgroundColor: syncStatus.enabled
                                                    ? theme.colors.success
                                                    : theme.colors.default,
                                            }}
                                        >
                                            <TypographyText
                                                variant="caption"
                                                style={{
                                                    color: '#fff',
                                                    fontWeight: '600',
                                                }}
                                            >
                                                {syncStatus.enabled ? 'Active' : 'Inactive'}
                                            </TypographyText>
                                        </View>
                                    </HStack>

                                    {syncStatus.lastSyncAt && (
                                        <HStack
                                            alignItems="center"
                                            justifyContent="space-between"
                                            py="xs"
                                        >
                                            <TypographyText variant="body">
                                                Last Sync
                                            </TypographyText>
                                            <TypographyText variant="body" style={{ opacity: 0.7 }}>
                                                {formatSyncTime(syncStatus.lastSyncAt)}
                                            </TypographyText>
                                        </HStack>
                                    )}

                                    {syncStatus.unsyncedChanges > 0 && (
                                        <HStack
                                            alignItems="center"
                                            justifyContent="space-between"
                                            py="xs"
                                        >
                                            <TypographyText variant="body">
                                                Unsynced Changes
                                            </TypographyText>
                                            <View
                                                style={{
                                                    paddingHorizontal: 8,
                                                    paddingVertical: 4,
                                                    borderRadius: 8,
                                                    backgroundColor: theme.colors.warning,
                                                }}
                                            >
                                                <TypographyText
                                                    variant="caption"
                                                    style={{
                                                        color: '#fff',
                                                        fontWeight: '600',
                                                    }}
                                                >
                                                    {syncStatus.unsyncedChanges}
                                                </TypographyText>
                                            </View>
                                        </HStack>
                                    )}

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onPress={handleManualSync}
                                        isLoading={isSyncing}
                                        isDisabled={isSyncing || !syncStatus.enabled}
                                        style={{ marginTop: SPACING['unit-2'] }}
                                    >
                                        <TypographyText variant="body" size="sm">
                                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                                        </TypographyText>
                                    </Button>
                                </VStack>
                            </CardBody>
                        </Card>
                    </VStack>
                )}

                {/* About */}
                <VStack gap="unit-3" mt="lg">
                    <TypographyText variant="title" color="default">
                        About
                    </TypographyText>
                    {ABOUT_OPTIONS.map(({ label, id }, index) => (
                        <Card
                            onPress={() => handleAboutCardPress(id)}
                            key={label}
                            variant="bordered"
                            style={{ borderRadius: 16 }}
                        >
                            <CardBody>
                                <HStack alignItems="center" justifyContent="space-between">
                                    <TypographyText variant="body">{label}</TypographyText>
                                    <View
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRightWidth: 2,
                                            borderTopWidth: 2,
                                            borderColor: theme.colors.foreground,
                                            transform: [{ rotate: '45deg' }],
                                        }}
                                    />
                                </HStack>
                            </CardBody>
                        </Card>
                    ))}
                </VStack>
            </ScrollView>
        </SafeAreaView>
    );
};

export default SettingsScreen;
