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
                console.log('📱 App foregrounded - timer sync handled by useBackgroundTimer hook');
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, []);
}