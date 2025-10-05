/**
 * Design System Style Utilities
 * Utility functions for creating consistent styles
 */
// @ts-nocheck

import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../themes/theme';

export const createStyleSheet = <T extends Record<string, any>>(
  styles: T | ((theme: Theme) => T),
  theme: Theme
): T => {
  return StyleSheet.create(
    typeof styles === 'function' ? styles(theme) : styles
  );
};

export const getResponsiveValue = <T>(phone: T, tablet?: T, desktop?: T): T => {
  // For now, return phone value
  // In the future, this could be enhanced with device detection
  return phone;
};

export const createResponsiveStyle = (
  phone: ViewStyle | TextStyle,
  tablet?: ViewStyle | TextStyle,
  desktop?: ViewStyle | TextStyle
): ViewStyle | TextStyle => {
  // For now, return phone style
  // In the future, this could be enhanced with device detection
  return phone;
};

export const combineViewStyles = (
  ...styles: (ViewStyle | undefined)[]
): ViewStyle => {
  return styles.reduce((acc, style) => {
    if (!style) return acc;
    return { ...acc, ...style };
  }, {} as ViewStyle);
};

export const combineTextStyles = (
  ...styles: (TextStyle | undefined)[]
): TextStyle => {
  return styles.reduce((acc, style) => {
    if (!style) return acc;
    return { ...acc, ...style };
  }, {} as TextStyle);
};

export const combineStyles = (
  ...styles: (ViewStyle | TextStyle | undefined)[]
): ViewStyle | TextStyle => {
  return styles.reduce(
    (acc, style) => {
      if (!style) return acc;
      return { ...acc, ...style };
    },
    {} as ViewStyle | TextStyle
  );
};
