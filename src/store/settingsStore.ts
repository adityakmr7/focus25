import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { settingsStorage, createMMKVStorage } from '../services/storage';

/**
 * Settings Store Types
 * 
 * Defines the available time durations and break durations
 * that users can select for their focus sessions.
 */
export type TimeDuration = 1 | 5 | 10 | 15 | 20 | 25;
export type BreakDuration = 1 | 5 | 10 | 15 | 20 | 25;

/**
 * Settings Interface
 * 
 * Contains all user preferences and app settings
 */
interface Settings {
    // Timer Settings
    timeDuration: TimeDuration;           // Focus session duration in minutes
    breakDuration: BreakDuration;         // Break duration in minutes
    
    // Audio & Notifications
    soundEffects: boolean;                // Play sound effects during sessions
    notifications: boolean;               // Enable push notifications
    notificationStatus: string | null;    // Current notification permission status
    
    // Session Behavior
    autoBreak: boolean;                   // Automatically start breaks
    focusReminders: boolean;              // Send focus session reminders
    
    // Reporting & Analytics
    weeklyReports: boolean;               // Send weekly progress reports
    dataSync: boolean;                    // Sync data across devices
    
    // UI Preferences
    darkMode: boolean;                    // Enable dark mode theme
}

/**
 * Settings Store State Interface
 * 
 * Extends Settings with store actions and loading states
 */
interface SettingsState extends Settings {
    // Loading States
    isLoading: boolean;                   // Indicates if settings are being loaded/saved
    error: string | null;                 // Error message if operations fail
    
    // Core Actions
    toggleSetting: (key: keyof Settings) => void;           // Toggle boolean settings
    setTimeDuration: (duration: TimeDuration) => void;      // Set focus duration
    setBreakDuration: (duration: BreakDuration) => void;    // Set break duration
    updateNotification: (status: string) => void;           // Update notification status
    resetSettings: () => void;                              // Reset to defaults
    
    // Data Management Actions
    exportData: () => string;                               // Export settings as JSON
    importData: (data: string) => boolean;                  // Import settings from JSON
    deleteData: () => void;                                 // Clear all settings
    getStorageInfo: () => { size: number; keys: string[] }; // Get storage information
    
    // External Actions (placeholders for future implementation)
    rateApp: () => void;                                    // Open app store rating
    openSupport: () => void;                                // Open support page
    openPrivacy: () => void;                                // Open privacy policy
    openTerms: () => void;                                  // Open terms of service
    openTheme: () => void;                                  // Open theme settings
    openStorage: () => void;                                // Open storage settings
    openFeedback: () => void;                               // Open feedback form
}

/**
 * Default Settings Configuration
 * 
 * These are the initial values when the app is first installed
 */
const initialSettings: Settings = {
    // Timer defaults - 25 minute focus, 5 minute break (Pomodoro technique)
    timeDuration: 25,
    breakDuration: 5,
    
    // Audio & notifications enabled by default for better user engagement
    soundEffects: true,
    notifications: true,
    notificationStatus: null,
    
    // Conservative defaults for session behavior
    autoBreak: false,                     // Let users manually start breaks
    focusReminders: true,                 // Help users stay consistent
    
    // Analytics enabled by default to provide insights
    weeklyReports: true,
    dataSync: true,
    
    // Light mode by default (will respect system preference in theme store)
    darkMode: false,
};

/**
 * Settings Store Implementation
 * 
 * Uses Zustand with MMKV persistence for fast, encrypted storage
 */
export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            // Initialize with default settings
            ...initialSettings,
            isLoading: false,
            error: null,

            /**
             * Toggle Boolean Settings
             * 
             * Safely toggles any boolean setting and clears any existing errors
             */
            toggleSetting: (key: keyof Settings) => {
                set((state) => {
                    // Type guard to ensure we're only toggling boolean values
                    const currentValue = state[key];
                    if (typeof currentValue === 'boolean') {
                        return {
                            [key]: !currentValue,
                            error: null, // Clear any previous errors
                        };
                    }
                    return state;
                });
            },

            /**
             * Set Focus Duration
             * 
             * Updates the focus session duration and clears errors
             */
            setTimeDuration: (duration: TimeDuration) => {
                set({ 
                    timeDuration: duration,
                    error: null 
                });
            },

            /**
             * Set Break Duration
             * 
             * Updates the break duration and clears errors
             */
            setBreakDuration: (duration: BreakDuration) => {
                set({ 
                    breakDuration: duration,
                    error: null 
                });
            },

            /**
             * Update Notification Status
             * 
             * Updates the current notification permission status
             */
            updateNotification: (status: string) => {
                set({ 
                    notificationStatus: status,
                    error: null 
                });
            },

            /**
             * Reset Settings to Defaults
             * 
             * Restores all settings to their initial values
             */
            resetSettings: () => {
                set({
                    ...initialSettings,
                    error: null
                });
            },

            /**
             * Export Settings Data
             * 
             * Returns current settings as a JSON string for backup/sharing
             */
            exportData: (): string => {
                try {
                    const currentState = get();
                    const exportData = {
                        settings: {
                            timeDuration: currentState.timeDuration,
                            breakDuration: currentState.breakDuration,
                            soundEffects: currentState.soundEffects,
                            notifications: currentState.notifications,
                            autoBreak: currentState.autoBreak,
                            focusReminders: currentState.focusReminders,
                            weeklyReports: currentState.weeklyReports,
                            dataSync: currentState.dataSync,
                            darkMode: currentState.darkMode,
                        },
                        exportDate: new Date().toISOString(),
                        version: '1.0.0'
                    };
                    
                    return JSON.stringify(exportData, null, 2);
                } catch (error) {
                    console.error('Error exporting settings:', error);
                    set({ error: 'Failed to export settings data' });
                    return '{}';
                }
            },

            /**
             * Import Settings Data
             * 
             * Imports settings from a JSON string, validates the data
             */
            importData: (data: string): boolean => {
                try {
                    const importedData = JSON.parse(data);
                    
                    // Validate the imported data structure
                    if (!importedData.settings) {
                        throw new Error('Invalid data format: missing settings');
                    }
                    
                    const settings = importedData.settings;
                    
                    // Validate and apply each setting with type checking
                    const updates: Partial<Settings> = {};
                    
                    if (typeof settings.timeDuration === 'number' && 
                        [1, 5, 10, 15, 20, 25].includes(settings.timeDuration)) {
                        updates.timeDuration = settings.timeDuration;
                    }
                    
                    if (typeof settings.breakDuration === 'number' && 
                        [1, 5, 10, 15, 20, 25].includes(settings.breakDuration)) {
                        updates.breakDuration = settings.breakDuration;
                    }
                    
                    // Import boolean settings with validation
                    const booleanSettings = [
                        'soundEffects', 'notifications', 'autoBreak', 
                        'focusReminders', 'weeklyReports', 'dataSync', 'darkMode'
                    ];
                    
                    booleanSettings.forEach(key => {
                        if (typeof settings[key] === 'boolean') {
                            updates[key as keyof Settings] = settings[key];
                        }
                    });
                    
                    // Apply the validated updates
                    set({
                        ...updates,
                        error: null
                    });
                    
                    return true;
                } catch (error) {
                    console.error('Error importing settings:', error);
                    set({ error: 'Failed to import settings data' });
                    return false;
                }
            },

            /**
             * Delete All Settings Data
             * 
             * Clears all settings and resets to defaults
             */
            deleteData: () => {
                try {
                    // Reset to initial settings
                    set({
                        ...initialSettings,
                        error: null
                    });
                    
                    console.log('Settings data cleared successfully');
                } catch (error) {
                    console.error('Error deleting settings:', error);
                    set({ error: 'Failed to delete settings data' });
                }
            },

            /**
             * Get Storage Information
             * 
             * Returns information about the settings storage usage
             */
            getStorageInfo: () => {
                try {
                    return {
                        size: settingsStorage.size,
                        keys: settingsStorage.getAllKeys()
                    };
                } catch (error) {
                    console.error('Error getting storage info:', error);
                    return { size: 0, keys: [] };
                }
            },

            // External action placeholders - these would integrate with platform-specific APIs
            rateApp: () => {
                console.log('Opening app store for rating...');
                // TODO: Implement platform-specific app store rating
            },

            openSupport: () => {
                console.log('Opening support page...');
                // TODO: Implement support page navigation or email
            },

            openPrivacy: () => {
                console.log('Opening privacy policy...');
                // TODO: Implement privacy policy navigation
            },

            openTerms: () => {
                console.log('Opening terms of service...');
                // TODO: Implement terms of service navigation
            },

            openTheme: () => {
                console.log('Opening theme settings...');
                // TODO: Implement theme settings navigation
            },

            openStorage: () => {
                console.log('Opening storage settings...');
                // TODO: Implement storage management interface
            },

            openFeedback: () => {
                console.log('Opening feedback form...');
                // TODO: Implement feedback form or email
            },
        }),
        {
            name: 'settings-storage',                    // Storage key name
            storage: createJSONStorage(() => createMMKVStorage(settingsStorage)), // Use MMKV instead of AsyncStorage
            
            /**
             * Rehydration Handler
             * 
             * Called when the store is rehydrated from storage on app startup
             */
            onRehydrateStorage: () => (state) => {
                if (state) {
                    console.log('Settings rehydrated successfully');
                    // Clear any loading states after rehydration
                    state.isLoading = false;
                    state.error = null;
                }
            },
        }
    )
);