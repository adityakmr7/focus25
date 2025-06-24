import { create } from 'zustand';
import { databaseService } from '../services/database';

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
    isInitialized: boolean;

    // Actions
    initializeStore: () => Promise<void>;
    setMode: (mode: ThemeMode) => Promise<void>;
    setAccentColor: (color: AccentColor) => Promise<void>;
    setTimerStyle: (style: TimerStyle) => Promise<void>;
    createCustomTheme: (name: string, theme: CustomTheme) => Promise<void>;
    setActiveCustomTheme: (name: string | null) => Promise<void>;
    deleteCustomTheme: (name: string) => Promise<void>;

    // Getters
    getCurrentTheme: () => CustomTheme;
    getAccentColors: () => Record<AccentColor, string>;
    syncWithDatabase: () => Promise<void>;
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

export const useThemeStore = create<ThemeState>((set, get) => ({
    mode: 'auto',
    accentColor: 'green',
    timerStyle: 'digital',
    customThemes: {},
    activeCustomTheme: null,
    isInitialized: false,

    initializeStore: async () => {
        if (get().isInitialized) return;

        try {
            const savedTheme = await databaseService.getTheme();

            set({
                ...savedTheme,
                isInitialized: true,
            });
        } catch (error) {
            console.error('Failed to initialize theme store:', error);
            set({ isInitialized: true }); // Continue with defaults
        }
    },

    setMode: async (mode) => {
        try {
            set({ mode });
            await get().syncWithDatabase();
        } catch (error) {
            console.error('Failed to set theme mode:', error);
        }
    },

    setAccentColor: async (color) => {
        try {
            set({ accentColor: color });
            await get().syncWithDatabase();
        } catch (error) {
            console.error('Failed to set accent color:', error);
        }
    },

    setTimerStyle: async (style) => {
        try {
            set({ timerStyle: style });
            await get().syncWithDatabase();
        } catch (error) {
            console.error('Failed to set timer style:', error);
        }
    },

    createCustomTheme: async (name, theme) => {
        try {
            set((state) => ({
                customThemes: { ...state.customThemes, [name]: theme },
            }));
            await get().syncWithDatabase();
        } catch (error) {
            console.error('Failed to create custom theme:', error);
        }
    },

    setActiveCustomTheme: async (name) => {
        try {
            set({ activeCustomTheme: name });
            await get().syncWithDatabase();
        } catch (error) {
            console.error('Failed to set active custom theme:', error);
        }
    },

    deleteCustomTheme: async (name) => {
        try {
            set((state) => {
                const { [name]: deleted, ...rest } = state.customThemes;
                return {
                    customThemes: rest,
                    activeCustomTheme:
                        state.activeCustomTheme === name ? null : state.activeCustomTheme,
                };
            });
            await get().syncWithDatabase();
        } catch (error) {
            console.error('Failed to delete custom theme:', error);
        }
    },

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

    syncWithDatabase: async () => {
        try {
            const state = get();
            const themeData = {
                mode: state.mode,
                accentColor: state.accentColor,
                timerStyle: state.timerStyle,
                customThemes: state.customThemes,
                activeCustomTheme: state.activeCustomTheme,
            };

            await databaseService.saveTheme(themeData);
        } catch (error) {
            console.error('Failed to sync theme with database:', error);
        }
    },
}));
