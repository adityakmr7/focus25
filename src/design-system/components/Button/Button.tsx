/**
 * Design System Button Component
 * A versatile button component with multiple variants and sizes
 */
// @ts-nocheck

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../themes';
import { createStyleSheet, combineViewStyles, combineTextStyles } from '../../utils';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  children,
  style,
  textStyle,
  fullWidth = false,
  ...props
}) => {
  const { theme } = useTheme();
  const styles = createStyleSheet(buttonStyles, theme);
  
  const isDisabled = disabled || loading;
  
  const getButtonStyle = (): ViewStyle => {
    const baseStyle = styles.button as ViewStyle;
    const variantStyle = styles[`${variant}Button`] as ViewStyle;
    const sizeStyle = styles[`${size}Button`] as ViewStyle;
    const stateStyle = isDisabled ? styles.disabledButton as ViewStyle : {};
    const widthStyle = fullWidth ? styles.fullWidthButton as ViewStyle : {};
    
    return combineViewStyles(
      baseStyle,
      variantStyle,
      sizeStyle,
      stateStyle,
      widthStyle,
      style
    );
  };
  
  const getTextStyle = (): TextStyle => {
    const baseTextStyle = styles.text as TextStyle;
    const variantTextStyle = styles[`${variant}Text`] as TextStyle;
    const sizeTextStyle = styles[`${size}Text`] as TextStyle;
    const stateTextStyle = isDisabled ? styles.disabledText as TextStyle : {};
    
    return combineTextStyles(
      baseTextStyle,
      variantTextStyle,
      sizeTextStyle,
      stateTextStyle,
      textStyle
    );
  };
  
  const getIconSize = (): number => {
    switch (size) {
      case 'sm': return 16;
      case 'md': return 20;
      case 'lg': return 24;
      case 'xl': return 28;
      default: return 20;
    }
  };
  
  const getIconColor = (): string => {
    if (isDisabled) return theme.colors['text-tertiary'];
    if (variant === 'primary') return theme.colors['text-inverse'];
    return theme.colors['accent-focus'];
  };
  
  return (
    <TouchableOpacity
      style={getButtonStyle()}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getIconColor()}
        />
      ) : (
        <>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={getIconSize()}
              color={getIconColor()}
              style={styles.leftIcon as any}
            />
          )}
          <Text style={getTextStyle()}>{children}</Text>
          {rightIcon && (
            <Ionicons
              name={rightIcon}
              size={getIconSize()}
              color={getIconColor()}
              style={styles.rightIcon as any}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const buttonStyles = (theme: any) => ({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  
  // Variants
  primaryButton: {
    backgroundColor: theme.colors['accent-focus'],
  },
  secondaryButton: {
    backgroundColor: theme.colors['bg-secondary'],
    borderWidth: 1,
    borderColor: theme.colors['border-primary'],
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors['accent-focus'],
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  dangerButton: {
    backgroundColor: theme.colors['accent-error'],
  },
  
  // Sizes
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
  xlButton: {
    paddingHorizontal: theme.spacing[8],
    paddingVertical: theme.spacing[5],
    minHeight: 60,
  },
  
  // States
  disabledButton: {
    opacity: 0.5,
  },
  fullWidthButton: {
    width: '100%' as const,
  },
  
  // Text styles
  text: {
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: 'center' as const,
  },
  
  primaryText: {
    color: theme.colors['text-inverse'],
  },
  secondaryText: {
    color: theme.colors['text-primary'],
  },
  outlineText: {
    color: theme.colors['accent-focus'],
  },
  ghostText: {
    color: theme.colors['accent-focus'],
  },
  dangerText: {
    color: theme.colors['text-inverse'],
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
  xlText: {
    fontSize: theme.typography.fontSize.xl,
  },
  
  disabledText: {
    opacity: 0.5,
  },
  
  // Icon styles
  leftIcon: {
    marginRight: theme.spacing[2],
  } as ViewStyle,
  rightIcon: {
    marginLeft: theme.spacing[2],
  } as ViewStyle,
});
