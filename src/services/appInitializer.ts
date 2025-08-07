import { Platform } from 'react-native';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { useSettingsStore } from '../store/settingsStore';
import { useStatisticsStore } from '../store/statisticsStore';
import { usePomodoroStore } from '../store/pomodoroStore';
import { useThemeStore } from '../store/themeStore';

import { hybridDatabaseService } from '../data/hybridDatabase';
import { localDatabaseService } from '../data/local/localDatabase';
import { seedDatabase } from '../utils/seedData';

import { manualTimerService } from './backgroundTimer';
import { notificationService } from './notificationService';
import { errorHandler } from './errorHandler';
import { updateService } from './updateService';
import { AudioCacheManager } from '../utils/audioCache';
import { musicTracks } from '../utils/constants';

export interface InitializationState {
    isReady: boolean;
    isSeeding: boolean;
    error: Error | null;
}

export class AppInitializer {
    private static instance: AppInitializer | null = null;
    private initializationPromise: Promise<void> | null = null;

    static getInstance(): AppInitializer {
        if (!AppInitializer.instance) {
            AppInitializer.instance = new AppInitializer();
        }
        return AppInitializer.instance;
    }

    /**
     * Critical initialization - must complete before showing UI
     */
    async initializeCritical(): Promise<void> {
        console.log('🚀 Starting critical initialization...');

        // Run critical tasks in parallel
        await Promise.all([
            this.loadFonts(),
            this.initializeErrorHandler(),
            this.initializeDatabase(),
        ]);

        // Initialize stores (depends on database)
        await this.initializeStores();

        console.log('✅ Critical initialization completed');
    }

    /**
     * Background initialization - can happen after UI is shown
     */
    async initializeBackground(): Promise<void> {
        console.log('🔄 Starting background initialization...');

        // Run non-critical tasks that can happen in background
        const backgroundTasks = [];

        if (Platform.OS !== 'web') {
            backgroundTasks.push(
                this.initializeBackgroundServices(),
                this.preDownloadAudio(),
                this.checkForUpdates()
            );
        } else {
            backgroundTasks.push(this.preDownloadAudio());
        }

        // Run in parallel, don't wait for completion
        Promise.all(backgroundTasks).catch((error) => {
            console.warn('Background initialization failed:', error);
            // Don't throw - these are non-critical
        });

        console.log('✅ Background initialization started');
    }

    /**
     * Full initialization with proper error handling
     */
    async initialize(): Promise<void> {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this.performInitialization();
        return this.initializationPromise;
    }

    private async performInitialization(): Promise<void> {
        try {
            // Critical path - show app as soon as this completes
            await this.initializeCritical();

            // Hide splash screen as soon as critical initialization is done
            await SplashScreen.hideAsync();
            console.log('✅ Splash screen hidden');

            // Continue with background initialization
            this.initializeBackground();

        } catch (error) {
            console.error('💥 Critical initialization failed:', error);
            
            // Still hide splash screen to show error state
            try {
                await SplashScreen.hideAsync();
            } catch (splashError) {
                console.warn('Failed to hide splash screen:', splashError);
            }

            throw error;
        }
    }

    private async loadFonts(): Promise<void> {
        console.log('🔤 Loading fonts...');
        await Font.loadAsync({
            'SF-Pro-Display-Ultralight': require('../../assets/fonts/SF-Pro-Display-Ultralight.otf'),
            'SF-Pro-Display-Thin': require('../../assets/fonts/SF-Pro-Display-Thin.otf'),
            'SF-Pro-Display-Light': require('../../assets/fonts/SF-Pro-Display-Light.otf'),
            'SF-Pro-Display-Regular': require('../../assets/fonts/SF-Pro-Display-Regular.otf'),
            'SF-Pro-Display-Medium': require('../../assets/fonts/SF-Pro-Display-Medium.otf'),
            'SF-Pro-Display-Semibold': require('../../assets/fonts/SF-Pro-Display-Semibold.otf'),
            'SF-Pro-Display-Bold': require('../../assets/fonts/SF-Pro-Display-Bold.otf'),
            'SF-Pro-Display-Heavy': require('../../assets/fonts/SF-Pro-Display-Heavy.otf'),
        });
        console.log('✅ Fonts loaded');
    }

    private async initializeErrorHandler(): Promise<void> {
        console.log('🛡️ Initializing error handler...');
        await errorHandler.initialize();
        console.log('✅ Error handler initialized');
    }

    private async initializeDatabase(): Promise<void> {
        console.log('🗄️ Initializing database...');
        
        // Initialize local database first (faster)
        await localDatabaseService.initializeDatabase();
        console.log('✅ Local database initialized');

        // Initialize hybrid database service
        await hybridDatabaseService.initializeDatabase();
        console.log('✅ Hybrid database initialized');

        // Handle seeding in development (non-blocking)
        if (__DEV__) {
            this.handleDevelopmentSeeding().catch((error) => {
                console.warn('Development seeding failed:', error);
                // Don't block initialization
            });
        }
    }

    private async handleDevelopmentSeeding(): Promise<void> {
        try {
            const statistics = await localDatabaseService.getStatistics();
            
            if (statistics.totalCount === 0) {
                console.log('🌱 Seeding development database...');
                await seedDatabase(localDatabaseService, { all: true });
                console.log('✅ Development seeding completed');
            }
        } catch (error) {
            console.warn('Development seeding failed:', error);
        }
    }

    private async initializeStores(): Promise<void> {
        console.log('🏪 Initializing stores...');
        
        // Get store initializers
        const { initializeStore: initializeSettings } = useSettingsStore.getState();
        const { initializeStore: initializeStatistics } = useStatisticsStore.getState();
        const { initializeStore: initializePomodoro } = usePomodoroStore.getState();
        const { initializeStore: initializeTheme } = useThemeStore.getState();

        // Initialize all stores in parallel
        await Promise.all([
            initializeSettings(),
            initializeStatistics(),
            initializePomodoro(),
            initializeTheme(),
        ]);

        console.log('✅ All stores initialized');
    }

    private async initializeBackgroundServices(): Promise<void> {
        console.log('🔧 Initializing background services...');
        
        await Promise.all([
            manualTimerService.initialize(),
            notificationService.initialize(),
            updateService.initialize(),
        ]);

        console.log('✅ Background services initialized');
    }

    private async preDownloadAudio(): Promise<void> {
        try {
            console.log('🎵 Pre-downloading audio...');
            
            const popularTrackUrls = musicTracks
                .slice(0, 3)
                .map((track) => track.source);

            await AudioCacheManager.preDownloadAudio(popularTrackUrls);
            console.log('✅ Audio pre-downloaded');
        } catch (error) {
            console.warn('Audio pre-download failed:', error);
            // Non-critical, don't throw
        }
    }

    private async checkForUpdates(): Promise<void> {
        try {
            console.log('🔄 Checking for updates...');
            await updateService.checkForUpdatesAndShow();
            console.log('✅ Update check completed');
        } catch (error) {
            console.warn('Update check failed:', error);
            // Non-critical, don't throw
        }
    }

    /**
     * Reset initialization state (useful for testing)
     */
    reset(): void {
        this.initializationPromise = null;
    }
}

export const appInitializer = AppInitializer.getInstance();