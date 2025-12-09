import { Colors } from '@/constants/Colors';
import { useColorTheme } from '@/hooks/useColorTheme';
import { TimerStatus } from '@/stores/pomodoro-store';
import { Ionicons as Icon } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';

interface PomodoroControlsProps {
    onReset: () => void;
    onPlayPause: () => void;
    onSkip: () => void;
    buttonScale: SharedValue<number>;
    timerStatus: TimerStatus;
}

function PomodoroControls({
    onReset,
    onPlayPause,
    onSkip,
    buttonScale,
    timerStatus,
}: PomodoroControlsProps) {
    const colors = useColorTheme();

    const buttonAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: buttonScale.value }],
        };
    });

    // Memoize icon name to prevent recalculation
    const playPauseIcon = useMemo(() => {
        return timerStatus === 'running' ? 'pause' : 'play';
    }, [timerStatus]);

    // Memoize button style
    const controlButtonStyle = useMemo(() => [
        styles.controlButton,
        { backgroundColor: Colors.light.secondary }
    ], []);

    return (
        <View style={styles.controlsContainer}>
            <Animated.View style={buttonAnimatedStyle}>
                <TouchableOpacity
                    style={controlButtonStyle}
                    onPress={onPlayPause}
                >
                    <View style={styles.iconContainer}>
                        <Icon
                            name={playPauseIcon}
                            size={24}
                            color={colors.backgroundPrimary}
                        />
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

// Memoize component to prevent unnecessary re-renders
export default React.memo(PomodoroControls);

const styles = StyleSheet.create({
    controlsContainer: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 120,
    },
    controlButton: {
        width: 60,
        height: 60,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
