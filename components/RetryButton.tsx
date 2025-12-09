import TypographyText from '@/components/TypographyText';
import { useColorTheme } from '@/hooks/useColorTheme';
import React from 'react';
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
    const colors = useColorTheme();

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isLoading}
            style={[
                styles.button,
                {
                    backgroundColor: colors.backgroundPrimary,
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
