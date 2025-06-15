import { create } from 'zustand';
import { settingsService } from '../services/database';

export type TimeDuration = 1 | 5 | 10 | 15 | 20 | 25;

interface Settings {
    timeDuration: TimeDuration;
    soundEffects: boolean;
    notifications: boolean;
    darkMode: boolean;
    autoBreak: boolean;
    focusReminders: boolean;
    weeklyReports: boolean;
    dataSync: boolean;
}

interface SettingsState extends Settings {
    isLoading: boolean;
    error: string | null;
    loadSettings: (userId: string) => Promise<void>;
    updateSettings: (userId: string, settings: Partial<Settings>) => Promise<void>;
    toggleSetting: (key: keyof Settings) => void;
    setTimeDuration: (duration: TimeDuration) => void;
    resetSettings: () => void;
    exportData: () => void;
    deleteData: () => void;
    rateApp: () => void;
    openSupport: () => void;
    openPrivacy: () => void;
    openTerms: () => void;
    openTheme: () => void;
    openStorage: () => void;
    openFeedback: () => void;
}

const initialSettings: Settings = {
    timeDuration: 25,
    soundEffects: true,
    notifications: true,
    darkMode: false,
    autoBreak: false,
    focusReminders: true,
    weeklyReports: true,
    dataSync: true,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
    ...initialSettings,
    isLoading: false,
    error: null,

    toggleSetting: (key: keyof Settings) => {
        set((state) => ({
            [key]: !state[key],
        }));
    },

    setTimeDuration: (duration: TimeDuration) => {
        set({ timeDuration: duration });
    },

    resetSettings: () => {
        set(initialSettings);
    },

    exportData: () => {
        console.log('Exporting data...');
    },

    deleteData: () => {
        console.log('Deleting data...');
    },

    rateApp: () => {
        console.log('Opening app store...');
    },

    openSupport: () => {
        console.log('Opening support...');
    },

    openPrivacy: () => {
        console.log('Opening privacy policy...');
    },

    openTerms: () => {
        console.log('Opening terms of service...');
    },

    openTheme: () => {
        console.log('Opening theme settings...');
    },

    openStorage: () => {
        console.log('Opening storage settings...');
    },

    openFeedback: () => {
        console.log('Opening feedback form...');
    },

    loadSettings: async (userId: string) => {
        try {
            set({ isLoading: true, error: null });
            const settings = await settingsService.getSettings(userId);
            
            if (settings) {
                set({
                    timeDuration: settings.time_duration as TimeDuration,
                    soundEffects: settings.sound_effects,
                    notifications: settings.notifications,
                    darkMode: settings.dark_mode,
                    autoBreak: settings.auto_break,
                    focusReminders: settings.focus_reminders,
                    weeklyReports: settings.weekly_reports,
                    dataSync: settings.data_sync,
                });
            }
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to load settings' });
        } finally {
            set({ isLoading: false });
        }
    },

    updateSettings: async (userId: string, settings: Partial<Settings>) => {
        try {
            set({ isLoading: true, error: null });
            
            // Update local state immediately for better UX
            set(settings);
            
            // Convert settings to database format
            const dbSettings = {
                time_duration: settings.timeDuration,
                sound_effects: settings.soundEffects,
                notifications: settings.notifications,
                dark_mode: settings.darkMode,
                auto_break: settings.autoBreak,
                focus_reminders: settings.focusReminders,
                weekly_reports: settings.weeklyReports,
                data_sync: settings.dataSync,
            };

            await settingsService.updateSettings(userId, dbSettings);
        } catch (error) {
            // Revert local state on error
            set(get());
            set({ error: error instanceof Error ? error.message : 'Failed to update settings' });
        } finally {
            set({ isLoading: false });
        }
    },
}));
