import TypographyText from '@/components/TypographyText';
import { errorHandlingService } from '@/services/error-handling-service';
import { useTheme } from '@/hooks/useTheme';
import React, { Component, ReactNode } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';

interface Props {
    children: ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

/**
 * Global Error Boundary
 * Catches all React errors and displays a user-friendly error screen
 */
class GlobalErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Process error through error handling service
        const appError = errorHandlingService.processError(error, {
            componentStack: errorInfo.componentStack,
        });

        // Log error details
        console.error('Global Error Boundary caught an error:', {
            error,
            errorInfo,
            appError,
        });

        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    handleReload = () => {
        // Reload the app by resetting the error state
        this.handleReset();
        // In a real app, you might want to reload the entire app
        // For now, we'll just reset the error state
    };

    render() {
        if (this.state.hasError) {
            const { error } = this.state;
            const appError = error ? errorHandlingService.processError(error) : null;
            const isDev = __DEV__;

            return (
                <ErrorBoundaryScreen
                    error={error}
                    appError={appError}
                    errorInfo={this.state.errorInfo}
                    isDev={isDev}
                    onReset={this.handleReset}
                    onReload={this.handleReload}
                />
            );
        }

        return this.props.children;
    }
}

interface ErrorBoundaryScreenProps {
    error: Error | null;
    appError: ReturnType<typeof errorHandlingService.processError> | null;
    errorInfo: React.ErrorInfo | null;
    isDev: boolean;
    onReset: () => void;
    onReload: () => void;
}

function ErrorBoundaryScreen({
    error,
    appError,
    errorInfo,
    isDev,
    onReset,
    onReload,
}: ErrorBoundaryScreenProps) {
    const { theme } = useTheme();

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: theme.colors.background },
            ]}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>
                    <TypographyText
                        variant="title"
                        style={[styles.title, { color: theme.colors.foreground }]}
                    >
                        Oops! Something went wrong
                    </TypographyText>

                    <TypographyText
                        variant="body"
                        style={[styles.message, { color: theme.colors.foreground }]}
                    >
                        {appError?.userMessage || 'An unexpected error occurred. Please try again.'}
                    </TypographyText>

                    {isDev && error && (
                        <View style={styles.devInfo}>
                            <TypographyText
                                variant="body"
                                size="sm"
                                style={[styles.devTitle, { color: theme.colors.foreground }]}
                            >
                                Debug Information (Dev Mode):
                            </TypographyText>
                            <TypographyText
                                variant="body"
                                size="sm"
                                style={[styles.devText, { color: theme.colors.foreground }]}
                            >
                                {error.toString()}
                            </TypographyText>
                            {errorInfo?.componentStack && (
                                <TypographyText
                                    variant="body"
                                    size="sm"
                                    style={[styles.devText, { color: theme.colors.foreground }]}
                                >
                                    {errorInfo.componentStack}
                                </TypographyText>
                            )}
                        </View>
                    )}

                    <View style={styles.buttons}>
                        <TouchableOpacity
                            onPress={onReset}
                            style={[
                                styles.button,
                                styles.primaryButton,
                                { backgroundColor: theme.colors.primary },
                            ]}
                        >
                            <TypographyText
                                variant="body"
                                style={[styles.buttonText, { color: '#FFFFFF' }]}
                            >
                                Try Again
                            </TypographyText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onReload}
                            style={[
                                styles.button,
                                styles.secondaryButton,
                                { borderColor: theme.colors.border },
                            ]}
                        >
                            <TypographyText
                                variant="body"
                                style={[styles.buttonText, { color: theme.colors.foreground }]}
                            >
                                Reload App
                            </TypographyText>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
    },
    title: {
        marginBottom: 16,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
    },
    message: {
        marginBottom: 32,
        textAlign: 'center',
        opacity: 0.8,
        fontSize: 16,
        lineHeight: 24,
    },
    devInfo: {
        width: '100%',
        marginBottom: 24,
        padding: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
    },
    devTitle: {
        marginBottom: 8,
        fontWeight: '600',
    },
    devText: {
        fontSize: 12,
        fontFamily: 'monospace',
        opacity: 0.8,
    },
    buttons: {
        width: '100%',
        gap: 12,
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButton: {
        minWidth: 200,
    },
    secondaryButton: {
        borderWidth: 1,
        minWidth: 200,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default GlobalErrorBoundary;

