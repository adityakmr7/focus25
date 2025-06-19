import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolateColor } from 'react-native-reanimated';
import { useTheme } from '../providers/ThemeProvider';

interface DynamicBackgroundProps {
  isRunning: boolean;
  isBreak: boolean;
  flowIntensity: 'low' | 'medium' | 'high';
  progress: number;
}

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({
  isRunning,
  isBreak,
  flowIntensity,
  progress
}) => {
  const { theme } = useTheme();
  const animatedValue = useSharedValue(0);

  React.useEffect(() => {
    animatedValue.value = withTiming(isRunning ? 1 : 0, { duration: 1000 });
  }, [isRunning]);

  const animatedStyle = useAnimatedStyle(() => {
    let fromColor = theme.background;
    let toColor = theme.surface;
    if (isBreak) {
      fromColor = theme.background;
      toColor = theme.warning + '30';
    } else if (flowIntensity === 'high') {
      fromColor = theme.background;
      toColor = theme.success + '30';
    } else if (flowIntensity === 'medium') {
      fromColor = theme.background;
      toColor = theme.accent + '30';
    } else if (flowIntensity === 'low') {
      fromColor = theme.background;
      toColor = theme.error + '30';
    }
    const backgroundColor = interpolateColor(
      animatedValue.value,
      [0, 1],
      [fromColor, toColor]
    );

    return {
      backgroundColor,
      opacity: 0.8 + (progress * 0.2),
    };
  });

  return (
    <Animated.View style={[styles.background, animatedStyle]} />
  );
};

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
});