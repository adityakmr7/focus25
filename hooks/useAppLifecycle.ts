import { usePomodoroStore } from '@/stores/pomodoro-store';
import { useSettingsStore } from '@/stores/setting-store';
import { AppState } from 'react-native';
import { useEffect, useRef } from 'react';

/**
 * Custom hook to manage app lifecycle events
 * Handles background/foreground transitions and timer synchronization
 */
export function useAppLifecycle() {
    const {
        timerStatus,
        timeLeft,
        timerEndTime,
        syncTimerOnForeground,
        setTimerEndTime,
        setBackgroundedState,
    } = usePomodoroStore();

    const { soundEffects, notifications } = useSettingsStore();
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        const handleAppStateChange = (nextAppState: string) => {
            console.log('App state changed:', appState.current, '->', nextAppState);

            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                // App is coming to foreground
                console.log('App coming to foreground - syncing timer');
                handleAppForegrounded();
            } else if (nextAppState.match(/inactive|background/)) {
                // App is going to background
                console.log('App going to background - storing timer state');
                handleAppBackgrounded();
            }

            appState.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription?.remove();
        };
    }, [timerStatus, timeLeft]);

    const handleAppBackgrounded = () => {
        if (timerStatus === 'running' && timeLeft > 0) {
            // Calculate when the timer should complete
            const now = new Date();
            const endTime = new Date(now.getTime() + timeLeft * 1000);

            console.log('Storing timer end time:', endTime.toISOString());
            console.log('Time remaining:', timeLeft, 'seconds');

            setTimerEndTime(endTime);
            setBackgroundedState(true);
        }
    };

    const handleAppForegrounded = () => {
        console.log('App foregrounded - syncing timer state');
        setBackgroundedState(false);

        if (timerStatus === 'running') {
            // Sync timer with actual remaining time
            syncTimerOnForeground(soundEffects, notifications);
        }
    };

    return {
        isBackgrounded: appState.current.match(/inactive|background/),
    };
}
