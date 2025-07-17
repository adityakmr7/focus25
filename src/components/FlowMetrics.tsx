import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { usePomodoroStore } from '../store/pomodoroStore';
import { useThemeStore } from '../store/themeStore';
import { useColorScheme } from 'react-native';

interface FlowMetricsProps {
    showDetailed?: boolean;
}

export const FlowMetrics: React.FC<FlowMetricsProps> = ({ showDetailed = false }) => {
    const { flowMetrics } = usePomodoroStore();
    const { mode, getCurrentTheme } = useThemeStore();
    const systemColorScheme = useColorScheme();
    const theme = getCurrentTheme();
    const isDark = mode === 'auto' ? systemColorScheme === 'dark' : mode === 'dark';
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    const getFlowIntensityColor = (intensity: string) => {
        switch (intensity) {
            case 'high':
                return theme.success;
            case 'medium':
                return theme.warning;
            case 'low':
                return theme.error;
            default:
                return theme.textSecondary;
        }
    };

    const getFlowIntensityEmoji = (intensity: string) => {
        switch (intensity) {
            case 'high':
                return '🔥';
            case 'medium':
                return '⚡';
            case 'low':
                return '🌱';
            default:
                return '⚪';
        }
    };

    const getFlowIntensityGradient = (intensity: string) => {
        switch (intensity) {
            case 'high':
                return [theme.success, theme.success + '80'];
            case 'medium':
                return [theme.warning, theme.warning + '80'];
            case 'low':
                return [theme.error, theme.error + '80'];
            default:
                return [theme.textSecondary, theme.textSecondary + '80'];
        }
    };

    const translateY = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [30, 0],
    });

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    if (!showDetailed) {
        return (
            <Animated.View
                style={[
                    styles.compactContainer,
                    {
                        opacity,
                        transform: [{ translateY }],
                    },
                ]}
            >
                <View style={[styles.compactCard, { backgroundColor: theme.surface }]}>
                    <View style={styles.flowIndicator}>
                        <View
                            style={[
                                styles.flowIconContainer,
                                {
                                    backgroundColor:
                                        getFlowIntensityColor(flowMetrics.flowIntensity) + '20',
                                },
                            ]}
                        >
                            <Text style={styles.flowEmoji}>
                                {getFlowIntensityEmoji(flowMetrics.flowIntensity)}
                            </Text>
                        </View>
                        <View style={styles.flowTextContainer}>
                            <Text
                                style={[
                                    styles.flowIntensityText,
                                    { color: getFlowIntensityColor(flowMetrics.flowIntensity) },
                                ]}
                            >
                                {flowMetrics.flowIntensity.toUpperCase()} FLOW
                            </Text>
                            <Text style={[styles.flowSubtext, { color: theme.textSecondary }]}>
                                Current state
                            </Text>
                        </View>
                    </View>
                    <View style={styles.streakContainer}>
                        <Text style={[styles.streakNumber, { color: theme.accent }]}>
                            {flowMetrics.currentStreak}
                        </Text>
                        <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>
                            day streak
                        </Text>
                    </View>
                </View>
            </Animated.View>
        );
    }

    return (
        <Animated.View
            style={[
                styles.detailedContainer,
                {
                    opacity,
                    transform: [{ translateY }],
                },
            ]}
        >
            <Text style={[styles.title, { color: theme.text }]}>Flow State Metrics</Text>

            <View style={styles.metricsGrid}>
                <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.metricValue, { color: theme.text }]}>
                        {flowMetrics.currentStreak}
                    </Text>
                    <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                        Current Streak
                    </Text>
                </View>

                <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.metricValue, { color: theme.text }]}>
                        {flowMetrics.longestStreak}
                    </Text>
                    <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                        Best Streak
                    </Text>
                </View>

                <View
                    style={[
                        styles.metricCard,
                        {
                            backgroundColor:
                                getFlowIntensityColor(flowMetrics.flowIntensity) + '10',
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.metricValue,
                            { color: getFlowIntensityColor(flowMetrics.flowIntensity) },
                        ]}
                    >
                        {getFlowIntensityEmoji(flowMetrics.flowIntensity)}
                    </Text>
                    <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                        Flow Intensity
                    </Text>
                </View>

                <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.metricValue, { color: theme.text }]}>
                        {Math.round(flowMetrics.averageSessionLength)}m
                    </Text>
                    <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                        Avg Session
                    </Text>
                </View>
            </View>

            <View style={[styles.detailedStats, { backgroundColor: theme.surface }]}>
                <View style={[styles.statRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                        Total Focus Time:
                    </Text>
                    <Text style={[styles.statValue, { color: theme.text }]}>
                        {Math.floor(flowMetrics.totalFocusTime / 60)}h{' '}
                        {flowMetrics.totalFocusTime % 60}m
                    </Text>
                </View>

                <View style={[styles.statRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                        Best Flow Duration:
                    </Text>
                    <Text style={[styles.statValue, { color: theme.text }]}>
                        {Math.round(flowMetrics.bestFlowDuration)}m
                    </Text>
                </View>

                <View style={[styles.statRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                        Consecutive Sessions:
                    </Text>
                    <Text style={[styles.statValue, { color: theme.text }]}>
                        {flowMetrics.consecutiveSessions}
                    </Text>
                </View>

                <View style={[styles.statRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                        Distractions Today:
                    </Text>
                    <Text
                        style={[
                            styles.statValue,
                            {
                                color:
                                    flowMetrics.distractionCount > 5 ? theme.error : theme.success,
                            },
                        ]}
                    >
                        {flowMetrics.distractionCount}
                    </Text>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    compactContainer: {
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    compactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderRadius: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    flowIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    flowIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    flowEmoji: {
        fontSize: 20,
    },
    flowTextContainer: {
        flex: 1,
    },
    flowIntensityText: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    flowSubtext: {
        fontSize: 12,
        marginTop: 2,
        opacity: 0.7,
    },
    streakContainer: {
        alignItems: 'center',
    },
    streakNumber: {
        fontSize: 24,
        fontWeight: '800',
    },
    streakLabel: {
        fontSize: 12,
        marginTop: 2,
        opacity: 0.7,
    },
    detailedContainer: {
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 24,
        textAlign: 'center',
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 16,
    },
    metricCard: {
        width: '47%',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    metricValue: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    metricLabel: {
        fontSize: 12,
        textAlign: 'center',
        opacity: 0.7,
    },
    detailedStats: {
        borderRadius: 16,
        padding: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    statLabel: {
        fontSize: 14,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
    },
});
