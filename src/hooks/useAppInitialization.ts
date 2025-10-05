import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { appInitializer } from '../services/appInitializer';
import { errorHandler } from '../services/errorHandler';

export interface AppInitializationState {
  isReady: boolean;
  isInitializing: boolean;
  error: Error | null;
}

export function useAppInitialization(): AppInitializationState {
  const [state, setState] = useState<AppInitializationState>({
    isReady: false,
    isInitializing: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        await appInitializer.initialize();

        if (isMounted) {
          setState({
            isReady: true,
            isInitializing: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('💥 App initialization failed:', error);

        const initError = error as Error;

        // Log error for tracking
        errorHandler.logError(initError, {
          context: 'App Initialization',
          severity: 'critical',
        });

        if (isMounted) {
          setState({
            isReady: false,
            isInitializing: false,
            error: initError,
          });

          // Show error dialog
          Alert.alert(
            'Initialization Error',
            'Some features may not work properly. Please restart the app.',
            [
              {
                text: 'Continue Anyway',
                onPress: () => {
                  setState(prev => ({
                    ...prev,
                    isReady: true,
                    error: null,
                  }));
                },
              },
              {
                text: 'Retry',
                onPress: () => {
                  setState({
                    isReady: false,
                    isInitializing: true,
                    error: null,
                  });
                  // Reset and retry
                  appInitializer.reset();
                  initialize();
                },
              },
            ]
          );
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
