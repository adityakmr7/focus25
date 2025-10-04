/**
 * Design System Container Component
 * A flexible container component for layout management
 */
// @ts-nocheck

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../themes';
import { createStyleSheet, combineViewStyles } from '../../utils';

export interface ContainerProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  center?: boolean;
  style?: ViewStyle;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  padding = 'md',
  margin = 'none',
  maxWidth = 'full',
  center = false,
  style,
}) => {
  const { theme } = useTheme();
  const styles = createStyleSheet(containerStyles, theme);
  
  const getContainerStyle = (): ViewStyle => {
    const baseStyle = styles.container;
    const paddingStyle = styles[`${padding}Padding`];
    const marginStyle = styles[`${margin}Margin`];
    const maxWidthStyle = styles[`${maxWidth}MaxWidth`];
    const centerStyle = center ? styles.center : {};
    
    return combineViewStyles(
      baseStyle,
      paddingStyle,
      marginStyle,
      maxWidthStyle,
      centerStyle,
      style
    );
  };
  
  return (
    <View style={getContainerStyle()}>
      {children}
    </View>
  );
};

const containerStyles = (theme: any) => ({
  container: {
    flex: 1,
  },
  
  // Padding variants
  nonePadding: {
    padding: 0,
  },
  smPadding: {
    padding: theme.spacing[3],
  },
  mdPadding: {
    padding: theme.spacing[4],
  },
  lgPadding: {
    padding: theme.spacing[6],
  },
  xlPadding: {
    padding: theme.spacing[8],
  },
  
  // Margin variants
  noneMargin: {
    margin: 0,
  },
  smMargin: {
    margin: theme.spacing[3],
  },
  mdMargin: {
    margin: theme.spacing[4],
  },
  lgMargin: {
    margin: theme.spacing[6],
  },
  xlMargin: {
    margin: theme.spacing[8],
  },
  
  // Max width variants
  smMaxWidth: {
    maxWidth: 320,
  },
  mdMaxWidth: {
    maxWidth: 480,
  },
  lgMaxWidth: {
    maxWidth: 640,
  },
  xlMaxWidth: {
    maxWidth: 800,
  },
  fullMaxWidth: {
    maxWidth: '100%' as const,
  },
  
  // Center alignment
  center: {
    alignSelf: 'center',
  },
});
