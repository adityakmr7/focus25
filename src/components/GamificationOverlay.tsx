import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

interface FlowMetrics {
  consecutiveSessions: number;
  currentStreak: number;
  flowIntensity: 'low' | 'medium' | 'high';
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
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animationValue.value,
    transform: [
      {
        translateY: (1 - animationValue.value) * -50,
      },
      {
        scale: 0.8 + (animationValue.value * 0.2),
      },
    ],
  }));

  if (!isVisible || achievements.length === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.overlay, animatedStyle]}>
      <View style={styles.achievementContainer}>
        <Text style={styles.achievementTitle}>Achievement Unlocked!</Text>
        {achievements.map((achievement, index) => (
          <Text key={index} style={styles.achievementText}>
            {achievement}
          </Text>
        ))}
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
  achievementContainer: {
    backgroundColor: 'rgba(72, 187, 120, 0.9)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  achievementText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginVertical: 2,
  },
});