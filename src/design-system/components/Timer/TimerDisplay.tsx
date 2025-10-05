/**
 * Design System Timer Display Component
 * A specialized timer display component for the Focus25 application
 */
// @ts-nocheck

import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../themes';
import {
  createStyleSheet,
  combineViewStyles,
  combineTextStyles,
} from '../../utils';

export interface TimerDisplayProps {
  minutes: number;
  seconds: number;
  progress?: number;
  isRunning?: boolean;
  isBreak?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'minimal' | 'detailed';
  showProgress?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  minutes,
  seconds,
  progress = 0,
  isRunning = false,
  isBreak = false,
  size = 'lg',
  variant = 'default',
  showProgress = true,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();
  const styles = createStyleSheet(timerDisplayStyles, theme);

  const formatTime = (mins: number, secs: number): string => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerStyle = (): ViewStyle => {
    const baseStyle = styles.timer;
    const sizeStyle = styles[`${size}Timer`];
    const variantStyle = styles[`${variant}Timer`];
    const stateStyle = isRunning ? styles.runningTimer : {};
    const breakStyle = isBreak ? styles.breakTimer : {};

    return combineViewStyles(
      baseStyle,
      sizeStyle,
      variantStyle,
      stateStyle,
      breakStyle,
      style
    );
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle = styles.text;
    const sizeStyle = styles[`${size}Text`];
    const variantStyle = styles[`${variant}Text`];
    const stateStyle = isRunning ? styles.runningText : {};
    const breakStyle = isBreak ? styles.breakText : {};

    return combineTextStyles(
      baseStyle,
      sizeStyle,
      variantStyle,
      stateStyle,
      breakStyle,
      textStyle
    );
  };

  const getProgressStyle = (): ViewStyle => {
    const baseStyle = styles.progress;
    const sizeStyle = styles[`${size}Progress`];
    const progressWidth = Math.max(0, Math.min(100, progress * 100));

    return combineViewStyles(baseStyle, sizeStyle, {
      width: `${progressWidth}%` as const,
    });
  };

  return (
    <View style={getTimerStyle()}>
      <Text style={getTextStyle()}>{formatTime(minutes, seconds)}</Text>

      {showProgress && variant !== 'minimal' && (
        <View style={styles.progressContainer}>
          <View style={getProgressStyle()} />
        </View>
      )}

      {variant === 'detailed' && (
        <View style={styles.details}>
          <Text style={styles.detailsText}>
            {isBreak ? 'Break Time' : 'Focus Time'}
          </Text>
          {isRunning && (
            <Text style={styles.detailsSubtext}>
              {isBreak ? 'Take a break' : 'Stay focused'}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const timerDisplayStyles = (theme: any) => ({
  timer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Size variants
  smTimer: {
    padding: theme.spacing[2],
  },
  mdTimer: {
    padding: theme.spacing[4],
  },
  lgTimer: {
    padding: theme.spacing[6],
  },
  xlTimer: {
    padding: theme.spacing[8],
  },

  // Variant styles
  defaultTimer: {
    backgroundColor: theme.colors['bg-elevated'],
    borderRadius: theme.borderRadius['2xl'],
    ...theme.shadows.md,
  },
  minimalTimer: {
    backgroundColor: 'transparent',
  },
  detailedTimer: {
    backgroundColor: theme.colors['bg-elevated'],
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing[8],
    ...theme.shadows.lg,
  },

  // State styles
  runningTimer: {
    transform: [{ scale: 1.02 }],
  },
  breakTimer: {
    backgroundColor: theme.colors['bg-break-short'],
  },

  // Text styles
  text: {
    fontFamily: theme.typography.fontFamily.bold,
    textAlign: 'center',
    color: theme.colors['text-primary'],
  },

  smText: {
    fontSize: theme.typography.fontSize['2xl'],
  },
  mdText: {
    fontSize: theme.typography.fontSize['4xl'],
  },
  lgText: {
    fontSize: theme.typography.fontSize['6xl'],
  },
  xlText: {
    fontSize: theme.typography.fontSize['8xl'],
  },

  defaultText: {
    color: theme.colors['text-primary'],
  },
  minimalText: {
    color: theme.colors['text-primary'],
  },
  detailedText: {
    color: theme.colors['text-primary'],
    marginBottom: theme.spacing[4],
  },

  runningText: {
    color: theme.colors['accent-focus'],
  },
  breakText: {
    color: theme.colors['accent-break-short'],
  },

  // Progress styles
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: theme.colors['bg-secondary'],
    borderRadius: theme.borderRadius.full,
    marginTop: theme.spacing[4],
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: theme.colors['accent-focus'],
    borderRadius: theme.borderRadius.full,
  },

  smProgress: {
    height: 2,
  },
  mdProgress: {
    height: 3,
  },
  lgProgress: {
    height: 4,
  },
  xlProgress: {
    height: 6,
  },

  // Details styles
  details: {
    alignItems: 'center',
    marginTop: theme.spacing[4],
  },
  detailsText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors['text-secondary'],
    marginBottom: theme.spacing[1],
  },
  detailsSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors['text-tertiary'],
    fontStyle: 'italic',
  },
});
