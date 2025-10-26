import { localDatabaseService, UserSettings } from '@/services/local-database-service';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SettingsState {
    // Theme settings
    themeMode: 'light' | 'dark' | 'system';
    setThemeMode: (themeMode: 'light' | 'dark' | 'system') => void;

    // Focus settings
    focusDuration: number;
    breakDuration: number;
    soundEffects: boolean;
    metronome: boolean;
    setFocusDuration: (focusDuration: number) => void;
    setBreakDuration: (breakDuration: number) => void;
    setSoundEffects: (soundEffects: boolean) => void;
    setMetronome: (metronome: boolean) => void;

    // App settings
    syncWithCloud: boolean;
    textSize: 'small' | 'medium' | 'large';
    notifications: boolean;
    setSyncWithCloud: (syncWithCloud: boolean) => void;
    setTextSize: (textSize: 'small' | 'medium' | 'large') => void;
    setNotifications: (notifications: boolean) => void;

    // Account settings
    userName: string;
    userEmail: string;
    isAccountBackedUp: boolean;
    onboardingCompleted: boolean;
    setUserName: (userName: string) => void;
    setUserEmail: (userEmail: string) => void;
    setAccountBackedUp: (isAccountBackedUp: boolean) => void;
    setOnboardingCompleted: (onboardingCompleted: boolean) => void;

    // Device settings
    deviceName: string;
    setDeviceName: (deviceName: string) => void;

    // Database operations
    loadSettings: () => Promise<void>;
    saveSettings: () => Promise<void>;

    // Reset all settings
    resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            // Theme settings
            themeMode: 'system',
            setThemeMode: (themeMode) => set({ themeMode }),

            // Focus settings
            focusDuration: 25,
            breakDuration: 5,
            soundEffects: true,
            metronome: false,
            setFocusDuration: (focusDuration) => set({ focusDuration }),
            setBreakDuration: (breakDuration) => set({ breakDuration }),
            setSoundEffects: (soundEffects) => set({ soundEffects }),
            setMetronome: (metronome) => set({ metronome }),

            // App settings
            syncWithCloud: false,
            textSize: 'medium',
            notifications: true,
            setSyncWithCloud: (syncWithCloud) => set({ syncWithCloud }),
            setTextSize: (textSize) => set({ textSize }),
            setNotifications: (notifications) => set({ notifications }),

            // Account settings
            userName: 'User',
            userEmail: '',
            isAccountBackedUp: false,
            onboardingCompleted: false,
            setUserName: (userName) => set({ userName }),
            setUserEmail: (userEmail) => set({ userEmail }),
            setAccountBackedUp: (isAccountBackedUp) => set({ isAccountBackedUp }),
            setOnboardingCompleted: (onboardingCompleted) => set({ onboardingCompleted }),

            // Device settings
            deviceName: 'Focus25 Device',
            setDeviceName: (deviceName) => set({ deviceName }),

            // Database operations
            loadSettings: async () => {
                try {
                    const settings = await localDatabaseService.getSettings();
                    if (settings) {
                        set({
                            focusDuration: settings.focusDuration,
                            breakDuration: settings.breakDuration,
                            soundEffects: settings.soundEffects,
                            metronome: settings.metronome,
                            themeMode: settings.theme as 'light' | 'dark' | 'system',
                            notifications: settings.notifications,
                            userName: settings.userName || 'User',
                            userEmail: settings.userEmail || '',
                            onboardingCompleted: settings.onboardingCompleted,
                            syncWithCloud: settings.syncEnabled,
                        });
                    }
                } catch (error) {
                    console.error('Failed to load settings from database:', error);
                }
            },

            saveSettings: async () => {
                try {
                    const state = get();
                    await localDatabaseService.updateSettings({
                        focusDuration: state.focusDuration,
                        breakDuration: state.breakDuration,
                        soundEffects: state.soundEffects,
                        metronome: state.metronome,
                        theme: state.themeMode,
                        notifications: state.notifications,
                        userName: state.userName,
                        userEmail: state.userEmail,
                        onboardingCompleted: state.onboardingCompleted,
                        syncEnabled: state.syncWithCloud,
                        lastSyncAt: state.syncWithCloud ? new Date().toISOString() : null,
                    });
                } catch (error) {
                    console.error('Failed to save settings to database:', error);
                }
            },

            // Reset all settings
            resetSettings: () =>
                set({
                    themeMode: 'system',
                    focusDuration: 25,
                    breakDuration: 5,
                    soundEffects: true,
                    metronome: false,
                    syncWithCloud: false,
                    textSize: 'medium',
                    notifications: true,
                    userName: 'User',
                    userEmail: '',
                    isAccountBackedUp: false,
                    onboardingCompleted: false,
                    deviceName: 'Focus25 Device',
                }),
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                // Only persist UI-related settings, not database settings
                themeMode: state.themeMode,
                textSize: state.textSize,
                deviceName: state.deviceName,
                isAccountBackedUp: state.isAccountBackedUp,
            }),
        },
    ),
);
