import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withRepeat,
    interpolate,
    useDerivedValue,
} from 'react-native-reanimated';
import { useThemeStore } from '../store/themeStore';

interface LiquidDropAnimationProps {
    currentSession: number; // 1-4
    totalSessions: number; // 4
    isRunning: boolean;
    isBreak: boolean;
}

export const LiquidDropAnimation: React.FC<LiquidDropAnimationProps> = ({
    currentSession,
    totalSessions,
    isRunning,
    isBreak,
}) => {
    const { getCurrentTheme } = useThemeStore();
    const theme = getCurrentTheme();

    // Animation values for each drop

    // Merge animations
    const merge1to2 = useSharedValue(0); // 0 = separate, 1 = merged
    const merge2to3 = useSharedValue(0);
    const merge3to4 = useSharedValue(0);

    // Active drop animation (gentle pulsing)
    const activeDropPulse = useSharedValue(0);

    // Colors
    const sessionColor = theme.accent;
    const breakColor = theme.info || '#7FB3B3';

    // Start active drop pulsing animation
    useEffect(() => {
        if (isRunning) {
            activeDropPulse.value = withRepeat(
                withSequence(withTiming(1, { duration: 1500 }), withTiming(0, { duration: 1500 })),
                -1,
                true,
            );
        } else {
            activeDropPulse.value = withTiming(0, { duration: 500 });
        }
    }, [isRunning]);

    // Handle merging based on session progression
    useEffect(() => {
        // After 1st session+break complete (now in session 2), merge drop 1 to 2
        if (currentSession >= 2) {
            merge1to2.value = withTiming(1, { duration: 1500 });
        }
        // After 2nd session+break complete (now in session 3), merge drop 2 to 3
        if (currentSession >= 3) {
            merge2to3.value = withTiming(1, { duration: 1500 });
        }
        // After 3rd session+break complete (now in session 4), merge drop 3 to 4
        if (currentSession >= 4) {
            merge3to4.value = withTiming(1, { duration: 1500 });
        }
    }, [currentSession]);

    // Drop 1 animation
    const drop1AnimatedStyle = useAnimatedStyle(() => {
        const isActive = currentSession === 1 && isRunning;
        const pulse = isActive ? interpolate(activeDropPulse.value, [0, 1], [0.8, 1]) : 0.8;

        const translateX = interpolate(merge1to2.value, [0, 1], [0, 20]);
        const scaleX = interpolate(merge1to2.value, [0, 1], [1, 1.5]);
        const opacity = interpolate(merge1to2.value, [0, 1], [1, 0]);

        return {
            transform: [{ scale: pulse }, { translateX }, { scaleX }],
            opacity,
            backgroundColor:
                isActive && !isBreak
                    ? sessionColor
                    : isActive && isBreak
                      ? breakColor
                      : theme.surface,
        };
    });

    // Drop 2 animation
    const drop2AnimatedStyle = useAnimatedStyle(() => {
        const isActive = currentSession === 2 && isRunning;
        const pulse = isActive ? interpolate(activeDropPulse.value, [0, 1], [0.8, 1]) : 0.8;

        const fromMerge1 = interpolate(merge1to2.value, [0, 1], [1, 1.3]);
        const translateX = interpolate(merge2to3.value, [0, 1], [0, 20]);
        const scaleX = interpolate(merge2to3.value, [0, 1], [1, 1.5]);
        const opacity = interpolate(merge2to3.value, [0, 1], [1, 0]);

        return {
            transform: [{ scale: pulse * fromMerge1 }, { translateX }, { scaleX }],
            opacity,
            backgroundColor:
                isActive && !isBreak
                    ? sessionColor
                    : isActive && isBreak
                      ? breakColor
                      : theme.surface,
        };
    });

    // Drop 3 animation
    const drop3AnimatedStyle = useAnimatedStyle(() => {
        const isActive = currentSession === 3 && isRunning;
        const pulse = isActive ? interpolate(activeDropPulse.value, [0, 1], [0.8, 1]) : 0.8;

        const fromMerge2 = interpolate(merge2to3.value, [0, 1], [1, 1.3]);
        const translateX = interpolate(merge3to4.value, [0, 1], [0, 20]);
        const scaleX = interpolate(merge3to4.value, [0, 1], [1, 1.5]);
        const opacity = interpolate(merge3to4.value, [0, 1], [1, 0]);

        return {
            transform: [{ scale: pulse * fromMerge2 }, { translateX }, { scaleX }],
            opacity,
            backgroundColor:
                isActive && !isBreak
                    ? sessionColor
                    : isActive && isBreak
                      ? breakColor
                      : theme.surface,
        };
    });

    // Drop 4 animation
    const drop4AnimatedStyle = useAnimatedStyle(() => {
        const isActive = currentSession === 4 && isRunning;
        const pulse = isActive ? interpolate(activeDropPulse.value, [0, 1], [0.8, 1]) : 0.8;

        const fromMerge3 = interpolate(merge3to4.value, [0, 1], [1, 1.5]);

        return {
            transform: [{ scale: pulse * fromMerge3 }],
            backgroundColor:
                isActive && !isBreak
                    ? sessionColor
                    : isActive && isBreak
                      ? breakColor
                      : theme.surface,
        };
    });

    return (
        <View style={styles.container}>
            <View style={styles.dropsContainer}>
                {/* Drop 1 */}
                <Animated.View style={[styles.drop, drop1AnimatedStyle]} />

                {/* Drop 2 */}
                <Animated.View style={[styles.drop, drop2AnimatedStyle]} />

                {/* Drop 3 */}
                <Animated.View style={[styles.drop, drop3AnimatedStyle]} />

                {/* Drop 4 */}
                <Animated.View style={[styles.drop, drop4AnimatedStyle]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    dropsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    drop: {
        width: 16,
        height: 20,
        borderRadius: 8,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
});
