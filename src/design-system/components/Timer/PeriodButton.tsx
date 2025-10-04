/**
 * Design System Period Button Component
 * A specialized button for selecting timer periods (Focus, Short Break, Long Break)
 */
// @ts-nocheck

import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../themes';
import { createStyleSheet, combineViewStyles, combineTextStyles } from '../../utils';

export interface PeriodButtonProps {
  period: string;
  isSelected: boolean;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'default' | 'minimal' | 'pill';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PeriodButton: React.FC<PeriodButtonProps> = ({
  period,
  isSelected,
  onPress,
  disabled = false,
  variant = 'default',
  size = 'md',
  style,
  textStyle,
}) => {
  const { theme } = useTheme();
  const styles = createStyleSheet(periodButtonStyles, theme);
  
  const getButtonStyle = (): ViewStyle => {
    const baseStyle = styles.button;
    const sizeStyle = styles[`${size}Button`];
    const variantStyle = styles[`${variant}Button`];
    const stateStyle = isSelected ? styles.selectedButton : {};
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
  
  const getTextStyle = (): TextStyle => {
    const baseStyle = styles.text;
    const sizeStyle = styles[`${size}Text`];
    const variantStyle = styles[`${variant}Text`];
    const stateStyle = isSelected ? styles.selectedText : {};
    const disabledStyle = disabled ? styles.disabledText : {};
    
    return combineTextStyles(
      baseStyle,
      sizeStyle,
      variantStyle,
      stateStyle,
      disabledStyle,
      textStyle
    );
  };
  
  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={getTextStyle()}>{period}</Text>
    </TouchableOpacity>
  );
};

const periodButtonStyles = (theme: any) => ({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
  },
  
  // Size variants
  smButton: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    minHeight: 32,
  },
  mdButton: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    minHeight: 44,
  },
  lgButton: {
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
    minHeight: 52,
  },
  
  // Variant styles
  defaultButton: {
    backgroundColor: theme.colors['bg-secondary'],
    borderWidth: 1,
    borderColor: theme.colors['border-primary'],
  },
  minimalButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  pillButton: {
    backgroundColor: theme.colors['bg-secondary'],
    borderRadius: theme.borderRadius.full,
    borderWidth: 0,
  },
  
  // State styles
  selectedButton: {
    backgroundColor: theme.colors['accent-focus'],
    borderColor: theme.colors['accent-focus'],
  },
  disabledButton: {
    opacity: 0.5,
  },
  
  // Text styles
  text: {
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: 'center',
  },
  
  smText: {
    fontSize: theme.typography.fontSize.sm,
  },
  mdText: {
    fontSize: theme.typography.fontSize.base,
  },
  lgText: {
    fontSize: theme.typography.fontSize.lg,
  },
  
  defaultText: {
    color: theme.colors['text-primary'],
  },
  minimalText: {
    color: theme.colors['text-primary'],
  },
  pillText: {
    color: theme.colors['text-primary'],
  },
  
  selectedText: {
    color: theme.colors['text-inverse'],
  },
  disabledText: {
    color: theme.colors['text-tertiary'],
  },
});
