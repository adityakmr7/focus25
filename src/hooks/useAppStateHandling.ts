import { useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

export function useAppStateHandling(): void {
    useEffect(() => {
        if (Platform.OS === 'web') {
            return;
        }

        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'background') {
                console.log('📱 App backgrounded - background timer active');
                // Background timer will handle timing
            } else if (nextAppState === 'active') {
                console.log('📱 App foregrounded - syncing with background timer');
                // Sync timer state with background timer
                try {
                    // You might want to sync your pomodoro store here
                    // pomodoroStore.syncWithBackgroundTimer();
                } catch (error) {
                    console.error('Failed to sync with background timer:', error);
                }
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, []);
}