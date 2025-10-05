/**
 * Design System Metric Card Component
 * A specialized card component for displaying metrics and statistics
 */
// @ts-nocheck

import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../themes';
import {
  createStyleSheet,
  combineViewStyles,
  combineTextStyles,
} from '../../utils';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'highlighted';
  style?: ViewStyle;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = 'primary',
  size = 'md',
  variant = 'default',
  style,
}) => {
  const { theme } = useTheme();
  const styles = createStyleSheet(metricCardStyles, theme);

  const getCardStyle = (): ViewStyle => {
    const baseStyle = styles.card;
    const sizeStyle = styles[`${size}Card`];
    const variantStyle = styles[`${variant}Card`];
    const colorStyle = styles[`${color}Card`];

    return combineViewStyles(
      baseStyle,
      sizeStyle,
      variantStyle,
      colorStyle,
      style
    );
  };

  const getValueStyle = (): TextStyle => {
    const baseStyle = styles.value;
    const sizeStyle = styles[`${size}Value`];
    const colorStyle = styles[`${color}Value`];

    return combineTextStyles(baseStyle, sizeStyle, colorStyle);
  };

  const getTitleStyle = (): TextStyle => {
    const baseStyle = styles.title;
    const sizeStyle = styles[`${size}Title`];

    return combineTextStyles(baseStyle, sizeStyle);
  };

  const getIconColor = (): string => {
    switch (color) {
      case 'success':
        return theme.colors['accent-success'];
      case 'warning':
        return theme.colors['accent-warning'];
      case 'error':
        return theme.colors['accent-error'];
      case 'info':
        return theme.colors['accent-info'];
      default:
        return theme.colors['accent-focus'];
    }
  };

  const getTrendIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  const getTrendColor = (): string => {
    switch (trend) {
      case 'up':
        return theme.colors['accent-success'];
      case 'down':
        return theme.colors['accent-error'];
      default:
        return theme.colors['text-secondary'];
    }
  };

  return (
    <View style={getCardStyle()}>
      <View style={styles.header}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={getIconColor()}
            style={styles.icon}
          />
        )}
        <Text style={getTitleStyle()}>{title}</Text>
      </View>

      <Text style={getValueStyle()}>{value}</Text>

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      {trend && trendValue && (
        <View style={styles.trend}>
          <Ionicons name={getTrendIcon()} size={16} color={getTrendColor()} />
          <Text style={[styles.trendText, { color: getTrendColor() }]}>
            {trendValue}
          </Text>
        </View>
      )}
    </View>
  );
};

const metricCardStyles = (theme: any) => ({
  card: {
    backgroundColor: theme.colors['bg-elevated'],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    ...theme.shadows.sm,
  },

  // Size variants
  smCard: {
    padding: theme.spacing[3],
  },
  mdCard: {
    padding: theme.spacing[4],
  },
  lgCard: {
    padding: theme.spacing[6],
  },

  // Variant styles
  defaultCard: {
    backgroundColor: theme.colors['bg-elevated'],
  },
  minimalCard: {
    backgroundColor: 'transparent',
    ...theme.shadows.none,
  },
  highlightedCard: {
    backgroundColor: theme.colors['bg-focus'],
    borderWidth: 1,
    borderColor: theme.colors['accent-focus'],
  },

  // Color variants
  primaryCard: {},
  successCard: {
    backgroundColor: theme.colors['bg-success'],
  },
  warningCard: {
    backgroundColor: theme.colors['bg-warning'],
  },
  errorCard: {
    backgroundColor: theme.colors['bg-error'],
  },
  infoCard: {
    backgroundColor: theme.colors['bg-info'],
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  icon: {
    marginRight: theme.spacing[2],
  },

  // Title styles
  title: {
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors['text-secondary'],
    flex: 1,
  },
  smTitle: {
    fontSize: theme.typography.fontSize.xs,
  },
  mdTitle: {
    fontSize: theme.typography.fontSize.sm,
  },
  lgTitle: {
    fontSize: theme.typography.fontSize.base,
  },

  // Value styles
  value: {
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors['text-primary'],
    marginBottom: theme.spacing[1],
  },
  smValue: {
    fontSize: theme.typography.fontSize['2xl'],
  },
  mdValue: {
    fontSize: theme.typography.fontSize['3xl'],
  },
  lgValue: {
    fontSize: theme.typography.fontSize['4xl'],
  },

  primaryValue: {
    color: theme.colors['text-primary'],
  },
  successValue: {
    color: theme.colors['accent-success'],
  },
  warningValue: {
    color: theme.colors['accent-warning'],
  },
  errorValue: {
    color: theme.colors['accent-error'],
  },
  infoValue: {
    color: theme.colors['accent-info'],
  },

  // Subtitle styles
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors['text-tertiary'],
    marginBottom: theme.spacing[2],
  },

  // Trend styles
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    marginLeft: theme.spacing[1],
  },
});
