import TypographyText from '@/components/TypographyText';
import { useColorTheme } from '@/hooks/useColorTheme';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

interface TimerClockProps {
    initialTime?: number; // in seconds
    onTimeUp?: () => void;
}

const TimerClock: React.FC<TimerClockProps> = ({
    initialTime = 25 * 60, // 25 minutes default
    onTimeUp,
}) => {
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const [isRunning, setIsRunning] = useState(false);
    const colors = useColorTheme();

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;

        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        onTimeUp?.();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, timeLeft, onTimeUp]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <TypographyText style={[styles.timerText, { color: colors.contentPrimary }]}>
                {formatTime(timeLeft)}
            </TypographyText>
        </View>
    );
};

const styles = {
    container: {
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    timerText: {
        fontSize: 72,
        fontWeight: '800' as const,
        color: 'white',
        textAlign: 'center' as const,
        letterSpacing: -2,
    },
};

export default TimerClock;
