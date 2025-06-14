import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PlayPauseButtonProps {
    isRunning: boolean;
    isPaused: boolean;
    onPress: () => void;
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
    onPress
}) => (
    <TouchableOpacity
        style={styles.playButton}
        onPress={onPress}
        activeOpacity={0.8}
    >
        <View style={styles.playButtonInner}>
            <Ionicons
                name={isRunning && !isPaused ? "pause" : "play"}
                size={32}
                color="#4CAF50"
            />
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    playButton: {
        marginBottom: 60,
    },
    playButtonInner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderWidth: 2,
        borderColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
    },
}); 