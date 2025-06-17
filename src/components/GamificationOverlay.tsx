import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withSequence,
  withDelay 
} from 'react-native-reanimated';
import { useTheme } from '../providers/ThemeProvider';

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
  animationValue: Animated.SharedValue<number>;
}

export const GamificationOverlay: React.FC<GamificationOverlayProps> = ({
  flowMetrics,
  isVisible,
  achievements,
  animationValue
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible && achievements.length > 0) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSequence(
        withTiming(1.1, { duration: 300 }),
        withTiming(1, { duration: 200 })
      );

      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 });
        scale.value = withTiming(0.8, { duration: 300 });
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(0.8, { duration: 300 });
    }
  }, [isVisible, achievements.length]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
    ],
  }));

  const getProgressToNextLevel = () => {
    const totalSessions = flowMetrics.consecutiveSessions;
    const currentLevel = Math.floor(totalSessions / 5) + 1;
    const progressInLevel = totalSessions % 5;
    return { currentLevel, progressInLevel, maxProgress: 5 };
  };

  const { currentLevel, progressInLevel, maxProgress } = getProgressToNextLevel();

  if (!isVisible || achievements.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      onRequestClose={() => {}}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.overlay, animatedStyle]}>
          <View style={[styles.achievementCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.achievementTitle, { color: theme.text }]}>
              🎉 Achievement Unlocked!
            </Text>
            
            {achievements.map((achievement, index) => (
              <Text key={index} style={[styles.achievementText, { color: theme.accent }]}>
                {achievement}
              </Text>
            ))}
            
            <View style={styles.levelContainer}>
              <Text style={[styles.levelText, { color: theme.textSecondary }]}>
                Level {currentLevel}
              </Text>
              <View style={[styles.progressBar, { backgroundColor: theme.background }]}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${(progressInLevel / maxProgress) * 100}%`,
                      backgroundColor: theme.accent
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                {progressInLevel}/{maxProgress}
              </Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {flowMetrics.currentStreak}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Day Streak
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {flowMetrics.consecutiveSessions}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Sessions
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {Math.floor(flowMetrics.totalFocusTime / 60)}h
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Focus Time
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  overlay: {
    width: '100%',
    maxWidth: 350,
  },
  achievementCard: {
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
    marginBottom: 8,
    textAlign: 'center',
  },
  achievementText: {
    fontSize: 24,
    fontWeight: '600',
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
    marginBottom: 8,
  },
  progressBar: {
    width: '80%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
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
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});