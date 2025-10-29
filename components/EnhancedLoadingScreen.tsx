import TypographyText from '@/components/TypographyText';
import { splashScreenService } from '@/services/splash-screen-service';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-heroui';

interface EnhancedLoadingScreenProps {
    message?: string;
    showProgress?: boolean;
}

const EnhancedLoadingScreen: React.FC<EnhancedLoadingScreenProps> = ({
    message = 'Initializing app...',
    showProgress = false,
}) => {
    const { theme } = useTheme();
    const [progress, setProgress] = useState(0);
    const [currentTask, setCurrentTask] = useState<string | undefined>();

    useEffect(() => {
        if (!showProgress) return;

        const updateProgress = () => {
            const progressInfo = splashScreenService.getProgress();
            setProgress(progressInfo.progress);
            setCurrentTask(progressInfo.currentTask);
        };

        // Update progress immediately
        updateProgress();

        // Update progress every 100ms
        const interval = setInterval(updateProgress, 100);

        return () => clearInterval(interval);
    }, [showProgress]);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* App Logo/Icon */}
            <View style={styles.logoContainer}>
                <View
                    style={[
                        styles.logo,
                        {
                            backgroundColor: theme.colors.primary,
                            shadowColor: theme.colors.primary,
                        },
                    ]}
                >
                    <TypographyText
                        variant="title"
                        style={[styles.logoText, { color: theme.colors.background }]}
                    >
                        🍅
                    </TypographyText>
                </View>
            </View>

            {/* Loading Indicator */}
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                    style={styles.spinner}
                />
                <TypographyText variant="body" color="secondary" style={styles.message}>
                    {message}
                </TypographyText>

                {/* Progress Bar */}
                {showProgress && (
                    <View style={styles.progressContainer}>
                        <View
                            style={[
                                styles.progressBar,
                                {
                                    backgroundColor: theme.colors.background,
                                    borderColor: theme.colors.foreground,
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        backgroundColor: theme.colors.primary,
                                        width: `${progress}%`,
                                    },
                                ]}
                            />
                        </View>
                        <TypographyText
                            variant="caption"
                            color="secondary"
                            style={styles.progressText}
                        >
                            {progress}% {currentTask && `• ${currentTask}`}
                        </TypographyText>
                    </View>
                )}
            </View>

            {/* App Name */}
            <View style={styles.appNameContainer}>
                <TypographyText variant="title" color="default" style={styles.appName}>
                    Focus25
                </TypographyText>
                <TypographyText variant="caption" color="secondary" style={styles.tagline}>
                    Stay focused, stay productive
                </TypographyText>
            </View>
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
    logoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    logoText: {
        fontSize: 48,
        fontWeight: 'bold',
    },
    loadingContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    spinner: {
        marginBottom: 16,
    },
    message: {
        textAlign: 'center',
        marginBottom: 20,
    },
    progressContainer: {
        width: '100%',
        alignItems: 'center',
    },
    progressBar: {
        width: '80%',
        height: 4,
        borderRadius: 2,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    progressText: {
        textAlign: 'center',
        fontSize: 12,
    },
    appNameContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    tagline: {
        fontSize: 14,
        opacity: 0.7,
    },
});

export default EnhancedLoadingScreen;
