import TypographyText from '@/components/TypographyText';
import { SUBSCRIPTION_CONSTANTS } from '@/constants/subscription';
import { revenueCatService } from '@/services/revenuecat-service';
import { analyticsService } from '@/services/analytics-service';
import { useAuthStore } from '@/stores/auth-store';
import { showError, showSuccess } from '@/utils/error-toast';
import React, { useEffect, useState } from 'react';
import { Linking, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorTheme } from '@/hooks/useColorTheme';
import { HStack } from '@/components/ui/HStack';

const FeatureRow: React.FC<{ text: string }> = ({ text }) => {
    const colors = useColorTheme();
    return (
        <HStack alignItems="center" gap="unit-3">
            <View
                style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.colors.primary,
                    marginTop: 6,
                }}
            />
            <TypographyText variant="body">{text}</TypographyText>
        </HStack>
    );
};

const PlanScreen = () => {
    const colors = useColorTheme();
    const [isLoading, setIsLoading] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [packagePrice, setPackagePrice] = useState<string | null>(null);
    const { isProUser, refreshProStatus } = useAuthStore();

    // Get subscription details if user is pro
    const subscriptionDetails = isProUser
        ? revenueCatService.getSubscriptionDetails(SUBSCRIPTION_CONSTANTS.PRO_ENTITLEMENT_ID)
        : null;

    // Load package price on mount
    useEffect(() => {
        const loadPrice = async () => {
            if (!isProUser && Platform.OS !== 'web') {
                const price = await revenueCatService.getPackagePrice(
                    SUBSCRIPTION_CONSTANTS.PRO_OFFERING_ID,
                    SUBSCRIPTION_CONSTANTS.PRO_PRODUCT_ID,
                );
                setPackagePrice(price);
            }
        };
        loadPrice();
    }, [isProUser]);

    const handleUpgradeToPro = async () => {
        if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
            showError(new Error('Subscriptions are currently only available on iOS and Android.'), {
                action: 'handleUpgradeToPro.platformCheck',
            });
            return;
        }

        setIsLoading(true);

        // Track purchase initiation
        const { user } = useAuthStore.getState();
        analyticsService.trackPurchaseInitiated(user?.id);

        try {
            // Ensure RevenueCat is initialized
            if (!revenueCatService.isInitialized()) {
                await revenueCatService.initialize();

                // Check again after initialization
                if (!revenueCatService.isInitialized()) {
                    showError(
                        new Error(
                            'RevenueCat is not properly configured. Please check your API key and try again.',
                        ),
                        {
                            action: 'handleUpgradeToPro.initialize',
                        },
                    );
                    setIsLoading(false);
                    return;
                }
            }

            // Get the current offering from RevenueCat
            const offering = await revenueCatService.getOfferings();
            if (!offering) {
                // Provide more helpful error message for configuration issues
                const errorMessage = __DEV__
                    ? 'Subscription offerings are not available. This is normal in development.\n\n' +
                      'To test subscriptions:\n' +
                      '• Set up products in App Store Connect\n' +
                      '• Configure StoreKit Configuration file in Xcode\n' +
                      '• Link products in RevenueCat dashboard\n\n' +
                      'See: https://rev.cat/why-are-offerings-empty'
                    : 'No subscription offerings are available. Please check your connection and try again later.';
                showError(new Error(errorMessage), {
                    action: 'handleUpgradeToPro.getOfferings',
                });
                setIsLoading(false);
                return;
            }

            // Get the package for the premium product
            const pkg = await revenueCatService.getPackageForProduct(
                SUBSCRIPTION_CONSTANTS.PRO_OFFERING_ID,
                SUBSCRIPTION_CONSTANTS.PRO_PRODUCT_ID,
            );

            // Fallback to first available package if specific product not found
            const packageToPurchase = pkg || offering.availablePackages?.[0];

            if (!packageToPurchase) {
                const errorMessage = __DEV__
                    ? 'No subscription packages available. This is a configuration issue.\n\n' +
                      'Please ensure:\n' +
                      '• Products are configured in RevenueCat dashboard\n' +
                      '• StoreKit Configuration file is set up (for testing)\n' +
                      '• Products are linked in App Store Connect\n\n' +
                      'See: https://rev.cat/why-are-offerings-empty'
                    : 'No subscription package available. Please try again later.';
                showError(new Error(errorMessage), {
                    action: 'handleUpgradeToPro.getPackage',
                });
                setIsLoading(false);
                return;
            }

            // Purchase the package
            const customerInfo = await revenueCatService.purchasePackage(packageToPurchase);

            if (customerInfo) {
                // Refresh pro status in auth store
                await refreshProStatus();
                showSuccess('Successfully upgraded to Flowzy Premium!', 'Upgrade Successful');

                // Track successful purchase
                analyticsService.trackPurchaseCompleted(user?.id, {
                    productId: SUBSCRIPTION_CONSTANTS.PRO_PRODUCT_ID,
                });
            }
        } catch (error: any) {
            // Error is already handled by revenueCatService, but we can add additional context
            if (error?.userCancelled) {
                // Track cancellation
                analyticsService.trackPurchaseCancelled(user?.id);
            } else {
                // Track failure
                analyticsService.trackPurchaseFailed(user?.id, error?.message || 'Unknown error');
                showError(error, {
                    action: 'handleUpgradeToPro.purchase',
                });
            }
        } finally {
            setIsLoading(false);
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

                    // Track successful restore
                    analyticsService.trackRestore(user?.id, true);
                } else {
                    // Track failed restore
                    analyticsService.trackRestore(user?.id, false, {
                        reason: 'no_active_subscription',
                    });
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

    const formatDate = (date: Date | null): string => {
        if (!date) return 'N/A';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Show subscription status for pro users
    if (isProUser && subscriptionDetails) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <ScrollView
                    contentContainerStyle={{
                        paddingTop: SPACING['unit-8'],
                        paddingBottom: SPACING['unit-16'],
                        paddingHorizontal: SPACING['unit-5'],
                    }}
                    style={{ flex: 1 }}
                >
                    <VStack gap="unit-4" mt="sm">
                        <TypographyText variant="title" color="default">
                            Subscription Status
                        </TypographyText>

                        <VStack gap="unit-2" mt="xs">
                            <HStack gap="unit-1">
                                <TypographyText variant="title" weight="bold" color="primary">
                                    Flowzy Premium
                                </TypographyText>
                            </HStack>
                            <TypographyText variant="body" size="sm">
                                You're currently subscribed to Flowzy Premium
                            </TypographyText>
                        </VStack>

                        <Card variant="bordered" style={{ borderRadius: 20, overflow: 'hidden' }}>
                            <CardBody>
                                <VStack gap="unit-4">
                                    <VStack gap="unit-3">
                                        <HStack alignItems="center" justifyContent="space-between">
                                            <TypographyText variant="body" weight="semibold">
                                                Status
                                            </TypographyText>
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
                                                    {subscriptionDetails.isActive
                                                        ? 'Active'
                                                        : 'Expired'}
                                                </TypographyText>
                                            </View>
                                        </HStack>

                                        {subscriptionDetails.expiryDate && (
                                            <HStack
                                                alignItems="center"
                                                justifyContent="space-between"
                                            >
                                                <TypographyText variant="body" weight="semibold">
                                                    {subscriptionDetails.willRenew
                                                        ? 'Renews on'
                                                        : 'Expires on'}
                                                </TypographyText>
                                                <TypographyText variant="body">
                                                    {formatDate(subscriptionDetails.expiryDate)}
                                                </TypographyText>
                                            </HStack>
                                        )}

                                        {subscriptionDetails.productIdentifier && (
                                            <HStack
                                                alignItems="center"
                                                justifyContent="space-between"
                                            >
                                                <TypographyText variant="body" weight="semibold">
                                                    Plan
                                                </TypographyText>
                                                <TypographyText variant="body">
                                                    {subscriptionDetails.productIdentifier}
                                                </TypographyText>
                                            </HStack>
                                        )}
                                    </VStack>

                                    <VStack gap="unit-2">
                                        <TypographyText variant="label">
                                            Premium Features
                                        </TypographyText>
                                        <VStack gap="unit-3">
                                            <FeatureRow text="Seamless Cloud Synchronization" />
                                            <FeatureRow text="Unlimited Todos" />
                                            <FeatureRow text="Fully Customizable Dashboards" />
                                        </VStack>
                                    </VStack>
                                </VStack>
                            </CardBody>
                        </Card>
                    </VStack>
                </ScrollView>

                <View
                    style={{
                        paddingHorizontal: SPACING['unit-5'],
                        paddingVertical: SPACING['unit-4'],
                        gap: SPACING['unit-3'],
                    }}
                >
                    <Button
                        size="lg"
                        variant="bordered"
                        onPress={handleManageSubscription}
                        isDisabled={Platform.OS === 'web'}
                    >
                        <TypographyText variant="body">Manage Subscription</TypographyText>
                    </Button>
                    <Button
                        size="md"
                        variant="light"
                        onPress={handleRestorePurchases}
                        isLoading={isRestoring}
                        isDisabled={isRestoring || Platform.OS === 'web'}
                    >
                        <TypographyText variant="body" size="sm">
                            Restore Purchases
                        </TypographyText>
                    </Button>
                </View>
            </SafeAreaView>
        );
    }

    // Show upgrade UI for non-pro users
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScrollView
                contentContainerStyle={{
                    paddingTop: SPACING['unit-8'],
                    paddingBottom: SPACING['unit-16'],
                    paddingHorizontal: SPACING['unit-5'],
                }}
                style={{ flex: 1 }}
            >
                <VStack gap="unit-4" mt="sm">
                    <TypographyText variant="title" color="default">
                        Subscription Plans
                    </TypographyText>

                    <VStack gap="unit-2" mt="xs">
                        <HStack gap="unit-1">
                            <TypographyText variant="title" weight="bold">
                                Upgrade to
                            </TypographyText>
                            <TypographyText variant="title" weight="bold" color="primary">
                                Flowzy Premium
                            </TypographyText>
                        </HStack>
                        <TypographyText variant="body" size="sm">
                            Boost your productivity and creativity with a smarter, faster.
                        </TypographyText>
                    </VStack>

                    <Card variant="bordered" style={{ borderRadius: 20, overflow: 'hidden' }}>
                        <CardBody>
                            <VStack gap="unit-4">
                                <VStack gap="unit-1">
                                    <HStack gap="unit-1" alignItems="baseline">
                                        <TypographyText variant="title" weight="bold">
                                            {packagePrice || '$2.99'}
                                        </TypographyText>
                                        {packagePrice && (
                                            <TypographyText
                                                variant="body"
                                                size="sm"
                                                style={{ opacity: 0.7 }}
                                            >
                                                /month
                                            </TypographyText>
                                        )}
                                    </HStack>
                                </VStack>

                                <VStack gap="unit-2">
                                    <TypographyText variant="label">Features</TypographyText>
                                    <VStack gap="unit-3">
                                        <FeatureRow text="Seamless Cloud Synchronization" />
                                        <FeatureRow text="Unlimited Todos" />
                                        <FeatureRow text="Fully Customizable Dashboards" />
                                    </VStack>
                                </VStack>
                            </VStack>
                        </CardBody>
                    </Card>
                </VStack>
            </ScrollView>

            <View
                style={{
                    paddingHorizontal: SPACING['unit-5'],
                    paddingVertical: SPACING['unit-4'],
                    gap: SPACING['unit-3'],
                }}
            >
                <Button
                    size="lg"
                    variant="solid"
                    onPress={handleUpgradeToPro}
                    isLoading={isLoading}
                    isDisabled={isLoading || Platform.OS === 'web'}
                >
                    <TypographyText variant="body" style={{ color: '#fff' }}>
                        Upgrade to Premium
                    </TypographyText>
                </Button>
                {Platform.OS !== 'web' && (
                    <Button
                        size="md"
                        variant="outline"
                        onPress={handleRestorePurchases}
                        isLoading={isRestoring}
                        isDisabled={isRestoring}
                    >
                        <TypographyText variant="body" size="sm">
                            Restore Purchases
                        </TypographyText>
                    </Button>
                )}
            </View>
        </SafeAreaView>
    );
};

export default PlanScreen;
