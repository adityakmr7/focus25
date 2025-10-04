/**
 * Design System Setting Item Component
 * A specialized component for settings screen items
 */
// @ts-nocheck

import React from 'react';
import { TouchableOpacity, View, Text, Switch, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../themes';
import { createStyleSheet, combineViewStyles, combineTextStyles } from '../../utils';

export interface SettingItemProps {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchToggle?: () => void;
  onPress?: () => void;
  showArrow?: boolean;
  value?: string;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'warning';
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
}

export const SettingItem: React.FC<SettingItemProps> = ({
  title,
  subtitle,
  icon,
  hasSwitch = false,
  switchValue,
  onSwitchToggle,
  onPress,
  showArrow = false,
  value,
  disabled = false,
  variant = 'default',
  style,
  titleStyle,
  subtitleStyle,
}) => {
  const { theme } = useTheme();
  const styles = createStyleSheet(settingItemStyles, theme);
  
  const getItemStyle = (): ViewStyle => {
    const baseStyle = styles.item;
    const variantStyle = styles[`${variant}Item`];
    const disabledStyle = disabled ? styles.disabledItem : {};
    
    return combineViewStyles(
      baseStyle,
      variantStyle,
      disabledStyle,
      style
    );
  };
  
  const getTitleStyle = (): TextStyle => {
    const baseStyle = styles.title;
    const variantStyle = styles[`${variant}Title`];
    const disabledStyle = disabled ? styles.disabledTitle : {};
    
    return combineTextStyles(
      baseStyle,
      variantStyle,
      disabledStyle,
      titleStyle
    );
  };
  
  const getSubtitleStyle = (): TextStyle => {
    const baseStyle = styles.subtitle;
    const disabledStyle = disabled ? styles.disabledSubtitle : {};
    
    return combineTextStyles(
      baseStyle,
      disabledStyle,
      subtitleStyle
    );
  };
  
  const getIconColor = (): string => {
    if (disabled) return theme.colors['text-tertiary'];
    switch (variant) {
      case 'destructive': return theme.colors['accent-error'];
      case 'warning': return theme.colors['accent-warning'];
      default: return theme.colors['accent-focus'];
    }
  };
  
  const getValueStyle = (): TextStyle => {
    const baseStyle = styles.value;
    const disabledStyle = disabled ? styles.disabledValue : {};
    
    return combineTextStyles(
      baseStyle,
      disabledStyle
    );
  };
  
  return (
    <TouchableOpacity
      style={getItemStyle()}
      onPress={onPress}
      disabled={hasSwitch || disabled}
      activeOpacity={hasSwitch ? 1 : 0.7}
    >
      <View style={styles.left}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={icon}
            size={20}
            color={getIconColor()}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={getTitleStyle()}>{title}</Text>
          {subtitle && (
            <Text style={getSubtitleStyle()}>{subtitle}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.right}>
        {value && (
          <Text style={getValueStyle()}>{value}</Text>
        )}
        {hasSwitch && switchValue !== undefined && onSwitchToggle && (
          <Switch
            disabled={disabled}
            value={disabled ? false : switchValue}
            onValueChange={onSwitchToggle}
            trackColor={{ 
              false: theme.colors['bg-secondary'], 
              true: theme.colors['accent-focus'] 
            }}
            thumbColor={switchValue ? theme.colors['text-inverse'] : theme.colors['text-secondary']}
          />
        )}
        {showArrow && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors['text-secondary']}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const settingItemStyles = (theme: any) => ({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors['border-primary'],
  },
  
  // Variant styles
  defaultItem: {},
  destructiveItem: {
    backgroundColor: theme.colors['bg-error'],
  },
  warningItem: {
    backgroundColor: theme.colors['bg-warning'],
  },
  
  // State styles
  disabledItem: {
    opacity: 0.5,
  },
  
  // Left section
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors['bg-secondary'],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[3],
  },
  textContainer: {
    flex: 1,
  },
  
  // Title styles
  title: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors['text-primary'],
  },
  defaultTitle: {
    color: theme.colors['text-primary'],
  },
  destructiveTitle: {
    color: theme.colors['accent-error'],
  },
  warningTitle: {
    color: theme.colors['accent-warning'],
  },
  disabledTitle: {
    color: theme.colors['text-tertiary'],
  },
  
  // Subtitle styles
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors['text-secondary'],
    marginTop: theme.spacing[1],
  },
  disabledSubtitle: {
    color: theme.colors['text-tertiary'],
  },
  
  // Right section
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  value: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors['text-secondary'],
  },
  disabledValue: {
    color: theme.colors['text-tertiary'],
  },
});
