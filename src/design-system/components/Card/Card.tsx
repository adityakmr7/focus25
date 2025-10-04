/**
 * Design System Card Component
 * A versatile card component with multiple variants and layouts
 */
// @ts-nocheck

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../themes';
import { createStyleSheet, combineViewStyles, combineTextStyles } from '../../utils';

export interface CardProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
}

export interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
}

export interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  children,
  style,
  onPress,
  disabled = false,
  ...props
}) => {
  const { theme } = useTheme();
  const styles = createStyleSheet(cardStyles, theme);
  
  const getCardStyle = (): ViewStyle => {
    const baseStyle = styles.card as ViewStyle;
    const variantStyle = styles[`${variant}Card`] as ViewStyle;
    const paddingStyle = styles[`${padding}Padding`] as ViewStyle;
    const stateStyle = disabled ? styles.disabledCard as ViewStyle : {};
    
    return combineViewStyles(
      baseStyle,
      variantStyle,
      paddingStyle,
      stateStyle,
      style
    );
  };
  
  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <CardComponent
      style={getCardStyle() as any}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      {children}
    </CardComponent>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  titleStyle,
  subtitleStyle,
}) => {
  const { theme } = useTheme();
  const styles = createStyleSheet(cardStyles, theme);
  
  return (
        <View style={[styles.header as ViewStyle, style]}>
          <View style={styles.headerLeft as ViewStyle}>
            {leftIcon && (
              <Ionicons
                name={leftIcon}
                size={20}
                color={theme.colors['accent-focus']}
                style={styles.headerIcon as any}
              />
            )}
            <View style={styles.headerText as ViewStyle}>
              {title && (
                <Text style={combineTextStyles(styles.headerTitle as TextStyle, titleStyle)}>{title}</Text>
              )}
              {subtitle && (
                <Text style={combineTextStyles(styles.headerSubtitle as TextStyle, subtitleStyle)}>{subtitle}</Text>
              )}
            </View>
          </View>
      {rightIcon && (
        <TouchableOpacity onPress={onRightIconPress} style={styles.headerRight as ViewStyle}>
          <Ionicons
            name={rightIcon}
            size={20}
            color={theme.colors['text-secondary']}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export const CardContent: React.FC<CardContentProps> = ({
  children,
  style,
}) => {
  const { theme } = useTheme();
  const styles = createStyleSheet(cardStyles, theme);
  
  return (
    <View style={[styles.content as ViewStyle, style]}>
      {children}
    </View>
  );
};

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  style,
}) => {
  const { theme } = useTheme();
  const styles = createStyleSheet(cardStyles, theme);
  
  return (
    <View style={[styles.footer as ViewStyle, style]}>
      {children}
    </View>
  );
};

const cardStyles = (theme: any) => ({
  card: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden' as const,
  } as ViewStyle,
  
  // Variants
  defaultCard: {
    backgroundColor: theme.colors['bg-elevated'],
    ...theme.shadows.sm,
  } as ViewStyle,
  elevatedCard: {
    backgroundColor: theme.colors['bg-elevated'],
    ...theme.shadows.md,
  } as ViewStyle,
  outlinedCard: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors['border-primary'],
  } as ViewStyle,
  filledCard: {
    backgroundColor: theme.colors['bg-secondary'],
  } as ViewStyle,
  
  // Padding variants
  nonePadding: {
    padding: 0,
  } as ViewStyle,
  smPadding: {
    padding: theme.spacing[3],
  } as ViewStyle,
  mdPadding: {
    padding: theme.spacing[4],
  } as ViewStyle,
  lgPadding: {
    padding: theme.spacing[6],
  } as ViewStyle,
  xlPadding: {
    padding: theme.spacing[8],
  } as ViewStyle,
  
  // States
  disabledCard: {
    opacity: 0.5,
  } as ViewStyle,
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[3],
  } as ViewStyle,
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  headerIcon: {
    marginRight: theme.spacing[3],
  } as ViewStyle,
  headerText: {
    flex: 1,
  } as ViewStyle,
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors['text-primary'],
    marginBottom: theme.spacing[1],
  } as TextStyle,
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors['text-secondary'],
  } as TextStyle,
  headerRight: {
    padding: theme.spacing[1],
  } as ViewStyle,
  
  // Content styles
  content: {
    flex: 1,
  } as ViewStyle,
  
  // Footer styles
  footer: {
    marginTop: theme.spacing[4],
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors['border-primary'],
  } as ViewStyle,
});
