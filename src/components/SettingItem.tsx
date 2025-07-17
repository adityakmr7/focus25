import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';

interface SettingItemProps {
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
}

/**
 * A reusable setting item component used in settings screens
 * @param title - The main text of the setting
 * @param subtitle - Optional subtitle text
 * @param icon - Ionicons icon name
 * @param hasSwitch - Whether to show a switch toggle
 * @param switchValue - Current value of the switch
 * @param onSwitchToggle - Callback when switch is toggled
 * @param onPress - Callback when item is pressed
 * @param showArrow - Whether to show a forward arrow
 * @param value - Optional value text to display
 */
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
}) => {
    const { mode, getCurrentTheme } = useThemeStore();
    const systemColorScheme = useColorScheme();
    const theme = getCurrentTheme();
    const isDark = mode === 'auto' ? systemColorScheme === 'dark' : mode === 'dark';

    return (
        <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.background }]}
            onPress={onPress}
            disabled={hasSwitch}
            activeOpacity={hasSwitch ? 1 : 0.7}
        >
            <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
                    <Ionicons name={icon} size={20} color={theme.accent} />
                </View>
                <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
                    {subtitle && (
                        <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                            {subtitle}
                        </Text>
                    )}
                </View>
            </View>
            <View style={styles.settingRight}>
                {value && (
                    <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
                        {value}
                    </Text>
                )}
                {hasSwitch && switchValue !== undefined && onSwitchToggle && (
                    <Switch
                        disabled={disabled}
                        value={disabled ? false : switchValue}
                        onValueChange={onSwitchToggle}
                        trackColor={{ false: theme.background, true: theme.accent }}
                        thumbColor={switchValue ? '#ffffff' : theme.textSecondary}
                    />
                )}
                {showArrow && (
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingText: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    settingSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    settingValue: {
        fontSize: 16,
    },
});
