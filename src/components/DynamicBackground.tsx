import React from 'react';
import {Dimensions, StyleSheet} from 'react-native';
import Animated, {interpolateColor, useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import {useTheme} from '../providers/ThemeProvider';

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
    let fromColor = theme.background || '#FFFFFF';
    let toColor = theme.surface || '#F5F5F5';

    if (isBreak) {
      fromColor = theme.background || '#FFFFFF';
      toColor = (theme.warning || '#FFA500') + '30';
    } else if (flowIntensity === 'high') {
      fromColor = theme.background || '#FFFFFF';
      toColor = (theme.success || '#48BB78') + '30';
    } else if (flowIntensity === 'medium') {
      fromColor = theme.background || '#FFFFFF';
      toColor = (theme.accent || '#4299E1') + '30';
    } else if (flowIntensity === 'low') {
      fromColor = theme.background || '#FFFFFF';
      toColor = (theme.error || '#F56565') + '30';
    }

    // Ensure we have valid colors before interpolation
    const inputRange = [0, 1];
    const outputRange = [fromColor, toColor];

    // Validate that both arrays have at least 2 values
    if (inputRange.length < 2 || outputRange.length < 2) {
      return {
        backgroundColor: fromColor,
        opacity: 0.8 + (progress * 0.2),
      };
    }

    const backgroundColor = interpolateColor(
      animatedValue.value,
      inputRange,
      outputRange
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
    height: Dimensions.get('window').height,

  },
});
