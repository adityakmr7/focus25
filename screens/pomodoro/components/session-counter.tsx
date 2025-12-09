import TypographyText from '@/components/TypographyText';
import { useColorTheme } from '@/hooks/useColorTheme';
import { usePomodoroStore } from '@/stores/pomodoro-store';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const SessionCounter: React.FC = () => {
    const colors = useColorTheme();
    const { currentSession, totalSessions, timerPhase } = usePomodoroStore();

    // Show "Break" during break phases, session counter during focus
    const isBreakPhase = timerPhase === 'shortBreak' || timerPhase === 'longBreak';

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: colors.backgroundPrimary, borderColor: colors.surfacePrimary },
            ]}
        >
            <TypographyText
                variant="label"
                style={[styles.label, { color: colors.contentSecondary }]}
            >
                {isBreakPhase ? 'Break' : 'Session'}
            </TypographyText>
            <TypographyText
                variant="heading"
                style={[styles.counter, { color: colors.contentPrimary }]}
            >
                {isBreakPhase ? 'Time' : `${currentSession} of ${totalSessions}`}
            </TypographyText>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginBottom: 24,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
    },
    label: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    counter: {
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 28,
    },
});

export default SessionCounter;
