import React from 'react';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuickActionsPanelProps {
    theme: any;
    showQuickActions: boolean;
    quickActionsAnimation: any;
    onOpenMusicPlayer: () => void;
    onToggleBreathing: () => void;
    onToggleFocusMode: () => void;
    showBreathingAnimation: boolean;
    focusModeActive: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const QuickActionsPanel: React.FC<QuickActionsPanelProps> = React.memo(
    ({
        theme,
        showQuickActions,
        quickActionsAnimation,
        onOpenMusicPlayer,
        onToggleBreathing,
        onToggleFocusMode,
        showBreathingAnimation,
        focusModeActive,
    }) => {
        const quickActionsAnimatedStyle = useAnimatedStyle(() => {
            return {
                opacity: interpolate(quickActionsAnimation.value, [0, 1], [0, 1]),
                transform: [
                    {
                        translateY: interpolate(quickActionsAnimation.value, [0, 1], [20, 0]),
                    },
                    {
                        scale: interpolate(quickActionsAnimation.value, [0, 1], [0.95, 1]),
                    },
                ],
            };
        });

        if (!showQuickActions) return null;

        const quickActions = [
            {
                id: 'music',
                icon: 'musical-notes',
                color: '#4ECDC4',
                title: 'Focus Music',
                subtitle: 'Ambient sounds',
                onPress: onOpenMusicPlayer,
            },
            {
                id: 'breathing',
                icon: 'leaf',
                color: '#48BB78',
                title: 'Breathing Guide',
                subtitle: showBreathingAnimation ? 'Active' : 'Inactive',
                onPress: onToggleBreathing,
            },
            {
                id: 'focus',
                icon: 'eye-off',
                color: '#9F7AEA',
                title: 'Focus Mode',
                subtitle: focusModeActive ? 'Enabled' : 'Disabled',
                onPress: onToggleFocusMode,
            },
        ];

        return (
            <Animated.View
                style={[
                    styles.quickActionsPanel,
                    { backgroundColor: theme.surface },
                    quickActionsAnimatedStyle,
                ]}
                pointerEvents={showQuickActions ? 'auto' : 'none'}
            >
                {quickActions.map((action, index) => (
                    <TouchableOpacity
                        key={action.id}
                        style={styles.quickActionItem}
                        onPress={action.onPress}
                        accessible={true}
                        accessibilityLabel={`${action.title}: ${action.subtitle}`}
                    >
                        <View
                            style={[
                                styles.quickActionIcon,
                                { backgroundColor: action.color + '20' },
                            ]}
                        >
                            <Ionicons name={action.icon} size={20} color={action.color} />
                        </View>
                        <View style={styles.quickActionTextContainer}>
                            <Text style={[styles.quickActionText, { color: theme.text }]}>
                                {action.title}
                            </Text>
                            <Text
                                style={[styles.quickActionSubtext, { color: theme.textSecondary }]}
                            >
                                {action.subtitle}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </Animated.View>
        );
    },
);

QuickActionsPanel.displayName = 'QuickActionsPanel';

const styles = StyleSheet.create({
    quickActionsPanel: {
        marginHorizontal: screenWidth * 0.1,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
        zIndex: 100,
        position: 'absolute',
        top: 80,
        width: screenWidth * 0.8,
    },
    quickActionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    quickActionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    quickActionTextContainer: {
        flex: 1,
    },
    quickActionText: {
        fontSize: 16,
        fontWeight: '600',
    },
    quickActionSubtext: {
        fontSize: 12,
        opacity: 0.7,
        marginTop: 2,
    },
});
export default QuickActionsPanel;
