import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withSequence,
  withDelay,
  interpolate 
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';

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
  animationValue: Animated.SharedValue<number>;
  onClose?: () => void;
}

export const GamificationOverlay: React.FC<GamificationOverlayProps> = ({
  flowMetrics,
  isVisible,
  achievements,
  animationValue,
  onClose
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const confettiAnimation = useSharedValue(0);

  useEffect(() => {
    if (isVisible && achievements.length > 0) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSequence(
        withTiming(1.1, { duration: 300 }),
        withTiming(1, { duration: 200 })
      );
      
      // Confetti animation
      confettiAnimation.value = withSequence(
        withTiming(1, { duration: 800 }),
        withDelay(2000, withTiming(0, { duration: 300 }))
      );

      // Auto hide after 5 seconds if no onClose provided
      if (!onClose) {
        const timer = setTimeout(() => {
          opacity.value = withTiming(0, { duration: 300 });
          scale.value = withTiming(0.8, { duration: 300 });
        }, 5000);

        return () => clearTimeout(timer);
      }
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(0.8, { duration: 300 });
    }
  }, [isVisible, achievements.length]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    opacity: interpolate(confettiAnimation.value, [0, 0.5, 1], [0, 1, 0]),
    transform: [
      { translateY: interpolate(confettiAnimation.value, [0, 1], [0, -50]) },
      { scale: interpolate(confettiAnimation.value, [0, 0.5, 1], [0.5, 1.2, 0.8]) }
    ],
  }));

  const getProgressToNextLevel = () => {
    const totalSessions = flowMetrics.consecutiveSessions;
    const currentLevel = Math.floor(totalSessions / 5) + 1;
    const progressInLevel = totalSessions % 5;
    return { currentLevel, progressInLevel, maxProgress: 5 };
  };

  const getAchievementIcon = (achievement: string) => {
    if (achievement.includes('Flow Master')) return 'flame';
    if (achievement.includes('Week Warrior')) return 'calendar';
    if (achievement.includes('Deep Focus')) return 'rocket';
    return 'trophy';
  };

  const getAchievementColor = (achievement: string) => {
    if (achievement.includes('Flow Master')) return '#FF6B6B';
    if (achievement.includes('Week Warrior')) return '#4ECDC4';
    if (achievement.includes('Deep Focus')) return '#9F7AEA';
    return '#FFD700';
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
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Confetti Effect */}
        <Animated.View style={[styles.confettiContainer, confettiStyle]}>
          {[...Array(12)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.confetti,
                {
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#9F7AEA'][index % 4],
                  left: (index * width / 12) + Math.random() * 50,
                  animationDelay: `${index * 100}ms`,
                }
              ]}
            />
          ))}
        </Animated.View>

        <Animated.View style={[styles.overlay, animatedStyle]}>
          <View style={[styles.achievementCard, { backgroundColor: theme.surface }]}>
            {/* Close Button */}
            {onClose && (
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            )}

            {/* Achievement Header */}
            <View style={styles.achievementHeader}>
              <View style={[styles.achievementIconContainer, { backgroundColor: '#FFD700' + '20' }]}>
                <Ionicons name="trophy" size={32} color="#FFD700" />
              </View>
              <Text style={[styles.achievementTitle, { color: theme.text }]}>
                🎉 Achievement Unlocked!
              </Text>
            </View>
            
            {/* Achievement List */}
            <View style={styles.achievementsList}>
              {achievements.map((achievement, index) => (
                <View key={index} style={[styles.achievementItem, { backgroundColor: theme.background }]}>
                  <View style={[
                    styles.achievementItemIcon, 
                    { backgroundColor: getAchievementColor(achievement) + '20' }
                  ]}>
                    <Ionicons 
                      name={getAchievementIcon(achievement) as any} 
                      size={20} 
                      color={getAchievementColor(achievement)} 
                    />
                  </View>
                  <Text style={[styles.achievementText, { color: getAchievementColor(achievement) }]}>
                    {achievement}
                  </Text>
                </View>
              ))}
            </View>
            
            {/* Level Progress */}
            <View style={styles.levelContainer}>
              <View style={styles.levelHeader}>
                <Text style={[styles.levelText, { color: theme.text }]}>
                  Level {currentLevel}
                </Text>
                <Text style={[styles.levelSubtext, { color: theme.textSecondary }]}>
                  Flow Master
                </Text>
              </View>
              
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
                {progressInLevel}/{maxProgress} sessions to next level
              </Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#FF6B6B' }]}>
                  {flowMetrics.currentStreak}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Day Streak
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#4ECDC4' }]}>
                  {flowMetrics.consecutiveSessions}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Sessions
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#9F7AEA' }]}>
                  {Math.floor(flowMetrics.totalFocusTime / 60)}h
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Focus Time
                </Text>
              </View>
            </View>

            {/* Motivational Message */}
            <View style={[styles.motivationContainer, { backgroundColor: theme.background }]}>
              <Text style={[styles.motivationText, { color: theme.text }]}>
                {flowMetrics.flowIntensity === 'high' 
                  ? "You're in the zone! Keep this momentum going!" 
                  : flowMetrics.currentStreak >= 7
                  ? "Incredible consistency! You're building a powerful habit!"
                  : "Great progress! Every session brings you closer to mastery!"
                }
              </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  overlay: {
    width: '100%',
    maxWidth: 380,
    zIndex: 2,
  },
  achievementCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 3,
  },
  achievementHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  achievementIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  achievementsList: {
    marginBottom: 24,
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  achievementItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  levelContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  levelHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  levelText: {
    fontSize: 18,
    fontWeight: '700',
  },
  levelSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
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
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  motivationContainer: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  motivationText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
});