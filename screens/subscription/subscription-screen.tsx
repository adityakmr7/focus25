import TypographyText from '@/components/TypographyText';
import { AppleAuthService } from '@/services/apple-auth-service';
import { useAuthStore } from '@/stores/auth-store';
import { useSubscriptionStore } from '@/stores/subscription-store';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Spinner, VStack, useTheme } from 'react-native-heroui';
import { SafeAreaView } from 'react-native-safe-area-context';

const SubscriptionScreen: React.FC = () => {
    const { theme } = useTheme();
    const { user, signInWithApple } = useAuthStore();
    const { isPro, isLoading, purchasePro, error, clearError, checkProStatus } = useSubscriptionStore();
    const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);

    useEffect(() => {
        // Check if user just signed in
        if (user && !isPro) {
            checkProStatus();
        }
    }, [user]);

    useEffect(() => {
        const checkAppleSignIn = async () => {
            try {
                const isAvailable = await AppleAuthService.isAvailable();
                setIsAppleSignInAvailable(isAvailable);
            } catch (error) {
                console.error('Error checking Apple Sign-In availability:', error);
            }
        };
        checkAppleSignIn();
    }, []);

    const handlePurchase = async () => {
        clearError();

        // Check if user needs to sign in first
        if (!user) {
            if (!isAppleSignInAvailable) {
                Alert.alert('Sign In Required', 'Please sign in with Apple to purchase Pro.');
                return;
            }

            try {
                await signInWithApple();
                // After sign-in, purchase will continue
            } catch (error) {
                Alert.alert('Sign In Failed', 'Please try again.');
                return;
            }
        }

        // Now attempt purchase
        const success = await purchasePro();
        
        if (success) {
            Alert.alert(
                'Welcome to Pro!',
                'Your Pro subscription is now active. Cloud sync has been enabled.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            router.back();
                        }
                    }
                ]
            );
        } else if (error && !error.includes('cancelled')) {
            Alert.alert('Purchase Failed', error);
        }
    };

    // If already Pro, show success state
    if (isPro) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <VStack gap="xl" style={styles.content}>
                        <View style={styles.iconContainer}>
                            <View style={[styles.iconCircle, { backgroundColor: theme.colors.success }]}>
                                <Ionicons name="checkmark" size={48} color="white" />
                            </View>
                        </View>
                        
                        <VStack gap="md" style={styles.textSection}>
                            <TypographyText variant="title" style={styles.title}>
                                You're a Pro!
                            </TypographyText>
                            <TypographyText variant="body" color="secondary" style={styles.description}>
                                Your Pro subscription is active. Enjoy cloud sync across all your devices.
                            </TypographyText>
                        </VStack>

                        <View style={styles.benefitsContainer}>
                            <BenefitItem icon="sync" title="Cloud Sync" description="Sync across all devices" />
                            <BenefitItem icon="cloud" title="Secure Backup" description="Your data is always safe" />
                            <BenefitItem icon="phone-portrait" title="Multi-Device" description="Access anywhere" />
                        </View>

                        <Button
                            variant="solid"
                            onPress={() => router.back()}
                        >
                            Continue
                        </Button>
                    </VStack>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <VStack gap="xl" style={styles.content}>
                    {/* Close button */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="close" size={28} color={theme.colors.foreground} />
                        </TouchableOpacity>
                    </View>

                    {/* Header */}
                    <VStack gap="sm" style={styles.textSection}>
                        <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                            <TypographyText variant="caption" style={styles.badgeText}>
                                PRO
                            </TypographyText>
                        </View>
                        <TypographyText variant="heading" style={styles.heading}>
                            Unlock Cloud Sync
                        </TypographyText>
                        <TypographyText variant="body" color="secondary" style={styles.description}>
                            Keep your todos and focus sessions synced across all your devices
                        </TypographyText>
                    </VStack>

                    {/* Price */}
                    <View style={styles.priceContainer}>
                        <TypographyText variant="heading" style={[styles.price, { color: theme.colors.primary }]}>
                            $4.99
                        </TypographyText>
                        <TypographyText variant="body" color="secondary">
                            per month
                        </TypographyText>
                    </View>

                    {/* Benefits */}
                    <View style={styles.benefitsContainer}>
                        <BenefitItem icon="sync" title="Cloud Sync" description="Access your data on any device" />
                        <BenefitItem icon="cloud-outline" title="Automatic Backup" description="Never lose your progress" />
                        <BenefitItem icon="shield-checkmark" title="Secure & Private" description="End-to-end encryption" />
                    </View>

                    {/* Purchase button */}
                    <Button
                        variant="solid"
                        size="lg"
                        onPress={handlePurchase}
                        isLoading={isLoading}
                        disabled={isLoading}
                    >
                        {user ? 'Subscribe for $4.99/month' : 'Sign In & Subscribe'}
                    </Button>

                    {/* Restore purchases */}
                    <TouchableOpacity 
                        onPress={async () => {
                            const success = await useSubscriptionStore.getState().restorePurchases();
                            if (success) {
                                Alert.alert('Success', 'Your purchases have been restored.');
                            } else {
                                Alert.alert('No Purchases', 'No active subscriptions found.');
                            }
                        }}
                    >
                        <TypographyText variant="caption" color="secondary">
                            Restore Purchases
                        </TypographyText>
                    </TouchableOpacity>

                    {error && (
                        <View style={[styles.errorContainer, { backgroundColor: theme.colors.danger + '20' }]}>
                            <TypographyText variant="caption" style={[styles.errorText, { color: theme.colors.danger }]}>
                                {error}
                            </TypographyText>
                        </View>
                    )}
                </VStack>
            </ScrollView>
        </SafeAreaView>
    );
};

// Benefit item component
const BenefitItem: React.FC<{ icon: string; title: string; description: string }> = ({ 
    icon, 
    title, 
    description 
}) => {
    const { theme } = useTheme();
    
    return (
        <View style={styles.benefitItem}>
            <View style={[styles.benefitIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons name={icon as any} size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.benefitText}>
                <TypographyText variant="body" weight="semibold">
                    {title}
                </TypographyText>
                <TypographyText variant="caption" color="secondary">
                    {description}
                </TypographyText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 32,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    header: {
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    iconContainer: {
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 16,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textSection: {
        alignItems: 'center',
        marginTop: 16,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 12,
    },
    heading: {
        textAlign: 'center',
        fontSize: 32,
        fontWeight: '700',
        marginTop: 8,
    },
    title: {
        textAlign: 'center',
        fontSize: 28,
        fontWeight: '700',
    },
    description: {
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24,
        marginTop: 8,
    },
    priceContainer: {
        alignItems: 'center',
        marginVertical: 16,
    },
    price: {
        fontSize: 48,
        fontWeight: '700',
    },
    benefitsContainer: {
        gap: 16,
        marginTop: 8,
        marginBottom: 24,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 12,
    },
    benefitIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    benefitText: {
        flex: 1,
        gap: 4,
    },
    errorContainer: {
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
    },
    errorText: {
        textAlign: 'center',
    },
});

export default SubscriptionScreen;

