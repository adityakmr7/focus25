import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePomodoroStore } from '../store/pomodoroStore';

interface FlowMetricsProps {
    showDetailed?: boolean;
}

export const FlowMetrics: React.FC<FlowMetricsProps> = ({ showDetailed = false }) => {
    const { flowMetrics } = usePomodoroStore();

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

    if (!showDetailed) {
        return (
            <View style={styles.compactContainer}>
                <View style={styles.flowIndicator}>
                    <Text style={styles.flowEmoji}>
                        {getFlowIntensityEmoji(flowMetrics.flowIntensity)}
                    </Text>
                    <Text 
                        style={[
                            styles.flowIntensityText, 
                            { color: getFlowIntensityColor(flowMetrics.flowIntensity) }
                        ]}
                    >
                        {flowMetrics.flowIntensity.toUpperCase()} FLOW
                    </Text>
                </View>
                <Text style={styles.streakText}>
                    🏆 {flowMetrics.currentStreak} day streak
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.detailedContainer}>
            <Text style={styles.title}>Flow State Metrics</Text>
            
            <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>{flowMetrics.currentStreak}</Text>
                    <Text style={styles.metricLabel}>Current Streak</Text>
                </View>
                
                <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>{flowMetrics.longestStreak}</Text>
                    <Text style={styles.metricLabel}>Best Streak</Text>
                </View>
                
                <View style={styles.metricCard}>
                    <Text style={[
                        styles.metricValue, 
                        { color: getFlowIntensityColor(flowMetrics.flowIntensity) }
                    ]}>
                        {getFlowIntensityEmoji(flowMetrics.flowIntensity)}
                    </Text>
                    <Text style={styles.metricLabel}>Flow Intensity</Text>
                </View>
                
                <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>{Math.round(flowMetrics.averageSessionLength)}m</Text>
                    <Text style={styles.metricLabel}>Avg Session</Text>
                </View>
            </View>

            <View style={styles.detailedStats}>
                <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Total Focus Time:</Text>
                    <Text style={styles.statValue}>{Math.round(flowMetrics.totalFocusTime / 60)}h {flowMetrics.totalFocusTime % 60}m</Text>
                </View>
                
                <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Best Flow Duration:</Text>
                    <Text style={styles.statValue}>{Math.round(flowMetrics.bestFlowDuration)}m</Text>
                </View>
                
                <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Consecutive Sessions:</Text>
                    <Text style={styles.statValue}>{flowMetrics.consecutiveSessions}</Text>
                </View>
                
                <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Distractions Today:</Text>
                    <Text style={[
                        styles.statValue, 
                        { color: flowMetrics.distractionCount > 5 ? '#EF4444' : '#10B981' }
                    ]}>
                        {flowMetrics.distractionCount}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    flowIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    flowEmoji: {
        fontSize: 16,
        marginRight: 8,
    },
    flowIntensityText: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    streakText: {
        fontSize: 12,
        color: '#6B7280',
    },
    detailedContainer: {
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    metricCard: {
        width: '48%',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    metricValue: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
    },
    detailedStats: {
        marginTop: 10,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    statLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
    },
});