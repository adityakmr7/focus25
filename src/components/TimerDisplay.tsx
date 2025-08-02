import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useThemeStore } from '../store/themeStore';

interface TimerDisplayProps {
    minutes: number;
    seconds: number;
    progress: number;
    isRunning: boolean;
    pulseAnimation?: Animated.SharedValue<number>;
    onToggleTimer?: () => void;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
    minutes,
    seconds,
    progress,
    isRunning,
    pulseAnimation,
    onToggleTimer,
}) => {
    const { getCurrentTheme } = useThemeStore();
    const theme = getCurrentTheme();

    const formatTime = (minutes: number, seconds: number): string => {
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: pulseAnimation ? [{ scale: pulseAnimation.value }] : [],
    }));

    return (
        <Animated.View style={[styles.digitalContainer, animatedStyle]}>
            <View style={[styles.digitalBackground]}>
                <Text style={[styles.digitalTime, { color: theme.text }]}>
                    {formatTime(minutes, seconds)}
                </Text>
                <View style={[styles.progressBar, { backgroundColor: theme.surface }]}>
                    <View
                        style={[
                            styles.progressFill,
                            {
                                backgroundColor: theme.accent,
                                width: `${progress * 100}%`,
                            },
                        ]}
                    />
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    digitalContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 40,
    },
    digitalBackground: {
        paddingHorizontal: 40,
        paddingVertical: 30,
        borderRadius: 20,
        alignItems: 'center',
    },
    digitalTime: {
        fontSize: 100,
        fontWeight: '200',
        letterSpacing: -2,
        fontFamily: 'SF-Pro-Display-Bold',
    },
    progressBar: {
        width: 200,
        height: 4,
        borderRadius: 2,
        marginTop: 20,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
});
