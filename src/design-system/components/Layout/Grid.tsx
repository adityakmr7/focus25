/**
 * Design System Grid Component
 * A flexible grid layout component
 */
// @ts-nocheck

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../themes';
import { createStyleSheet, combineViewStyles } from '../../utils';

export interface GridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

export interface GridItemProps {
  children: React.ReactNode;
  span?: 1 | 2 | 3 | 4 | 6 | 12;
  style?: ViewStyle;
}

export const Grid: React.FC<GridProps> = ({
  children,
  columns = 12,
  gap = 'md',
  style,
}) => {
  const { theme } = useTheme();
  const styles = createStyleSheet(gridStyles, theme);
  
  const getGridStyle = (): ViewStyle => {
    const baseStyle = styles.grid;
    const gapStyle = styles[`${gap}Gap`];
    
    return combineViewStyles(
      baseStyle,
      gapStyle,
      style
    );
  };
  
  return (
    <View style={getGridStyle()}>
      {children}
    </View>
  );
};

export const GridItem: React.FC<GridItemProps> = ({
  children,
  span = 12,
  style,
}) => {
  const { theme } = useTheme();
  const styles = createStyleSheet(gridStyles, theme);
  
  const getItemStyle = (): ViewStyle => {
    const baseStyle = styles.item;
    const spanStyle = styles[`span${span}`];
    
    return combineViewStyles(
      baseStyle,
      spanStyle,
      style
    );
  };
  
  return (
    <View style={getItemStyle()}>
      {children}
    </View>
  );
};

const gridStyles = (theme: any) => ({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  
  // Gap variants
  noneGap: {
    gap: 0,
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
  
  // Grid item
  item: {
    flex: 1,
  },
  
  // Span variants
  span1: { flex: 0, width: '8.333%' as const },
  span2: { flex: 0, width: '16.666%' as const },
  span3: { flex: 0, width: '25%' as const },
  span4: { flex: 0, width: '33.333%' as const },
  span6: { flex: 0, width: '50%' as const },
  span12: { flex: 0, width: '100%' as const },
});
