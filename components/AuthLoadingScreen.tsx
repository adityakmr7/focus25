import TypographyText from '@/components/TypographyText';
import { useColorTheme } from '@/hooks/useColorTheme';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface AuthLoadingScreenProps {
    message?: string;
}

const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({
    message = 'Initializing authentication...',
}) => {
    const colors = useColorTheme();
    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
            <ActivityIndicator size="large" color={colors.contentPrimary} style={styles.spinner} />
            <TypographyText variant="body" color="secondary" style={styles.message}>
                {message}
            </TypographyText>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    spinner: {
        marginBottom: 16,
    },
    message: {
        textAlign: 'center',
    },
});

export default AuthLoadingScreen;
