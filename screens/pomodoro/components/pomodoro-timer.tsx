import { useColorTheme } from '@/hooks/useColorTheme';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { SharedValue } from 'react-native-reanimated';

interface PomodoroTimerProps {
    timeLeft: number;
    progressValue: SharedValue<number>;
}

export default function PomodoroTimer({ timeLeft, progressValue }: PomodoroTimerProps) {
    const colors = useColorTheme();

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.timerContainer}>
            <Text>Session</Text>
            {/* Timer Text */}
            <View style={styles.timerTextContainer}>
                <Text style={[styles.timerText, { color: colors.contentPrimary }]}>
                    {formatTime(timeLeft)}
                </Text>
            </View>
        </View>
    );
}

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
