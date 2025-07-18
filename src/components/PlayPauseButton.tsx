import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { themes } from '../utils/color-theme';
import { useTheme } from '../hooks/useTheme';

interface PlayPauseButtonProps {
    isRunning: boolean;
    isPaused: boolean;
    onPress: () => void;
    disabled?: boolean;
}

/**
 * A component that displays a play/pause button for timer controls
 * @param isRunning - Whether the timer is running
 * @param isPaused - Whether the timer is paused
 * @param onPress - Callback when button is pressed
 */
export const PlayPauseButton: React.FC<PlayPauseButtonProps> = ({
    isRunning,
    isPaused,
    onPress,
    disabled = false,
}) => {
    const { theme } = useTheme();
    return (
        <TouchableOpacity
            disabled={disabled}
            style={styles.playButton}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View
                style={[
                    styles.playButtonInner,
                    { backgroundColor: theme.surface, borderColor: theme.accent },
                ]}
            >
                <Ionicons
                    name={isRunning && !isPaused ? 'pause' : 'play'}
                    size={32}
                    color={theme.accent}
                />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    playButton: {
        marginBottom: 30,
    },
    playButtonInner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
