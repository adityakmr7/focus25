import TypographyText from '@/components/TypographyText';
import { SUBSCRIPTION_CONSTANTS } from '@/constants/subscription';
import { revenueCatService } from '@/services/revenuecat-service';
import { useAuthStore } from '@/stores/auth-store';
import { showError, showSuccess } from '@/utils/error-toast';
import React, { useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { Button, Card, CardBody, HStack, SPACING, VStack, useTheme } from 'react-native-heroui';
import { SafeAreaView } from 'react-native-safe-area-context';

const FeatureRow: React.FC<{ text: string }> = ({ text }) => {
    const { theme } = useTheme();
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
    const { theme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const refreshProStatus = useAuthStore((state) => state.refreshProStatus);

    const handleUpgradeToPro = async () => {
        if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
            showError(new Error('Subscriptions are currently only available on iOS and Android.'), {
                action: 'handleUpgradeToPro.platformCheck',
            });
            return;
        }

        setIsLoading(true);
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
                // Provide more helpful error message
                const errorMessage =
                    'No subscription offerings are available. This could mean:\n' +
                    '• Offerings are not configured in RevenueCat dashboard\n' +
                    '• There is a network connectivity issue\n' +
                    '• The app is not properly connected to RevenueCat\n\n' +
                    'Please check your RevenueCat configuration and try again.';
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
                showError(new Error('No subscription package available. Please try again later.'), {
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
            }
        } catch (error: any) {
            // Error is already handled by revenueCatService, but we can add additional context
            if (!error?.userCancelled) {
                showError(error, {
                    action: 'handleUpgradeToPro.purchase',
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

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
                                            $2.99
                                        </TypographyText>
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
                }}
            >
                <Button
                    size="lg"
                    variant="solid"
                    onPress={handleUpgradeToPro}
                    isLoading={isLoading}
                    isDisabled={isLoading}
                >
                    <TypographyText variant="body" style={{ color: '#fff' }}>
                        Upgrade to Plus
                    </TypographyText>
                </Button>
            </View>
        </SafeAreaView>
    );
};

export default PlanScreen;
