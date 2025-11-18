import TypographyText from '@/components/TypographyText';
import React from 'react';
import { useTheme } from 'react-native-heroui';
import { StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

interface RetryButtonProps {
    onPress: () => void;
    isLoading?: boolean;
    label?: string;
}

/**
 * Retry Button Component
 * Standardized retry button for error recovery
 */
export default function RetryButton({
    onPress,
    isLoading = false,
    label = 'Retry',
}: RetryButtonProps) {
    const { theme } = useTheme();

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isLoading}
            style={[
                styles.button,
                {
                    backgroundColor: theme.colors.primary,
                    opacity: isLoading ? 0.6 : 1,
                },
            ]}
        >
            {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
                <TypographyText variant="body" style={[styles.buttonText, { color: '#FFFFFF' }]}>
                    {label}
                </TypographyText>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 100,
    },
    buttonText: {
        fontWeight: '600',
        fontSize: 16,
    },
});
