/**
 * Design System Play/Pause Button Component
 * A specialized play/pause button for the Focus25 timer
 */
// @ts-nocheck

import React from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../themes';
import { createStyleSheet, combineViewStyles } from '../../utils';

export interface PlayPauseButtonProps {
  isRunning: boolean;
  isPaused?: boolean;
  onPress: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'minimal' | 'floating';
  style?: ViewStyle;
}

export const PlayPauseButton: React.FC<PlayPauseButtonProps> = ({
  isRunning,
  isPaused = false,
  onPress,
  disabled = false,
  size = 'lg',
  variant = 'default',
  style,
}) => {
  const { theme } = useTheme();
  const styles = createStyleSheet(playPauseButtonStyles, theme);
  
  const getButtonStyle = (): ViewStyle => {
    const baseStyle = styles.button;
    const sizeStyle = styles[`${size}Button`];
    const variantStyle = styles[`${variant}Button`];
    const stateStyle = isRunning ? styles.runningButton : {};
    const disabledStyle = disabled ? styles.disabledButton : {};
    
    return combineViewStyles(
      baseStyle,
      sizeStyle,
      variantStyle,
      stateStyle,
      disabledStyle,
      style
    );
  };
  
  const getIconSize = (): number => {
    switch (size) {
      case 'sm': return 16;
      case 'md': return 24;
      case 'lg': return 32;
      case 'xl': return 40;
      default: return 32;
    }
  };
  
  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    if (isRunning && !isPaused) return 'pause';
    if (isRunning && isPaused) return 'play';
    return 'play';
  };
  
  const getIconColor = (): string => {
    if (disabled) return theme.colors['text-tertiary'];
    if (variant === 'floating') return theme.colors['text-inverse'];
    return theme.colors['accent-focus'];
  };
  
  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Ionicons
        name={getIconName()}
        size={getIconSize()}
        color={getIconColor()}
      />
    </TouchableOpacity>
  );
};

const playPauseButtonStyles = (theme: any) => ({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.full,
  },
  
  // Size variants
  smButton: {
    width: 40,
    height: 40,
  },
  mdButton: {
    width: 56,
    height: 56,
  },
  lgButton: {
    width: 72,
    height: 72,
  },
  xlButton: {
    width: 88,
    height: 88,
  },
  
  // Variant styles
  defaultButton: {
    backgroundColor: theme.colors['bg-elevated'],
    borderWidth: 2,
    borderColor: theme.colors['accent-focus'],
    ...theme.shadows.md,
  },
  minimalButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors['border-primary'],
  },
  floatingButton: {
    backgroundColor: theme.colors['accent-focus'],
    ...theme.shadows.lg,
  },
  
  // State styles
  runningButton: {
    backgroundColor: theme.colors['accent-focus'],
    borderColor: theme.colors['accent-focus'],
  },
  disabledButton: {
    opacity: 0.5,
  },
});
