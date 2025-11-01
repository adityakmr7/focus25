import { useSubscriptionStore } from '@/stores/subscription-store';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { HStack, VStack, useTheme } from 'react-native-heroui';
import TypographyText from './TypographyText';

const UpgradeToProBanner: React.FC = () => {
    const { theme } = useTheme();
    const { isPro } = useSubscriptionStore();

    // Don't show banner for Pro users
    if (isPro) return null;

    const handlePress = () => {
        // Navigate to subscription/upgrade screen
        // TODO: Create this screen later
        router.push('/subscription');
    };

    return (
        <Pressable
            style={[styles.banner, { backgroundColor: theme.colors.primary }]}
            onPress={handlePress}
        >
            <HStack alignItems="center" justifyContent="space-between" px="md">
                <VStack flex={1}>
                    <TypographyText variant="title" size="md" style={styles.bannerTitle}>
                        ✨ Upgrade to Pro
                    </TypographyText>
                    <TypographyText variant="caption" style={styles.bannerSubtitle}>
                        Unlock cloud sync for $4.99/month
                    </TypographyText>
                </VStack>
                <TypographyText variant="title" size="md" style={styles.bannerCTA}>
                    Upgrade →
                </TypographyText>
            </HStack>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    banner: {
        paddingVertical: 12,
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    bannerTitle: {
        color: 'white',
        fontWeight: '600',
    },
    bannerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
    },
    bannerCTA: {
        color: 'white',
        fontWeight: '700',
    },
});

export default UpgradeToProBanner;
