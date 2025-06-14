import { create } from 'zustand';

export type TimeDuration = 5 | 10 | 15 | 20 | 25;

interface Settings {
    notifications: boolean;
    soundEffects: boolean;
    vibration: boolean;
    darkMode: boolean;
    autoBreak: boolean;
    focusReminders: boolean;
    weeklyReports: boolean;
    dataSync: boolean;
    timeDuration: TimeDuration;
}

interface SettingsState {
    settings: Settings;
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
    notifications: true,
    soundEffects: false,
    vibration: true,
    darkMode: true,
    autoBreak: false,
    focusReminders: true,
    weeklyReports: true,
    dataSync: false,
    timeDuration: 25,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
    settings: initialSettings,
    
    toggleSetting: (key) => set((state) => ({
        settings: {
            ...state.settings,
            [key]: !state.settings[key]
        }
    })),

    setTimeDuration: (duration) => set((state) => ({
        settings: {
            ...state.settings,
            timeDuration: duration
        }
    })),

    resetSettings: () => set({ settings: initialSettings }),

    exportData: () => {
        // TODO: Implement data export logic
        console.log('Exporting data...');
    },

    deleteData: () => {
        // TODO: Implement data deletion logic
        console.log('Deleting data...');
    },

    rateApp: () => {
        // TODO: Implement app rating logic
        console.log('Opening app store...');
    },

    openSupport: () => {
        // TODO: Implement support page opening logic
        console.log('Opening support page...');
    },

    openPrivacy: () => {
        // TODO: Implement privacy policy opening logic
        console.log('Opening privacy policy...');
    },

    openTerms: () => {
        // TODO: Implement terms of service opening logic
        console.log('Opening terms of service...');
    },

    openTheme: () => {
        // TODO: Implement theme settings opening logic
        console.log('Opening theme settings...');
    },

    openStorage: () => {
        // TODO: Implement storage settings opening logic
        console.log('Opening storage settings...');
    },

    openFeedback: () => {
        // TODO: Implement feedback form opening logic
        console.log('Opening feedback form...');
    },
})); 