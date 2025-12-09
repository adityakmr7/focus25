import { useColorTheme } from '@/hooks/useColorTheme';
import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { SharedValue } from 'react-native-reanimated';

interface PomodoroTimerProps {
    timeLeft: number;
    progressValue: SharedValue<number>;
}

function PomodoroTimer({ timeLeft, progressValue }: PomodoroTimerProps) {
    const colors = useColorTheme();

    // Memoize time formatting to avoid recalculation
    const formattedTime = useMemo(() => {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, [timeLeft]);

    // Memoize timer text style
    const timerTextStyle = useMemo(() => [
        styles.timerText,
        { color: colors.contentPrimary }
    ], [colors.contentPrimary]);

    return (
        <View style={styles.timerContainer}>
            <Text>Session</Text>
            {/* Timer Text */}
            <View style={styles.timerTextContainer}>
                <Text style={timerTextStyle}>
                    {formattedTime}
                </Text>
            </View>
        </View>
    );
}

// Custom comparison function to prevent unnecessary re-renders
// Only re-render if timeLeft changes by more than 1 second
const arePropsEqual = (prevProps: PomodoroTimerProps, nextProps: PomodoroTimerProps) => {
    return prevProps.timeLeft === nextProps.timeLeft;
};

export default React.memo(PomodoroTimer, arePropsEqual);

const styles = StyleSheet.create({
    timerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: Dimensions.get('window').height * 0.3,
    },

    timerText: {
        fontSize: 72,
        fontWeight: '400',
        textAlign: 'center',
    },
    timerTextContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
