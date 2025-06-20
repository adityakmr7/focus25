import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/components/AuthProvider';
import { ThemeProvider } from '@/src/providers/ThemeProvider';
import { enableScreens } from 'react-native-screens';
import { initializeDatabase } from '@/src/services/database';
import { Platform } from 'react-native';
import { errorHandler } from '@/src/services/errorHandler';
import { backgroundTimerService } from '@/src/services/backgroundTimer';
import { notificationService } from '@/src/services/notificationService';

// Enable screens before any navigation components are rendered
enableScreens();

export default function RootLayout() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize error handler first
        await errorHandler.initialize();

        // Initialize local database (always available as fallback)
        await initializeDatabase();
        
        // Initialize background services (mobile only)
        if (Platform.OS !== 'web') {
          await Promise.all([
            backgroundTimerService.initialize(),
            notificationService.initialize(),
          ]);
        }
        
        console.log('App initialized successfully');
      } catch (error) {
        console.error('Failed to initialize app:', error);
        errorHandler.logError(error as Error, {
          context: 'App Initialization',
          severity: 'critical',
        });
      }
    };

    initializeApp();
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}