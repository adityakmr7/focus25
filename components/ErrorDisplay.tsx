import TypographyText from '@/components/TypographyText';
import { errorHandlingService } from '@/services/error-handling-service';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import RetryButton from './RetryButton';
import { useColorTheme } from '@/hooks/useColorTheme';

interface ErrorDisplayProps {
    error: Error | unknown;
    context?: Record<string, unknown>;
    onRetry?: () => void;
    message?: string;
    showRetry?: boolean;
}

/**
 * Error Display Component
 * Displays user-friendly error messages with optional retry button
 */
export default function ErrorDisplay({
    error,
    context,
    onRetry,
    message,
    showRetry = true,
}: ErrorDisplayProps) {
    const colors = useColorTheme();
    const appError = errorHandlingService.processError(error, context);

    // Use custom message if provided, otherwise use processed error message
    const displayMessage = message || appError.userMessage;

    // Don't render if message is empty (silent errors)
    if (!displayMessage) {
        return null;
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.content}>
                <TypographyText
                    variant="body"
                    style={[styles.message, { color: colors.contentPrimary }]}
                >
                    {displayMessage}
                </TypographyText>

                {showRetry && appError.retryable && onRetry && (
                    <View style={styles.retryContainer}>
                        <RetryButton onPress={onRetry} />
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        maxWidth: 400,
    },
    message: {
        textAlign: 'center',
        marginBottom: 24,
        opacity: 0.8,
        fontSize: 16,
        lineHeight: 24,
    },
    retryContainer: {
        marginTop: 8,
    },
});
