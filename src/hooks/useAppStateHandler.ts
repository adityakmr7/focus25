import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

interface UseAppStateHandlerProps {
  onAppBackground: () => void;
  onAppForeground: () => Promise<void>;
}

export const useAppStateHandler = ({
  onAppBackground,
  onAppForeground,
}: UseAppStateHandlerProps) => {
  const appStateRef = useRef<AppStateStatus>('active');

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (Platform.OS === 'web') return;

      const previousAppState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (nextAppState === 'background' && previousAppState === 'active') {
        // App going to background
        console.log('📱 App backgrounded - timer continues running');
        onAppBackground();
      } else if (nextAppState === 'active' && previousAppState !== 'active') {
        // App coming to foreground
        console.log('📱 App foregrounded - syncing timer state');
        await onAppForeground();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    // Set initial app state
    appStateRef.current = AppState.currentState;

    return () => subscription?.remove();
  }, [onAppBackground, onAppForeground]);

  return {
    currentAppState: appStateRef.current,
    isAppActive: appStateRef.current === 'active',
  };
};
