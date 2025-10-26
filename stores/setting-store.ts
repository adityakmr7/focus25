import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface SettingsState {
  // Theme settings
  themeMode: "light" | "dark" | "system";
  setThemeMode: (themeMode: "light" | "dark" | "system") => void;

  // Focus settings
  focusDuration: number;
  breakDuration: number;
  soundEffects: boolean;
  metronome: boolean;
  setFocusDuration: (duration: number) => void;
  setBreakDuration: (duration: number) => void;
  setSoundEffects: (enabled: boolean) => void;
  setMetronome: (enabled: boolean) => void;

  // App settings
  syncWithCloud: boolean;
  textSize: "small" | "medium" | "large";
  notifications: boolean;
  setSyncWithCloud: (enabled: boolean) => void;
  setTextSize: (size: "small" | "medium" | "large") => void;
  setNotifications: (enabled: boolean) => void;

  // Account settings
  userName: string;
  userEmail: string;
  isAccountBackedUp: boolean;
  onboardingCompleted: boolean;
  setUserName: (name: string) => void;
  setUserEmail: (email: string) => void;
  setAccountBackedUp: (backedUp: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;

  // Device settings
  deviceName: string;
  setDeviceName: (name: string) => void;

  // Reset all settings
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Theme settings
      themeMode: "system",
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
      textSize: "medium",
      notifications: true,
      setSyncWithCloud: (syncWithCloud) => set({ syncWithCloud }),
      setTextSize: (textSize) => set({ textSize }),
      setNotifications: (notifications) => set({ notifications }),

      // Account settings
      userName: "John Doe",
      userEmail: "johndoe@gmail.com",
      isAccountBackedUp: false,
      onboardingCompleted: false,
      setUserName: (userName) => set({ userName }),
      setUserEmail: (userEmail) => set({ userEmail }),
      setAccountBackedUp: (isAccountBackedUp) => set({ isAccountBackedUp }),
      setOnboardingCompleted: (onboardingCompleted) =>
        set({ onboardingCompleted }),

      // Device settings
      deviceName: "John Doe's iPhone",
      setDeviceName: (deviceName) => set({ deviceName }),

      // Reset all settings
      resetSettings: () =>
        set({
          themeMode: "system",
          focusDuration: 25,
          breakDuration: 5,
          soundEffects: true,
          metronome: false,
          syncWithCloud: false,
          textSize: "medium",
          notifications: true,
          userName: "John Doe",
          userEmail: "johndoe@gmail.com",
          isAccountBackedUp: false,
          onboardingCompleted: false,
          deviceName: "John Doe's iPhone",
        }),
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist certain settings, not all
      partialize: (state) => ({
        themeMode: state.themeMode,
        focusDuration: state.focusDuration,
        breakDuration: state.breakDuration,
        soundEffects: state.soundEffects,
        metronome: state.metronome,
        syncWithCloud: state.syncWithCloud,
        textSize: state.textSize,
        notifications: state.notifications,
        userName: state.userName,
        userEmail: state.userEmail,
        isAccountBackedUp: state.isAccountBackedUp,
        onboardingCompleted: state.onboardingCompleted,
        deviceName: state.deviceName,
      }),
    }
  )
);
