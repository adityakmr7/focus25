import TypographyText from '@/components/TypographyText';
import { AppleAuthService } from '@/services/apple-auth-service';
import { useAuthStore } from '@/stores/auth-store';
import { useSettingsStore } from '@/stores/local-settings-store';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
    NativeScrollEvent,
    NativeSyntheticEvent,
} from 'react-native';
import { VStack, useTheme } from 'react-native-heroui';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
    id: string;
    backgroundColor: string;
    title: string;
    description: string;
    icon: string;
}

const onboardingSlides: OnboardingSlide[] = [
    {
        id: '1',
        backgroundColor: '#E8F5E9', // Light green
        title: 'Focus on what matters',
        description:
            'Organize your tasks and stay on top of your goals with a clean, intuitive interface.',
        icon: 'checkmark-circle',
    },
    {
        id: '2',
        backgroundColor: '#FFF3E0', // Light orange/yellow
        title: 'Master your time',
        description:
            'Use the Pomodoro technique to boost productivity with focused work sessions and breaks.',
        icon: 'timer',
    },
    {
        id: '3',
        backgroundColor: '#F3E5F5', // Light purple/pink
        title: 'Achieve your goals',
        description:
            'Track your progress and build lasting habits with personalized insights and reminders.',
        icon: 'trophy',
    },
];

const OnboardingScreen: React.FC = () => {
    const { theme } = useTheme();
    const { setUserName, setOnboardingCompleted } = useSettingsStore();
    const { signInWithApple, loading, clearError } = useAuthStore();
    const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

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

    // Helper function to check if error is a cancellation
    const isCancellationError = (error: any): boolean => {
        if (!error) return false;

        // Check error code
        if (error.code === 'ERR_REQUEST_CANCELED') return true;

        // Check error message for cancellation keywords
        const errorMessage = error.message || error.toString() || '';
        const cancellationKeywords = ['cancel', 'cancelled', 'dismissed', 'aborted'];
        return cancellationKeywords.some((keyword) => errorMessage.toLowerCase().includes(keyword));
    };

    const handleAppleSignIn = async () => {
        if (!isAppleSignInAvailable) {
            Alert.alert('Not Available', 'Apple Sign-In is not available on this device.');
            return;
        }

        try {
            clearError();
            const result = await signInWithApple();
            const displayName = result?.displayName || '';
            const email = result?.email || '';

            // If no display name, use email prefix (part before @) as username
            let userName = displayName;
            if (!userName && email) {
                userName = email.split('@')[0];
            }

            setUserName(userName);
            if (email) {
                useSettingsStore.getState().setUserEmail(email);
            }
            setOnboardingCompleted(true);

            router.replace('/(tabs)');
        } catch (error: any) {
            // Handle cancellation gracefully - don't show error alert
            if (isCancellationError(error)) {
                console.log('User canceled Apple Sign-In');
                clearError();
                return;
            }

            // Only show alert for actual errors
            console.error('Apple Sign-In failed:', error);
            Alert.alert('Sign-In Failed', 'Apple Sign-In failed. Please try again.');
        }
    };

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        const roundIndex = Math.round(index);
        setCurrentIndex(roundIndex);
    };

    const renderSlide = ({ item }: { item: OnboardingSlide }) => (
        <View
            style={[
                styles.slide,
                {
                    backgroundColor: item.backgroundColor,
                    width: SCREEN_WIDTH,
                },
            ]}
        >
            <VStack gap="xl" style={styles.slideContent}>
                {/* Illustration */}
                <View style={styles.illustrationContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons
                            name={item.icon as any}
                            size={70}
                            color={theme.colors.foreground}
                        />
                    </View>
                </View>

                {/* Text Content */}
                <VStack gap="md" style={styles.textContainer}>
                    <TypographyText
                        variant="heading"
                        color="default"
                        weight="bold"
                        style={styles.slideTitle}
                    >
                        {item.title}
                    </TypographyText>
                    <TypographyText variant="body" color="default" style={styles.slideDescription}>
                        {item.description}
                    </TypographyText>
                </VStack>
            </VStack>
        </View>
    );

    const renderPagination = () => (
        <View style={styles.pagination}>
            {onboardingSlides.map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.paginationDot,
                        {
                            backgroundColor:
                                index === currentIndex
                                    ? theme.colors.foreground
                                    : theme.colors.foreground + '40',
                            width: index === currentIndex ? 24 : 8,
                        },
                    ]}
                />
            ))}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.content}>
                {/* Slides Carousel */}
                <FlatList
                    ref={flatListRef}
                    data={onboardingSlides}
                    renderItem={renderSlide}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    keyExtractor={(item) => item.id}
                />

                {/* Pagination Dots */}
                {renderPagination()}

                {/* Footer Actions */}
                <View style={styles.footer}>
                    {isAppleSignInAvailable && (
                        <>
                            <TouchableOpacity
                                onPress={handleAppleSignIn}
                                disabled={loading}
                                style={[
                                    styles.primaryButton,
                                    {
                                        backgroundColor: theme.colors.foreground,
                                        opacity: loading ? 0.6 : 1,
                                    },
                                ]}
                            >
                                <TypographyText
                                    variant="body"
                                    weight="semibold"
                                    style={[styles.buttonText, { color: theme.colors.background }]}
                                >
                                    CONTINUE WITH APPLE
                                </TypographyText>
                            </TouchableOpacity>
                            <View style={{ marginTop: 8 }}></View>
                        </>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    slideContent: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        paddingHorizontal: 32,
        paddingTop: 80,
        paddingBottom: 40,
    },
    illustrationContainer: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 60,
        marginTop: 40,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
    },
    textContainer: {
        alignItems: 'flex-start',
        width: '100%',
        paddingHorizontal: 0,
        marginTop: 0,
    },
    slideTitle: {
        fontSize: 32,
        fontWeight: '700',
        lineHeight: 40,
        letterSpacing: -0.5,
        textAlign: 'left',
        color: '#000000',
    },
    slideDescription: {
        fontSize: 17,
        lineHeight: 26,
        textAlign: 'left',
        color: '#000000',
        opacity: 0.8,
        fontWeight: '400',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 24,
    },
    paginationDot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 32,
        paddingTop: 8,
        backgroundColor: '#FFFFFF',
    },
    primaryButton: {
        width: '100%',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    secondaryButton: {
        width: '100%',
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    linkText: {
        fontSize: 16,
        fontWeight: '500',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
});

export default OnboardingScreen;
