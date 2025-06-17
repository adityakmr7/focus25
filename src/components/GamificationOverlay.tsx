import React from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface FlowMetrics {
    consecutiveSessions: number;
    currentStreak: number;
    longestStreak: number;
    flowIntensity: 'low' | 'medium' | 'high';
    distractionCount: number;
    sessionStartTime: number | null;
    totalFocusTime: number;
    averageSessionLength: number;
    bestFlowDuration: number;
    lastSessionDate: string | null;
}

interface GamificationOverlayProps {
    flowMetrics: FlowMetrics;
    isVisible: boolean;
    achievements: string[];
    animationValue: Animated.Value;
}

export const GamificationOverlay: React.FC<GamificationOverlayProps> = ({
    flowMetrics,
    isVisible,
    achievements,
    animationValue,
}) => {
    if (!isVisible || achievements.length === 0) return null;

    const translateY = animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-100, 0],
    });

    const opacity = animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    const scale = animationValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.8, 1.1, 1],
    });

    const getProgressToNextLevel = () => {
        const totalSessions = flowMetrics.consecutiveSessions;
        const currentLevel = Math.floor(totalSessions / 5) + 1;
        const progressInLevel = totalSessions % 5;
        return { currentLevel, progressInLevel, maxProgress: 5 };
    };

    const { currentLevel, progressInLevel, maxProgress } = getProgressToNextLevel();

    return (
        <Animated.View
            style={[
                styles.overlay,
                {
                    opacity,
                    transform: [{ translateY }, { scale }],
                },
            ]}
        >
            <View style={styles.achievementCard}>
                <Text style={styles.achievementTitle}>🎉 Achievement Unlocked!</Text>
                <Text style={styles.achievementText}>
                    {achievements[achievements.length - 1]}
                </Text>
                
                <View style={styles.levelContainer}>
                    <Text style={styles.levelText}>Level {currentLevel}</Text>
                    <View style={styles.progressBar}>
                        <View 
                            style={[
                                styles.progressFill,
                                { width: `${(progressInLevel / maxProgress) * 100}%` }
                            ]} 
                        />
                    </View>
                    <Text style={styles.progressText}>
                        {progressInLevel}/{maxProgress}
                    </Text>
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{flowMetrics.currentStreak}</Text>
                        <Text style={styles.statLabel}>Day Streak</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{flowMetrics.consecutiveSessions}</Text>
                        <Text style={styles.statLabel}>Sessions</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{Math.floor(flowMetrics.totalFocusTime / 60)}h</Text>
                        <Text style={styles.statLabel}>Focus Time</Text>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 100,
        left: 20,
        right: 20,
        zIndex: 1000,
    },
    achievementCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    achievementTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    achievementText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#10B981',
        marginBottom: 20,
        textAlign: 'center',
    },
    levelContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    levelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
    },
    progressBar: {
        width: '80%',
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
});