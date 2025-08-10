import { useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { widgetService } from '../services/widgetService';
import { usePomodoroStore } from '../store/pomodoroStore';

export function useAppStateHandling(): void {
    useEffect(() => {
        if (Platform.OS === 'web') {
            return;
        }

        const handleAppStateChange = async (nextAppState: AppStateStatus) => {
            if (nextAppState === 'background') {
                console.log('📱 App backgrounded - Live Activity background updates enabled');
                
                // Get current timer state
                const timer = usePomodoroStore.getState().timer;
                
                // If timer is running and Live Activity is active, the native background timer will handle updates
                if (timer.isRunning && !timer.isPaused) {
                    console.log('⏰ Timer is active - native background updates will continue');
                }
                
            } else if (nextAppState === 'active') {
                console.log('📱 App foregrounded - synchronizing with native timer state');
                
                // The useBackgroundTimer hook will handle state synchronization
                // Live Activity updates will continue seamlessly
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, []);
}