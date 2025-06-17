import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolateColor } from 'react-native-reanimated';

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
  const animatedValue = useSharedValue(0);

  React.useEffect(() => {
    animatedValue.value = withTiming(isRunning ? 1 : 0, { duration: 1000 });
  }, [isRunning]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      animatedValue.value,
      [0, 1],
      isBreak 
        ? ['#1a202c', '#2d3748'] 
        : flowIntensity === 'high'
        ? ['#1a202c', '#2a4365']
        : ['#1a202c', '#2d3748']
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