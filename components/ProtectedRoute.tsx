import TypographyText from '@/components/TypographyText';
import { useAuthStore } from '@/stores/auth-store';
import { useSettingsStore } from '@/stores/local-settings-store';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-heroui';
import AuthLoadingScreen from './AuthLoadingScreen';

interface ProtectedRouteProps {
    children: React.ReactNode;
    /**
     * If true, requires onboarding to be completed
     * @default true
     */
    requireOnboarding?: boolean;
}

/**
 * ProtectedRoute Component
 *
 * Wraps content that requires authentication.
 * Note: Route-level protection is handled in app/_layout.tsx.
 * This component is useful for protecting specific UI sections.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireOnboarding = true }) => {
    const { user, isInitialized, loading } = useAuthStore();
    const { onboardingCompleted } = useSettingsStore();
    const { theme } = useTheme();

    useEffect(() => {
        // If auth is initialized and user is not authenticated, redirect to auth
        if (isInitialized && !user) {
            router.replace('/auth' as any);
            return;
        }

        // If onboarding is required and user hasn't completed it, redirect to onboarding
        // Note: Currently onboarding route doesn't exist, so this is commented out
        // if (requireOnboarding && user && !onboardingCompleted) {
        //   router.replace("/onboarding" as any);
        //   return;
        // }
    }, [user, isInitialized, requireOnboarding, onboardingCompleted]);

    // Show loading screen while checking authentication
    if (!isInitialized || loading) {
        return (
            <AuthLoadingScreen message={loading ? 'Verifying authentication...' : 'Loading...'} />
        );
    }

    // If user is not authenticated, show access denied message
    if (!user) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <TypographyText variant="title" style={styles.title}>
                    Access Denied
                </TypographyText>
                <TypographyText variant="body" style={styles.message}>
                    You need to sign in to access this screen.
                </TypographyText>
            </View>
        );
    }

    // If onboarding is required and user hasn't completed it
    // Note: Currently skipped since onboarding route doesn't exist
    // if (requireOnboarding && !onboardingCompleted) {
    //   return (
    //     <View
    //       style={[styles.container, { backgroundColor: theme.colors.background }]}
    //     >
    //       <TypographyText variant="title" style={styles.title}>
    //         Complete Setup
    //       </TypographyText>
    //       <TypographyText variant="body" style={styles.message}>
    //         Please complete the onboarding process to continue.
    //       </TypographyText>
    //     </View>
    //   );
    // }

    // User is authenticated (and onboarding completed if required), render the protected content
    return <>{children}</>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        marginBottom: 16,
        textAlign: 'center',
    },
    message: {
        textAlign: 'center',
        opacity: 0.7,
    },
});

export default ProtectedRoute;
