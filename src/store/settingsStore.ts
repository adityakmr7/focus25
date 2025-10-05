import { create } from 'zustand';
import { databaseService } from '../data/database';
import { usePomodoroStore } from './pomodoroStore';
import { Linking } from 'react-native';
import { APP_CONFIG } from '../config';

export type TimeDuration = 1 | 5 | 10 | 15 | 20 | 25;
export type BreakDuration = 1 | 5 | 10 | 15 | 20 | 25;

interface Settings {
  timeDuration: TimeDuration;
  breakDuration: BreakDuration;
  soundEffects: boolean;
  notifications: boolean;
  darkMode: boolean;
  autoBreak: boolean;
  focusReminders: boolean;
  weeklyReports: boolean;
  dataSync: boolean;
  showStatistics: boolean;
  notificationStatus: string | null;
}

interface SettingsState extends Settings {
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  initializeStore: () => Promise<void>;
  toggleSetting: (key: keyof Settings) => Promise<void>;
  setTimeDuration: (duration: TimeDuration) => Promise<void>;
  setBreakDuration: (duration: BreakDuration) => Promise<void>;
  resetSettings: () => Promise<void>;
  exportData: () => Promise<string>;
  deleteData: () => Promise<void>;
  rateApp: () => void;
  openSupport: () => void;
  openPrivacy: () => void;
  openTerms: () => void;
  openTheme: () => void;
  openStorage: () => void;
  openFeedback: () => void;
  updateNotification: (status: string) => Promise<void>;
  syncWithDatabase: () => Promise<void>;
}

const initialSettings: Settings = {
  timeDuration: 25,
  breakDuration: 5,
  soundEffects: true,
  notifications: true,
  darkMode: false,
  autoBreak: false,
  focusReminders: true,
  weeklyReports: true,
  dataSync: false,
  showStatistics: false,
  notificationStatus: null,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...initialSettings,
  isLoading: false,
  error: null,
  isInitialized: false,

  initializeStore: async () => {
    if (get().isInitialized) return;

    try {
      set({ isLoading: true, error: null });
      const savedSettings = await databaseService.getSettings();

      set({
        ...savedSettings,
        isInitialized: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to initialize settings store:', error);
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to initialize settings',
        isInitialized: true,
        isLoading: false,
      });
    }
  },

  setBreakDuration: async duration => {
    try {
      const pomodoroStore = usePomodoroStore.getState();
      if (!pomodoroStore.timer.isRunning) {
        pomodoroStore.setBreakDuration(duration);
        set({ breakDuration: duration });
      }

      await get().syncWithDatabase();
    } catch (error) {
      console.error('Failed to set break duration:', error);
      set({
        error:
          error instanceof Error ? error.message : 'Failed to update settings',
      });
    }
  },

  toggleSetting: async (key: keyof Settings) => {
    try {
      set(state => ({
        [key]: !state[key],
      }));
      await get().syncWithDatabase();
    } catch (error) {
      console.error('Failed to toggle setting:', error);
      set({
        error:
          error instanceof Error ? error.message : 'Failed to update settings',
      });
    }
  },

  setTimeDuration: async (duration: TimeDuration) => {
    try {
      const pomodoroStore = usePomodoroStore.getState();
      if (!pomodoroStore.timer.isRunning) {
        pomodoroStore.setWorkDuration(duration);
        set({ timeDuration: duration });
      }
      await get().syncWithDatabase();
    } catch (error) {
      console.error('Failed to set time duration:', error);
      set({
        error:
          error instanceof Error ? error.message : 'Failed to update settings',
      });
    }
  },

  resetSettings: async () => {
    try {
      set({ ...initialSettings, isInitialized: true });
      await get().syncWithDatabase();
    } catch (error) {
      console.error('Failed to reset settings:', error);
      set({
        error:
          error instanceof Error ? error.message : 'Failed to reset settings',
      });
    }
  },

  exportData: async () => {
    try {
      return await databaseService.exportAllData();
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  },

  deleteData: async () => {
    try {
      await databaseService.clearAllData();
      set({ ...initialSettings, isInitialized: true });
    } catch (error) {
      console.error('Failed to delete data:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete data',
      });
    }
  },

  rateApp: async () => {
    await Linking.openURL(
      `https://apps.apple.com/app/apple-store/id${APP_CONFIG.APP_ID}?action=write-review`
    );
  },

  openSupport: async () => {
    await Linking.openURL(APP_CONFIG.HELP_URL);
  },

  openPrivacy: async () => {
    await Linking.openURL(APP_CONFIG.PRIVACY_POLICY_URL);
  },

  openTerms: async () => {
    await Linking.openURL(APP_CONFIG.TERM_CONDITIONS_URL);
  },

  openTheme: () => {
    console.log('Opening theme settings...');
  },

  openStorage: () => {
    console.log('Opening storage settings...');
  },

  openFeedback: async () => {
    await Linking.openURL(APP_CONFIG.FEEDBACK_FORM_URL);
  },

  updateNotification: async (status: string) => {
    try {
      set({ notificationStatus: status });
      await get().syncWithDatabase();
    } catch (error) {
      console.error('Failed to update notification status:', error);
      set({
        error:
          error instanceof Error ? error.message : 'Failed to update settings',
      });
    }
  },

  syncWithDatabase: async () => {
    try {
      const state = get();
      const settings = {
        timeDuration: state.timeDuration,
        breakDuration: state.breakDuration,
        soundEffects: state.soundEffects,
        notifications: state.notifications,
        darkMode: state.darkMode,
        autoBreak: state.autoBreak,
        focusReminders: state.focusReminders,
        weeklyReports: state.weeklyReports,
        dataSync: state.dataSync,
        showStatistics: state.showStatistics,
        notificationStatus: state.notificationStatus,
      };

      await databaseService.saveSettings(settings);
    } catch (error) {
      console.error('Failed to sync settings with database:', error);
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to sync with database',
      });
    }
  },
}));
