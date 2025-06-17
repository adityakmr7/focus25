import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { usePomodoroStore } from '../store/pomodoroStore';

interface FlowMetricsProps {
    showDetailed?: boolean;
}

export const FlowMetrics: React.FC<FlowMetricsProps> = ({ showDetailed = false }) => {
    const { flowMetrics } = usePomodoroStore();
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
            case 'high': return '#10B981'; // Green
            case 'medium': return '#F59E0B'; // Yellow
            case 'low': return '#EF4444'; // Red
            default: return '#6B7280'; // Gray
        }
    };

    const getFlowIntensityEmoji = (intensity: string) => {
        switch (intensity) {
            case 'high': return '🔥';
            case 'medium': return '⚡';
            case 'low': return '🌱';
            default: return '⚪';
        }
    };

    const getFlowIntensityGradient = (intensity: string) => {
        switch (intensity) {
            case 'high': return ['#10B981', '#34D399'];
            case 'medium': return ['#F59E0B', '#FBBF24'];
            case 'low': return ['#EF4444', '#F87171'];
            default: return ['#6B7280', '#9CA3AF'];
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
                <View className="bg-bg-200 dark:bg-dark-bg-200" style={styles.compactCard}>
                    <View style={styles.flowIndicator}>
                        <View style={[
                            styles.flowIconContainer,
                            { backgroundColor: getFlowIntensityColor(flowMetrics.flowIntensity) + '20' }
                        ]}>
                            <Text style={styles.flowEmoji}>
                                {getFlowIntensityEmoji(flowMetrics.flowIntensity)}
                            </Text>
                        </View>
                        <View style={styles.flowTextContainer}>
                            <Text 
                                style={[
                                    styles.flowIntensityText, 
                                    { color: getFlowIntensityColor(flowMetrics.flowIntensity) }
                                ]}
                            >
                                {flowMetrics.flowIntensity.toUpperCase()} FLOW
                            </Text>
                            <Text className="text-text-secondary dark:text-dark-text-secondary" style={styles.flowSubtext}>
                                Current state
                            </Text>
                        </View>
                    </View>
                    <View style={styles.streakContainer}>
                        <Text style={styles.streakNumber}>{flowMetrics.currentStreak}</Text>
                        <Text className="text-text-secondary dark:text-dark-text-secondary" style={styles.streakLabel}>
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
            <Text className="text-text-primary dark:text-dark-text-primary" style={styles.title}>
                Flow State Metrics
            </Text>
            
            <View style={styles.metricsGrid}>
                <View className="bg-bg-200 dark:bg-dark-bg-200" style={styles.metricCard}>
                    <Text className="text-text-primary dark:text-dark-text-primary" style={styles.metricValue}>
                        {flowMetrics.currentStreak}
                    </Text>
                    <Text className="text-text-secondary dark:text-dark-text-secondary" style={styles.metricLabel}>
                        Current Streak
                    </Text>
                </View>
                
                <View className="bg-bg-200 dark:bg-dark-bg-200" style={styles.metricCard}>
                    <Text className="text-text-primary dark:text-dark-text-primary" style={styles.metricValue}>
                        {flowMetrics.longestStreak}
                    </Text>
                    <Text className="text-text-secondary dark:text-dark-text-secondary" style={styles.metricLabel}>
                        Best Streak
                    </Text>
                </View>
                
                <View className="bg-bg-200 dark:bg-dark-bg-200" style={[
                    styles.metricCard,
                    { backgroundColor: getFlowIntensityColor(flowMetrics.flowIntensity) + '10' }
                ]}>
                    <Text style={[
                        styles.metricValue, 
                        { color: getFlowIntensityColor(flowMetrics.flowIntensity) }
                    ]}>
                        {getFlowIntensityEmoji(flowMetrics.flowIntensity)}
                    </Text>
                    <Text className="text-text-secondary dark:text-dark-text-secondary" style={styles.metricLabel}>
                        Flow Intensity
                    </Text>
                </View>
                
                <View className="bg-bg-200 dark:bg-dark-bg-200" style={styles.metricCard}>
                    <Text className="text-text-primary dark:text-dark-text-primary" style={styles.metricValue}>
                        {Math.round(flowMetrics.averageSessionLength)}m
                    </Text>
                    <Text className="text-text-secondary dark:text-dark-text-secondary" style={styles.metricLabel}>
                        Avg Session
                    </Text>
                </View>
            </View>

            <View className="bg-bg-200 dark:bg-dark-bg-200" style={styles.detailedStats}>
                <View style={styles.statRow}>
                    <Text className="text-text-secondary dark:text-dark-text-secondary" style={styles.statLabel}>
                        Total Focus Time:
                    </Text>
                    <Text className="text-text-primary dark:text-dark-text-primary" style={styles.statValue}>
                        {Math.floor(flowMetrics.totalFocusTime / 60)}h {flowMetrics.totalFocusTime % 60}m
                    </Text>
                </View>
                
                <View style={styles.statRow}>
                    <Text className="text-text-secondary dark:text-dark-text-secondary" style={styles.statLabel}>
                        Best Flow Duration:
                    </Text>
                    <Text className="text-text-primary dark:text-dark-text-primary" style={styles.statValue}>
                        {Math.round(flowMetrics.bestFlowDuration)}m
                    </Text>
                </View>
                
                <View style={styles.statRow}>
                    <Text className="text-text-secondary dark:text-dark-text-secondary" style={styles.statLabel}>
                        Consecutive Sessions:
                    </Text>
                    <Text className="text-text-primary dark:text-dark-text-primary" style={styles.statValue}>
                        {flowMetrics.consecutiveSessions}
                    </Text>
                </View>
                
                <View style={styles.statRow}>
                    <Text className="text-text-secondary dark:text-dark-text-secondary" style={styles.statLabel}>
                        Distractions Today:
                    </Text>
                    <Text style={[
                        styles.statValue, 
                        { color: flowMetrics.distractionCount > 5 ? '#EF4444' : '#10B981' }
                    ]}>
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
        color: '#FF6B6B',
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
        borderBottomColor: '#E2E8F0',
    },
    statLabel: {
        fontSize: 14,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
    },
});