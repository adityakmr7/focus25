/**
 * Design System Input Component
 * A versatile input component with multiple variants and states
 */
// @ts-nocheck

import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../themes';
import { createStyleSheet, combineViewStyles, combineTextStyles } from '../../utils';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  variant?: 'default' | 'outlined' | 'filled' | 'underlined';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  disabled?: boolean;
  required?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  helperTextStyle?: TextStyle;
  errorTextStyle?: TextStyle;
}

export const Input = forwardRef<TextInput, InputProps>(({
  variant = 'default',
  size = 'md',
  label,
  placeholder,
  helperText,
  errorText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  disabled = false,
  required = false,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  labelStyle,
  helperTextStyle,
  errorTextStyle,
  ...props
}, ref) => {
  const { theme } = useTheme();
  const styles = createStyleSheet(inputStyles, theme);
  const [isFocused, setIsFocused] = useState(false);
  
  const hasError = !!errorText;
  const isDisabled = disabled;
  
  const getContainerStyle = (): ViewStyle => {
    const baseStyle = styles.container;
    const variantStyle = styles[`${variant}Container`];
    const sizeStyle = styles[`${size}Container`];
    const stateStyle = isFocused ? styles.focusedContainer : {};
    const errorStyle = hasError ? styles.errorContainer : {};
    const disabledStyle = isDisabled ? styles.disabledContainer : {};
    
    return combineViewStyles(
      baseStyle,
      variantStyle,
      sizeStyle,
      stateStyle,
      errorStyle,
      disabledStyle,
      style
    );
  };
  
  const getInputStyle = (): TextStyle => {
    const baseStyle = styles.input;
    const sizeStyle = styles[`${size}Input`];
    const multilineStyle = multiline ? styles.multilineInput : {};
    const disabledStyle = isDisabled ? styles.disabledInput : {};
    
    return combineTextStyles(
      baseStyle,
      sizeStyle,
      multilineStyle,
      disabledStyle,
      inputStyle
    );
  };
  
  const getIconColor = (): string => {
    if (isDisabled) return theme.colors['text-tertiary'];
    if (hasError) return theme.colors['accent-error'];
    if (isFocused) return theme.colors['accent-focus'];
    return theme.colors['text-secondary'];
  };
  
  const getBorderColor = (): string => {
    if (hasError) return theme.colors['accent-error'];
    if (isFocused) return theme.colors['accent-focus'];
    return theme.colors['border-primary'];
  };
  
  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={combineTextStyles(styles.label, labelStyle)}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={getContainerStyle()}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={getIconColor()}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          ref={ref}
          style={getInputStyle()}
          placeholder={placeholder}
          placeholderTextColor={theme.colors['text-tertiary']}
          editable={!isDisabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
            disabled={!onRightIconPress}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={getIconColor()}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {(helperText || errorText) && (
        <Text style={combineTextStyles(
          styles.helperText,
          hasError ? styles.errorText : {},
          hasError ? errorTextStyle : helperTextStyle
        )}>
          {errorText || helperText}
        </Text>
      )}
    </View>
  );
});

Input.displayName = 'Input';

const inputStyles = (theme: any) => ({
  wrapper: {
    marginBottom: theme.spacing[4],
  },
  
  // Container styles
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors['border-primary'],
  },
  
  // Variants
  defaultContainer: {
    backgroundColor: theme.colors['bg-primary'],
  },
  outlinedContainer: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  filledContainer: {
    backgroundColor: theme.colors['bg-secondary'],
    borderWidth: 0,
  },
  underlinedContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderRadius: 0,
  },
  
  // Sizes
  smContainer: {
    minHeight: 36,
    paddingHorizontal: theme.spacing[3],
  },
  mdContainer: {
    minHeight: 44,
    paddingHorizontal: theme.spacing[4],
  },
  lgContainer: {
    minHeight: 52,
    paddingHorizontal: theme.spacing[5],
  },
  
  // States
  focusedContainer: {
    borderColor: theme.colors['accent-focus'],
    ...theme.shadows.sm,
  },
  errorContainer: {
    borderColor: theme.colors['accent-error'],
  },
  disabledContainer: {
    backgroundColor: theme.colors['bg-tertiary'],
    opacity: 0.6,
  },
  
  // Input styles
  input: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.primary,
    color: theme.colors['text-primary'],
  },
  
  smInput: {
    fontSize: theme.typography.fontSize.sm,
  },
  mdInput: {
    fontSize: theme.typography.fontSize.base,
  },
  lgInput: {
    fontSize: theme.typography.fontSize.lg,
  },
  
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  disabledInput: {
    color: theme.colors['text-tertiary'],
  },
  
  // Icon styles
  leftIcon: {
    marginRight: theme.spacing[2],
  },
  rightIcon: {
    marginLeft: theme.spacing[2],
    padding: theme.spacing[1],
  },
  
  // Label styles
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors['text-primary'],
    marginBottom: theme.spacing[2],
  },
  required: {
    color: theme.colors['accent-error'],
  },
  
  // Helper text styles
  helperText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors['text-secondary'],
    marginTop: theme.spacing[1],
  },
  errorText: {
    color: theme.colors['accent-error'],
  },
});
