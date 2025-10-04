/**
 * Design System Spacer Component
 * A utility component for adding consistent spacing
 */
// @ts-nocheck

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../themes';
import { createStyleSheet } from '../../utils';

export interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  horizontal?: boolean;
  style?: ViewStyle;
}

export const Spacer: React.FC<SpacerProps> = ({
  size = 'md',
  horizontal = false,
  style,
}) => {
  const { theme } = useTheme();
  const styles = createStyleSheet(spacerStyles, theme);
  
  const getSpacerStyle = (): ViewStyle => {
    const baseStyle = horizontal ? styles.horizontalSpacer : styles.verticalSpacer;
    const sizeStyle = styles[`${size}Spacer`];
    
    return {
      ...baseStyle,
      ...sizeStyle,
      ...style,
    };
  };
  
  return <View style={getSpacerStyle()} />;
};

const spacerStyles = (theme: any) => ({
  verticalSpacer: {
    height: 0,
  },
  horizontalSpacer: {
    width: 0,
  },
  
  // Size variants
  xsSpacer: {
    [theme.spacing[1] ? 'height' : 'width']: theme.spacing[1],
  },
  smSpacer: {
    [theme.spacing[2] ? 'height' : 'width']: theme.spacing[2],
  },
  mdSpacer: {
    [theme.spacing[4] ? 'height' : 'width']: theme.spacing[4],
  },
  lgSpacer: {
    [theme.spacing[6] ? 'height' : 'width']: theme.spacing[6],
  },
  xlSpacer: {
    [theme.spacing[8] ? 'height' : 'width']: theme.spacing[8],
  },
  '2xlSpacer': {
    [theme.spacing[12] ? 'height' : 'width']: theme.spacing[12],
  },
  '3xlSpacer': {
    [theme.spacing[16] ? 'height' : 'width']: theme.spacing[16],
  },
});
