import TypographyText from '@/components/TypographyText';
import { AppleAuthService } from '@/services/apple-auth-service';
import { useAuthStore } from '@/stores/auth-store';
import { useSettingsStore } from '@/stores/local-settings-store';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { VStack, useTheme } from 'react-native-heroui';
import { SafeAreaView } from 'react-native-safe-area-context';

const OnboardingScreen: React.FC = () => {
    const { theme } = useTheme();
    const { setUserName, setOnboardingCompleted } = useSettingsStore();
    const { signInWithApple, loading, clearError } = useAuthStore();
    const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);

    // Check Apple Sign-In availability
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

    // Handle skipping authentication - allow free tier usage
    const handleSkipOnboarding = () => {
        setOnboardingCompleted(true);
        router.replace('/(tabs)');
    };

    // Handle Apple Sign-In - optional, for Pro users later
    const handleAppleSignIn = async () => {
        if (!isAppleSignInAvailable) {
            Alert.alert('Not Available', 'Apple Sign-In is not available on this device.');
            return;
        }

        try {
            clearError(); // Clear any previous errors
            const result = await signInWithApple();
            const displayName = result?.displayName || '';

            // Update local settings
            setUserName(displayName);
            setOnboardingCompleted(true);

            // Navigate to main app
            router.replace('/(tabs)');
        } catch (error: any) {
            // Don't show alert for user cancellation - it's expected behavior
            const isUserCancellation = error?.message?.toLowerCase().includes('cancel');
            if (!isUserCancellation) {
                console.error('Apple Sign-In failed:', error);
                Alert.alert('Sign-In Failed', 'Apple Sign-In failed. Please try again.');
            }
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <VStack gap="xl" style={styles.content}>
                    {/* Illustration Section */}
                    <VStack gap="lg" style={styles.illustrationSection}>
                        {/* Person with mug illustration */}
                        <View style={styles.illustrationContainer}>
                            <View style={styles.illustration}>
                                {/* Person silhouette */}
                                <View style={styles.person}>
                                    {/* Head */}
                                    <View
                                        style={[
                                            styles.head,
                                            { backgroundColor: theme.colors.foreground },
                                        ]}
                                    />
                                    {/* Hat */}
                                    <View
                                        style={[
                                            styles.hat,
                                            { backgroundColor: theme.colors.foreground },
                                        ]}
                                    />
                                    {/* Body */}
                                    <View
                                        style={[
                                            styles.body,
                                            { backgroundColor: theme.colors.foreground },
                                        ]}
                                    />
                                    {/* Arms and mug */}
                                    <View style={styles.armsContainer}>
                                        <View
                                            style={[
                                                styles.arm,
                                                styles.leftArm,
                                                { backgroundColor: theme.colors.foreground },
                                            ]}
                                        />
                                        <View
                                            style={[
                                                styles.mug,
                                                { backgroundColor: theme.colors.foreground },
                                            ]}
                                        />
                                        <View
                                            style={[
                                                styles.arm,
                                                styles.rightArm,
                                                { backgroundColor: theme.colors.foreground },
                                            ]}
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Title and Description */}
                        <VStack gap="sm" style={styles.textSection}>
                            <TypographyText variant="title" color="default" style={styles.title}>
                                Welcome to Flowzy
                            </TypographyText>
                            <TypographyText
                                variant="body"
                                color="secondary"
                                style={styles.description}
                            >
                                Get started with local task management. Sign in later to unlock
                                cloud sync.
                            </TypographyText>
                        </VStack>
                    </VStack>

                    {/* Action Buttons */}
                    <VStack gap="md" style={styles.buttonContainer}>
                        {/* Skip button for free tier */}
                        <TouchableOpacity
                            onPress={handleSkipOnboarding}
                            style={[
                                styles.skipButton,
                                {
                                    borderColor: theme.colors.border,
                                },
                            ]}
                        >
                            <TypographyText
                                variant="body"
                                style={[styles.skipButtonText, { color: theme.colors.foreground }]}
                            >
                                Continue Without Account
                            </TypographyText>
                        </TouchableOpacity>

                        {/* Apple Sign-In button (optional) */}
                        {isAppleSignInAvailable && (
                            <TouchableOpacity
                                onPress={handleAppleSignIn}
                                disabled={loading}
                                style={[
                                    styles.appleSignInButton,
                                    {
                                        backgroundColor: theme.colors.foreground,
                                        opacity: loading ? 0.6 : 1,
                                    },
                                ]}
                            >
                                <Ionicons
                                    name="logo-apple"
                                    size={20}
                                    color={theme.colors.background}
                                    style={styles.appleIcon}
                                />
                                <TypographyText
                                    variant="body"
                                    style={[
                                        styles.appleSignInText,
                                        { color: theme.colors.background },
                                    ]}
                                >
                                    Sign In with Apple
                                </TypographyText>
                            </TouchableOpacity>
                        )}
                    </VStack>
                </VStack>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 40,
    },
    illustrationSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    illustrationContainer: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    illustration: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    person: {
        width: 80,
        height: 100,
        position: 'relative',
    },
    head: {
        width: 40,
        height: 40,
        borderRadius: 20,
        position: 'absolute',
        top: 0,
        left: 20,
    },
    hat: {
        width: 50,
        height: 15,
        borderRadius: 25,
        position: 'absolute',
        top: -5,
        left: 15,
    },
    body: {
        width: 60,
        height: 50,
        borderRadius: 8,
        position: 'absolute',
        top: 40,
        left: 10,
    },
    armsContainer: {
        position: 'absolute',
        top: 50,
        left: 0,
        width: 80,
        height: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    arm: {
        width: 8,
        height: 20,
        borderRadius: 4,
    },
    leftArm: {
        marginLeft: 5,
    },
    rightArm: {
        marginRight: 5,
    },
    mug: {
        width: 20,
        height: 25,
        borderRadius: 4,
    },
    textSection: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 32,
    },
    description: {
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24,
        opacity: 0.8,
    },
    inputSection: {
        paddingHorizontal: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    nameInput: {
        borderWidth: 2,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        textAlign: 'center',
    },
    buttonContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    skipButton: {
        width: '100%',
        borderWidth: 2,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    skipButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    continueButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    appleSignInContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    appleSignInButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    appleIcon: {
        marginRight: 8,
    },
    appleSignInText: {
        fontSize: 16,
        fontWeight: '600',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginVertical: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        paddingHorizontal: 16,
        fontSize: 14,
    },
});

export default OnboardingScreen;
