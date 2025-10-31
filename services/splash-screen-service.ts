/**
 * ============================================================================
 * SPLASH SCREEN SERVICE
 * ============================================================================
 *
 * This service manages the app's splash screen lifecycle, ensuring a smooth
 * transition from the native splash screen to the app content. It coordinates
 * all initialization tasks and provides a unified loading experience.
 *
 * Key Features:
 * - Programmatic splash screen control
 * - Coordinated service initialization
 * - Smooth transition to app content
 * - Error handling and recovery
 * - Performance optimization
 *
 * @author Flowzy Team
 * @version 1.0.0
 */

import * as SplashScreen from 'expo-splash-screen';
import { localDatabaseService } from './local-database-service';
import { optionalSyncService } from './optional-sync-service';
import { notificationService } from './notification-service';
import { backgroundMetronomeService } from './background-metronome-service';
import { useAuthStore } from '@/stores/auth-store';
import { useSettingsStore } from '@/stores/local-settings-store';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Represents initialization task status
 */
interface InitializationTask {
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    error?: string;
    startTime?: number;
    endTime?: number;
}

/**
 * Represents splash screen configuration
 */
interface SplashScreenConfig {
    minimumDisplayTime: number; // Minimum time to show splash screen (ms)
    maximumDisplayTime: number; // Maximum time to show splash screen (ms)
    enableProgressIndicator: boolean;
    enableTaskLogging: boolean;
}

/**
 * Represents initialization progress
 */
interface InitializationProgress {
    totalTasks: number;
    completedTasks: number;
    currentTask?: string;
    progress: number; // 0-100
    isComplete: boolean;
    hasError: boolean;
}

// ============================================================================
// SPLASH SCREEN SERVICE CLASS
// ============================================================================

/**
 * Splash Screen Service
 *
 * Manages the app's splash screen lifecycle and coordinates all initialization
 * tasks to provide a smooth user experience. Handles service initialization,
 * error recovery, and performance optimization.
 *
 * @class SplashScreenService
 */
class SplashScreenService {
    private isInitialized = false;
    private isSplashScreenVisible = true;
    private config: SplashScreenConfig = {
        minimumDisplayTime: 1500, // 1.5 seconds minimum
        maximumDisplayTime: 10000, // 10 seconds maximum
        enableProgressIndicator: true,
        enableTaskLogging: true,
    };
    private tasks: Map<string, InitializationTask> = new Map();
    private startTime = 0;
    private initializationPromise: Promise<void> | null = null;

    // ========================================================================
    // INITIALIZATION & LIFECYCLE
    // ========================================================================

    /**
     * Initializes the splash screen service
     *
     * Sets up the splash screen and begins the initialization process.
     * This method should be called as early as possible in the app lifecycle.
     *
     * @returns {Promise<void>}
     *
     * @example
     * await splashScreenService.initialize();
     */
    async initialize(): Promise<void> {
        try {
            if (this.isInitialized) return;

            // Prevent the splash screen from auto-hiding
            await SplashScreen.preventAutoHideAsync();

            this.startTime = Date.now();
            this.isInitialized = true;

            // Start initialization process
            this.initializationPromise = this._performInitialization();

            console.log('Splash screen service initialized');
        } catch (error) {
            console.error('Failed to initialize splash screen service:', error);
            // Hide splash screen even if initialization fails
            await this.hideSplashScreen();
        }
    }

    /**
     * Hides the splash screen when initialization is complete
     *
     * Ensures minimum display time and smooth transition to app content.
     * This method should be called when all initialization tasks are complete.
     *
     * @returns {Promise<void>}
     *
     * @example
     * await splashScreenService.hideSplashScreen();
     */
    async hideSplashScreen(): Promise<void> {
        try {
            if (!this.isSplashScreenVisible) return;

            // Ensure minimum display time
            const elapsedTime = Date.now() - this.startTime;
            const remainingTime = Math.max(0, this.config.minimumDisplayTime - elapsedTime);

            if (remainingTime > 0) {
                await new Promise((resolve) => setTimeout(resolve, remainingTime));
            }

            // Hide the splash screen
            await SplashScreen.hideAsync();
            this.isSplashScreenVisible = false;

            console.log('Splash screen hidden');
        } catch (error) {
            console.error('Failed to hide splash screen:', error);
        }
    }

    /**
     * Gets the current initialization progress
     *
     * @returns {InitializationProgress} Current progress information
     *
     * @example
     * const progress = splashScreenService.getProgress();
     * console.log(`Progress: ${progress.progress}%`);
     */
    getProgress(): InitializationProgress {
        const totalTasks = this.tasks.size;
        const completedTasks = Array.from(this.tasks.values()).filter(
            (task) => task.status === 'completed',
        ).length;
        const failedTasks = Array.from(this.tasks.values()).filter(
            (task) => task.status === 'failed',
        ).length;
        const currentTask = Array.from(this.tasks.values()).find(
            (task) => task.status === 'running',
        );

        return {
            totalTasks,
            completedTasks,
            currentTask: currentTask?.name,
            progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            isComplete: completedTasks === totalTasks && totalTasks > 0,
            hasError: failedTasks > 0,
        };
    }

    /**
     * Checks if initialization is complete
     *
     * @returns {boolean} True if all tasks are completed
     */
    isInitializationComplete(): boolean {
        return this.getProgress().isComplete;
    }

    /**
     * Waits for initialization to complete
     *
     * @returns {Promise<void>}
     *
     * @example
     * await splashScreenService.waitForInitialization();
     */
    async waitForInitialization(): Promise<void> {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
    }

    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================

    /**
     * Performs all initialization tasks
     * @private
     */
    private async _performInitialization(): Promise<void> {
        try {
            // Define initialization tasks
            const tasks = [
                { name: 'fonts', fn: this._loadFonts.bind(this) },
                { name: 'database', fn: this._initializeDatabase.bind(this) },
                { name: 'auth', fn: this._initializeAuth.bind(this) },
                { name: 'notifications', fn: this._initializeNotifications.bind(this) },
                { name: 'metronome', fn: this._initializeMetronome.bind(this) },
                { name: 'sync', fn: this._initializeSync.bind(this) },
                { name: 'settings', fn: this._loadSettings.bind(this) },
            ];

            // Initialize all tasks
            for (const task of tasks) {
                this.tasks.set(task.name, {
                    name: task.name,
                    status: 'pending',
                });
            }

            // Execute tasks in parallel for better performance
            const taskPromises = tasks.map((task) => this._executeTask(task.name, task.fn));
            await Promise.allSettled(taskPromises);

            // Check if any critical tasks failed
            const criticalTasks = ['fonts', 'database', 'auth'];
            const failedCriticalTasks = criticalTasks.filter(
                (taskName) => this.tasks.get(taskName)?.status === 'failed',
            );

            if (failedCriticalTasks.length > 0) {
                throw new Error(
                    `Critical initialization failed: ${failedCriticalTasks.join(', ')}`,
                );
            }

            // Hide splash screen when complete
            await this.hideSplashScreen();

            console.log('All initialization tasks completed');
        } catch (error) {
            console.error('Initialization failed:', error);
            // Still hide splash screen to prevent app from being stuck
            await this.hideSplashScreen();
            throw error;
        }
    }

    /**
     * Executes a single initialization task
     * @private
     */
    private async _executeTask(name: string, taskFn: () => Promise<void>): Promise<void> {
        const task = this.tasks.get(name);
        if (!task) return;

        try {
            task.status = 'running';
            task.startTime = Date.now();

            if (this.config.enableTaskLogging) {
                console.log(`Starting initialization task: ${name}`);
            }

            await taskFn();

            task.status = 'completed';
            task.endTime = Date.now();

            if (this.config.enableTaskLogging) {
                const duration = task.endTime - task.startTime!;
                console.log(`Completed initialization task: ${name} (${duration}ms)`);
            }
        } catch (error) {
            task.status = 'failed';
            task.error = error instanceof Error ? error.message : 'Unknown error';
            task.endTime = Date.now();

            console.error(`Failed initialization task: ${name}`, error);
        }
    }

    /**
     * Loads app fonts
     * @private
     */
    private async _loadFonts(): Promise<void> {
        // Font loading is handled by useFonts in RootLayout
        // This task is just for coordination
        return Promise.resolve();
    }

    /**
     * Initializes the local database
     * @private
     */
    private async _initializeDatabase(): Promise<void> {
        await localDatabaseService.initialize();
    }

    /**
     * Initializes authentication
     * @private
     */
    private async _initializeAuth(): Promise<void> {
        const { initializeAuth } = useAuthStore.getState();
        initializeAuth();
    }

    /**
     * Initializes notification service
     * @private
     */
    private async _initializeNotifications(): Promise<void> {
        await notificationService.initialize();
    }

    /**
     * Initializes background metronome service
     * @private
     */
    private async _initializeMetronome(): Promise<void> {
        await backgroundMetronomeService.initialize();
    }

    /**
     * Initializes optional sync service
     * @private
     */
    private async _initializeSync(): Promise<void> {
        await optionalSyncService.initialize();
    }

    /**
     * Loads user settings
     * @private
     */
    private async _loadSettings(): Promise<void> {
        await useSettingsStore.getState().loadSettings();
    }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

/**
 * Singleton instance of the Splash Screen Service
 *
 * This ensures only one splash screen service instance is maintained throughout
 * the application lifecycle and provides a consistent interface for
 * all splash screen operations.
 *
 * @example
 * import { splashScreenService } from '@/services/splash-screen-service';
 *
 * // Initialize splash screen
 * await splashScreenService.initialize();
 *
 * // Wait for initialization
 * await splashScreenService.waitForInitialization();
 *
 * // Get progress
 * const progress = splashScreenService.getProgress();
 */
export const splashScreenService = new SplashScreenService();
