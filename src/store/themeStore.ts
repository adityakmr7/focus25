import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type AccentColor = 'green' | 'blue' | 'purple' | 'orange' | 'pink' | 'teal';
export type TimerStyle = 'digital' | 'analog' | 'minimal';

interface CustomTheme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  accent: string;
}

interface ThemeState {
  mode: ThemeMode;
  accentColor: AccentColor;
  timerStyle: TimerStyle;
  customThemes: Record<string, CustomTheme>;
  activeCustomTheme: string | null;
  
  // Actions
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  setTimerStyle: (style: TimerStyle) => void;
  createCustomTheme: (name: string, theme: CustomTheme) => void;
  setActiveCustomTheme: (name: string | null) => void;
  deleteCustomTheme: (name: string) => void;
  
  // Getters
  getCurrentTheme: () => CustomTheme;
  getAccentColors: () => Record<AccentColor, string>;
}

const accentColors: Record<AccentColor, string> = {
  green: '#48BB78',
  blue: '#4299E1',
  purple: '#9F7AEA',
  orange: '#ED8936',
  pink: '#ED64A6',
  teal: '#38B2AC',
};

const defaultLightTheme: CustomTheme = {
  primary: '#1A202C',
  secondary: '#4A5568',
  background: '#FFFFFF',
  surface: '#F7F7F9',
  text: '#1A202C',
  textSecondary: '#4A5568',
  accent: '#48BB78',
};

const defaultDarkTheme: CustomTheme = {
  primary: '#E0E0E0',
  secondary: '#A0A0A0',
  background: '#121212',
  surface: '#1E1E1E',
  text: '#E0E0E0',
  textSecondary: '#A0A0A0',
  accent: '#48BB78',
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'auto',
      accentColor: 'green',
      timerStyle: 'digital',
      customThemes: {},
      activeCustomTheme: null,

      setMode: (mode) => set({ mode }),
      setAccentColor: (color) => set({ accentColor: color }),
      setTimerStyle: (style) => set({ timerStyle: style }),
      
      createCustomTheme: (name, theme) =>
        set((state) => ({
          customThemes: { ...state.customThemes, [name]: theme },
        })),
      
      setActiveCustomTheme: (name) => set({ activeCustomTheme: name }),
      
      deleteCustomTheme: (name) =>
        set((state) => {
          const { [name]: deleted, ...rest } = state.customThemes;
          return {
            customThemes: rest,
            activeCustomTheme: state.activeCustomTheme === name ? null : state.activeCustomTheme,
          };
        }),

      getCurrentTheme: () => {
        const state = get();
        
        if (state.activeCustomTheme && state.customThemes[state.activeCustomTheme]) {
          return state.customThemes[state.activeCustomTheme];
        }

        const baseTheme = state.mode === 'dark' ? defaultDarkTheme : defaultLightTheme;
        return {
          ...baseTheme,
          accent: accentColors[state.accentColor],
        };
      },

      getAccentColors: () => accentColors,
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);