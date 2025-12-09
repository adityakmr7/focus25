import { localDatabaseService } from '@/services/local-database-service';
import { errorHandlingService } from '@/services/error-handling-service';
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
    metronomeVolume: number;
    setFocusDuration: (focusDuration: number) => void;
    setBreakDuration: (breakDuration: number) => void;
    setSoundEffects: (soundEffects: boolean) => void;
    setMetronome: (metronome: boolean) => void;
    setMetronomeVolume: (volume: number) => void;

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
    hasProAccess: boolean;
    setUserName: (userName: string) => void;
    setUserEmail: (userEmail: string) => void;
    setAccountBackedUp: (isAccountBackedUp: boolean) => void;
    setOnboardingCompleted: (onboardingCompleted: boolean) => void;
    setHasProAccess: (hasProAccess: boolean) => void;

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
            setThemeMode: (themeMode) => {
                set({ themeMode });
                get().saveSettings();
            },

            // Focus settings
            focusDuration: 25,
            breakDuration: 5,
            soundEffects: true,
            metronome: false,
            metronomeVolume: 0.5,
            setFocusDuration: (focusDuration) => {
                set({ focusDuration });
                get().saveSettings();
            },
            setBreakDuration: (breakDuration) => {
                set({ breakDuration });
                get().saveSettings();
            },
            setSoundEffects: (soundEffects) => {
                set({ soundEffects });
                get().saveSettings();
            },
            setMetronome: (metronome) => {
                set({ metronome });
                get().saveSettings();
            },
            setMetronomeVolume: (volume) => {
                set({ metronomeVolume: volume });
                // metronomeVolume is UI-only; no DB persistence required
            },

            // App settings
            syncWithCloud: false,
            textSize: 'medium',
            notifications: true,
            setSyncWithCloud: (syncWithCloud) => {
                set({ syncWithCloud });
                get().saveSettings();
            },
            setTextSize: (textSize) => {
                set({ textSize });
                get().saveSettings();
            },
            setNotifications: (notifications) => {
                set({ notifications });
                get().saveSettings();
            },

            // Account settings
            userName: '',
            userEmail: '',
            isAccountBackedUp: false,
            onboardingCompleted: false,
            hasProAccess: false,
            setUserName: (userName) => {
                set({ userName });
                get().saveSettings();
            },
            setUserEmail: (userEmail) => {
                set({ userEmail });
                get().saveSettings();
            },
            setAccountBackedUp: (isAccountBackedUp) => {
                set({ isAccountBackedUp });
                get().saveSettings();
            },
            setOnboardingCompleted: (onboardingCompleted) => {
                set({ onboardingCompleted });
                get().saveSettings();
            },
            setHasProAccess: (hasProAccess) => {
                set({ hasProAccess });
            },

            // Device settings
            deviceName: 'Flowzy Device',
            setDeviceName: (deviceName) => {
                set({ deviceName });
                get().saveSettings();
            },

            // Database operations
            loadSettings: async () => {
                try {
                    // Wait for database initialization
                    await localDatabaseService.waitForInitialization();

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
                    // Silently handle loading errors - use defaults from persisted state
                    errorHandlingService.processError(error, { action: 'loadSettings' });
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
                    // Silently handle save errors - settings are persisted in AsyncStorage anyway
                    errorHandlingService.processError(error, { action: 'saveSettings' });
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
                    metronomeVolume: 0.5,
                    syncWithCloud: false,
                    textSize: 'medium',
                    notifications: true,
                    userName: 'User',
                    userEmail: '',
                    isAccountBackedUp: false,
                    onboardingCompleted: false,
                    hasProAccess: false,
                    deviceName: 'Flowzy Device',
                }),
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                // Only persist UI-related settings, not database settings
                themeMode: state.themeMode,
                textSize: state.textSize,
                metronomeVolume: state.metronomeVolume,
                deviceName: state.deviceName,
                isAccountBackedUp: state.isAccountBackedUp,
                userName: state.userName,
                userEmail: state.userEmail,
                syncWithCloud: state.syncWithCloud,
                onboardingCompleted: state.onboardingCompleted,
                hasProAccess: state.hasProAccess,
            }),
        },
    ),
);
