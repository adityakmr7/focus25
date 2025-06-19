import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useThemeStore } from '../store/themeStore';

const { width } = Dimensions.get('window');

interface TimerDisplayProps {
  minutes: number;
  seconds: number;
  progress: number;
  isRunning: boolean;
  pulseAnimation?: Animated.SharedValue<number>;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  minutes,
  seconds,
  progress,
  isRunning,
  pulseAnimation
}) => {
  const { timerStyle, getCurrentTheme } = useThemeStore();
  const theme = getCurrentTheme();

  const formatTime = (minutes: number, seconds: number): string => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: pulseAnimation ? [{ scale: pulseAnimation.value }] : [],
  }));

  const renderDigitalTimer = () => (
    <Animated.View style={[styles.digitalContainer, animatedStyle]}>
      <View style={[styles.digitalBackground, { backgroundColor: theme.surface }]}>
        <Text style={[styles.digitalTime, { color: theme.text }]}>
          {formatTime(minutes, seconds)}
        </Text>
        <View style={[styles.progressBar, { backgroundColor: theme.surface }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: theme.accent,
                width: `${progress * 100}%` 
              }
            ]} 
          />
        </View>
      </View>
    </Animated.View>
  );

  const renderAnalogTimer = () => {
    const size = 280;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress * circumference);

    return (
      <Animated.View style={[styles.analogContainer, animatedStyle]}>
        <Svg width={size} height={size} style={styles.analogSvg}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.surface}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.accent}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.analogTimeContainer}>
          <Text style={[styles.analogTime, { color: theme.text }]}>
            {formatTime(minutes, seconds)}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderMinimalTimer = () => (
    <Animated.View style={[styles.minimalContainer, animatedStyle]}>
      <Text style={[styles.minimalTime, { color: theme.text }]}>
        {formatTime(minutes, seconds)}
      </Text>
      <View style={styles.minimalDots}>
        {[...Array(4)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.minimalDot,
              {
                backgroundColor: index < progress * 4 ? theme.accent : theme.surface,
              }
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );

  switch (timerStyle) {
    case 'analog':
      return renderAnalogTimer();
    case 'minimal':
      return renderMinimalTimer();
    default:
      return renderDigitalTimer();
  }
};

const styles = StyleSheet.create({
  // Digital Timer Styles
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  digitalTime: {
    fontSize: 64,
    fontWeight: '200',
    letterSpacing: -2,
    fontFamily: 'monospace',
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

  // Analog Timer Styles
  analogContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  analogSvg: {
    transform: [{ rotate: '0deg' }],
  },
  analogTimeContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analogTime: {
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: -1,
  },

  // Minimal Timer Styles
  minimalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 60,
  },
  minimalTime: {
    fontSize: 72,
    fontWeight: '100',
    letterSpacing: -3,
    marginBottom: 30,
  },
  minimalDots: {
    flexDirection: 'row',
    gap: 12,
  },
  minimalDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});