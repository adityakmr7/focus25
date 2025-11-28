import React, { useState, useEffect } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, VStack, HStack, SPACING, useTheme } from 'react-native-heroui';
import TypographyText from '@/components/TypographyText';
import { useAuthStore } from '@/stores/auth-store';
import { router } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { showError } from '@/utils/error-toast';
import { useColorTheme } from '@/hooks/useColorTheme';

export default function AuthScreen() {
    const colors = useColorTheme();
    const { signInWithApple, user, loading } = useAuthStore();
    const [isAppleAvailable, setIsAppleAvailable] = useState(false);

    useEffect(() => {
        // Check if Apple Sign-In is available
        AppleAuthentication.isAvailableAsync().then(setIsAppleAvailable);
    }, []);

    // Note: Redirect logic is handled in root _layout.tsx
    // This prevents authenticated users from seeing the auth screen

    const handleAppleSignIn = async () => {
        try {
            await signInWithApple();
            // Navigation will happen automatically via root layout redirect logic
        } catch (error: any) {
            // Don't show error for user cancellations
            const isCancellation =
                error?.code === 'ERR_REQUEST_CANCELED' ||
                error?.message?.toLowerCase().includes('cancel');

            if (!isCancellation) {
                showError(error, { action: 'handleAppleSignIn' });
            }
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.content}>
                <View style={{ flex: 0.5 }} />
                <VStack flex={1} gap="unit-4" alignItems="center" mt="xl">
                    <TypographyText
                        style={{ color: colors.contentPrimary }}
                        variant="title"
                        size="2xl"
                        weight="bold"
                    >
                        Flowzy
                    </TypographyText>
                    <TypographyText
                        variant="body"
                        size="lg"
                        style={{
                            textAlign: 'center',
                            opacity: 0.7,
                            color: colors.contentSecondary,
                        }}
                    >
                        Focus on what matters
                    </TypographyText>
                </VStack>

                {/* Sign In Section */}
                <VStack gap="unit-6" style={styles.signInSection}>
                    {/* Apple Sign-In Button */}
                    {Platform.OS === 'ios' && isAppleAvailable && (
                        <View style={styles.appleButtonContainer}>
                            <AppleAuthentication.AppleAuthenticationButton
                                buttonType={
                                    AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                                }
                                buttonStyle={
                                    AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                                }
                                cornerRadius={8}
                                style={styles.appleButton}
                                onPress={handleAppleSignIn}
                            />
                        </View>
                    )}

                    {/* Fallback for non-iOS or when Apple Sign-In is not available */}
                    {(!isAppleAvailable || Platform.OS !== 'ios') && (
                        <Button
                            size="lg"
                            variant="solid"
                            onPress={handleAppleSignIn}
                            isLoading={loading}
                            isDisabled={loading}
                            style={styles.fallbackButton}
                        >
                            <TypographyText variant="body" style={{ color: colors.contentPrimary }}>
                                {Platform.OS === 'ios'
                                    ? 'Sign in with Apple'
                                    : 'Sign in (Apple Sign-In not available)'}
                            </TypographyText>
                        </Button>
                    )}
                </VStack>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: SPACING['unit-5'],
        paddingVertical: SPACING['unit-8'],
    },
    signInSection: {
        width: '100%',
        alignItems: 'center',
        marginTop: SPACING['unit-8'],
    },
    appleButtonContainer: {
        width: '100%',
        height: 50,
        marginTop: SPACING['unit-4'],
    },
    appleButton: {
        width: '100%',
        height: 50,
    },
    fallbackButton: {
        width: '100%',
        marginTop: SPACING['unit-4'],
    },
});
