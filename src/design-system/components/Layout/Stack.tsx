/**
 * Design System Stack Component
 * A flexible stack layout component
 */
// @ts-nocheck

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../themes';
import { createStyleSheet, combineViewStyles } from '../../utils';

export interface StackProps {
  children: React.ReactNode;
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?:
    | 'start'
    | 'center'
    | 'end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  wrap?: boolean;
  style?: ViewStyle;
}

export const Stack: React.FC<StackProps> = ({
  children,
  direction = 'column',
  align = 'stretch',
  justify = 'start',
  gap = 'none',
  wrap = false,
  style,
}) => {
  const { theme } = useTheme();
  const styles = createStyleSheet(stackStyles, theme);

  const getStackStyle = (): ViewStyle => {
    const baseStyle = styles.stack;
    const directionStyle = styles[`${direction}Direction`];
    const alignStyle = styles[`${align}Align`];
    const justifyStyle = styles[`${justify}Justify`];
    const gapStyle = styles[`${gap}Gap`];
    const wrapStyle = wrap ? styles.wrap : {};

    return combineViewStyles(
      baseStyle,
      directionStyle,
      alignStyle,
      justifyStyle,
      gapStyle,
      wrapStyle,
      style
    );
  };

  return <View style={getStackStyle()}>{children}</View>;
};

const stackStyles = (theme: any) => ({
  stack: {
    display: 'flex',
  },

  // Direction variants
  rowDirection: {
    flexDirection: 'row',
  },
  columnDirection: {
    flexDirection: 'column',
  },
  'row-reverseDirection': {
    flexDirection: 'row-reverse',
  },
  'column-reverseDirection': {
    flexDirection: 'column-reverse',
  },

  // Alignment variants
  startAlign: {
    alignItems: 'flex-start',
  },
  centerAlign: {
    alignItems: 'center',
  },
  endAlign: {
    alignItems: 'flex-end',
  },
  stretchAlign: {
    alignItems: 'stretch',
  },

  // Justify variants
  startJustify: {
    justifyContent: 'flex-start',
  },
  centerJustify: {
    justifyContent: 'center',
  },
  endJustify: {
    justifyContent: 'flex-end',
  },
  'space-betweenJustify': {
    justifyContent: 'space-between',
  },
  'space-aroundJustify': {
    justifyContent: 'space-around',
  },
  'space-evenlyJustify': {
    justifyContent: 'space-evenly',
  },

  // Gap variants
  noneGap: {
    gap: 0,
  },
  xsGap: {
    gap: theme.spacing[1],
  },
  smGap: {
    gap: theme.spacing[2],
  },
  mdGap: {
    gap: theme.spacing[4],
  },
  lgGap: {
    gap: theme.spacing[6],
  },
  xlGap: {
    gap: theme.spacing[8],
  },

  // Wrap
  wrap: {
    flexWrap: 'wrap',
  },
});
