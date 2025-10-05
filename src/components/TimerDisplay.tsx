import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useThemeStore } from '../store/themeStore';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';

interface TimerDisplayProps {
  minutes: number;
  seconds: number;
  progress: number;
  isRunning: boolean;
  pulseAnimation?: Animated.SharedValue<number>;
  onToggleTimer?: () => void;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  minutes,
  seconds,
  progress,
  isRunning,
  pulseAnimation,
  onToggleTimer,
}) => {
  const { getCurrentTheme } = useThemeStore();
  const theme = getCurrentTheme();
  const { isLandscape, isTablet } = useDeviceOrientation();

  const formatTime = (minutes: number, seconds: number): string => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: pulseAnimation ? [{ scale: pulseAnimation.value }] : [],
  }));

  const getTimerStyle = () => {
    if (isTablet) {
      return isLandscape
        ? styles.tabletLandscapeTime
        : styles.tabletPortraitTime;
    }
    return isLandscape ? styles.phoneLandscapeTime : styles.digitalTime;
  };

  const getContainerStyle = () => {
    if (isTablet) {
      return isLandscape
        ? styles.tabletLandscapeContainer
        : styles.tabletPortraitContainer;
    }
    return isLandscape
      ? styles.phoneLandscapeContainer
      : styles.digitalContainer;
  };

  const getProgressBarStyle = () => {
    if (isTablet) {
      return isLandscape
        ? styles.tabletLandscapeProgressBar
        : styles.tabletProgressBar;
    }
    return isLandscape ? styles.phoneLandscapeProgressBar : styles.progressBar;
  };

  return (
    <Animated.View style={[getContainerStyle(), animatedStyle]}>
      <View style={[styles.digitalBackground]}>
        <Text style={[getTimerStyle(), { color: theme.text }]}>
          {formatTime(minutes, seconds)}
        </Text>
        <View
          style={[getProgressBarStyle(), { backgroundColor: theme.surface }]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.accent,
                width: `${progress * 100}%`,
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Base styles
  digitalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  digitalBackground: {
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  digitalTime: {
    fontSize: 100,
    fontWeight: '200',
    letterSpacing: -2,
    fontFamily: 'SF-Pro-Display-Bold',
  },
  progressBar: {
    width: 200,
    height: 4,
    borderRadius: 2,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Phone landscape styles
  phoneLandscapeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  phoneLandscapeTime: {
    fontSize: 70,
    fontWeight: '200',
    letterSpacing: -1,
    fontFamily: 'SF-Pro-Display-Bold',
  },
  phoneLandscapeProgressBar: {
    width: 160,
    height: 3,
    borderRadius: 2,
    marginTop: 15,
    overflow: 'hidden',
  },

  // Tablet portrait styles
  tabletPortraitContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 50,
  },
  tabletPortraitTime: {
    fontSize: 130,
    fontWeight: '200',
    letterSpacing: -3,
    fontFamily: 'SF-Pro-Display-Bold',
  },
  tabletProgressBar: {
    width: 300,
    height: 6,
    borderRadius: 3,
    marginTop: 25,
    overflow: 'hidden',
  },

  // Tablet landscape styles
  tabletLandscapeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
  },
  tabletLandscapeTime: {
    fontSize: 110,
    fontWeight: '200',
    letterSpacing: -2,
    fontFamily: 'SF-Pro-Display-Bold',
  },
  tabletLandscapeProgressBar: {
    width: 250,
    height: 5,
    borderRadius: 3,
    marginTop: 20,
    overflow: 'hidden',
  },
});
