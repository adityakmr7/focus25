import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    value
}) => (
    <TouchableOpacity
        className={"border-b-bg-100 dark:border-b-dark-bg-100"}
        style={styles.settingItem}
        onPress={onPress}
        disabled={hasSwitch}
        activeOpacity={hasSwitch ? 1 : 0.7}
    >
        <View style={styles.settingLeft}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={20} color="#4CAF50" />
            </View>
            <View style={styles.settingText}>
                <Text className={"color-text-primary dark:color-text-primary"} style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text className={"color-text-secondary dark:color-text-secondary"} style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
        </View>
        <View style={styles.settingRight}>
            {value && <Text style={styles.settingValue}>{value}</Text>}
            {hasSwitch && switchValue !== undefined && onSwitchToggle && (
                <Switch
                    value={switchValue}
                    onValueChange={onSwitchToggle}
                    trackColor={{ false: '#333333', true: '#4CAF50' }}
                    thumbColor={switchValue ? '#ffffff' : '#888888'}
                />
            )}
            {showArrow && (
                <Ionicons name="chevron-forward" size={20} color="#666666" />
            )}
        </View>
    </TouchableOpacity>
);

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
        backgroundColor: '#1a1a1a',
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
        color: '#666666',
    },
});
