import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { userStorage, createMMKVStorage } from '../services/storage';

/**
 * Theme Store Types
 * 
 * Defines the available theme modes, accent colors, and timer styles
 */
export type ThemeMode = 'light' | 'dark' | 'auto';
export type AccentColor = 'green' | 'blue' | 'purple' | 'orange' | 'pink' | 'teal';
export type TimerStyle = 'digital' | 'analog' | 'minimal';

/**
 * Custom Theme Interface
 * 
 * Defines the structure for user-created custom themes
 */
interface CustomTheme {
  primary: string;              // Primary text color
  secondary: string;            // Secondary text color
  background: string;           // Main background color
  surface: string;              // Card/surface background color
  text: string;                 // Primary text color
  textSecondary: string;        // Secondary text color
  accent: string;               // Accent/brand color
}

/**
 * Theme Store State Interface
 * 
 * Manages all theme-related state and operations
 */
interface ThemeState {
  // Core Theme Settings
  mode: ThemeMode;                                      // Light, dark, or auto mode
  accentColor: AccentColor;                            // Selected accent color
  timerStyle: TimerStyle;                              // Timer display style
  
  // Custom Themes
  customThemes: Record<string, CustomTheme>;           // User-created themes
  activeCustomTheme: string | null;                   // Currently active custom theme
  
  // Theme Management Actions
  setMode: (mode: ThemeMode) => void;                  // Set theme mode
  setAccentColor: (color: AccentColor) => void;       // Set accent color
  setTimerStyle: (style: TimerStyle) => void;         // Set timer style
  
  // Custom Theme Actions
  createCustomTheme: (name: string, theme: CustomTheme) => void;  // Create new custom theme
  setActiveCustomTheme: (name: string | null) => void;           // Activate custom theme
  deleteCustomTheme: (name: string) => void;                     // Delete custom theme
  updateCustomTheme: (name: string, theme: Partial<CustomTheme>) => void; // Update existing theme
  
  // Theme Utility Actions
  getCurrentTheme: () => CustomTheme;                             // Get current active theme
  getAccentColors: () => Record<AccentColor, string>;            // Get available accent colors
  exportThemes: () => string;                                    // Export custom themes
  importThemes: (data: string) => boolean;                       // Import custom themes
  resetThemes: () => void;                                       // Reset to default themes
}

/**
 * Accent Color Palette
 * 
 * Predefined accent colors that users can choose from
 */
const accentColors: Record<AccentColor, string> = {
  green: '#48BB78',     // Emerald green - calming and focused
  blue: '#4299E1',      // Sky blue - professional and trustworthy
  purple: '#9F7AEA',    // Lavender purple - creative and inspiring
  orange: '#ED8936',    // Warm orange - energetic and motivating
  pink: '#ED64A6',      // Rose pink - friendly and approachable
  teal: '#38B2AC',      // Teal - balanced and sophisticated
};

/**
 * Default Theme Configurations
 * 
 * Base light and dark themes that serve as fallbacks
 */
const defaultLightTheme: CustomTheme = {
  primary: '#1A202C',           // Dark gray for primary text
  secondary: '#4A5568',         // Medium gray for secondary text
  background: '#FFFFFF',        // Pure white background
  surface: '#F7F7F9',          // Light gray for cards/surfaces
  text: '#1A202C',             // Dark text for readability
  textSecondary: '#4A5568',    // Lighter text for less important content
  accent: '#48BB78',           // Default green accent
};

const defaultDarkTheme: CustomTheme = {
  primary: '#E0E0E0',           // Light gray for primary text
  secondary: '#A0A0A0',         // Medium gray for secondary text
  background: '#121212',        // True black background
  surface: '#1E1E1E',          // Dark gray for cards/surfaces
  text: '#E0E0E0',             // Light text for dark backgrounds
  textSecondary: '#A0A0A0',    // Dimmer text for secondary content
  accent: '#48BB78',           // Default green accent
};

/**
 * Utility Functions
 */

/**
 * Validate custom theme structure
 */
const validateCustomTheme = (theme: any): boolean => {
  const requiredKeys = ['primary', 'secondary', 'background', 'surface', 'text', 'textSecondary', 'accent'];
  return requiredKeys.every(key => 
    typeof theme[key] === 'string' && 
    theme[key].match(/^#[0-9A-Fa-f]{6}$/) // Validate hex color format
  );
};

/**
 * Generate a unique theme name if one already exists
 */
const generateUniqueThemeName = (baseName: string, existingThemes: Record<string, CustomTheme>): string => {
  let counter = 1;
  let uniqueName = baseName;
  
  while (existingThemes[uniqueName]) {
    uniqueName = `${baseName} (${counter})`;
    counter++;
  }
  
  return uniqueName;
};

/**
 * Theme Store Implementation
 * 
 * Uses Zustand with MMKV persistence for fast theme switching
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Initial State
      mode: 'auto',                    // Respect system preference by default
      accentColor: 'green',            // Default to calming green
      timerStyle: 'digital',           // Default to familiar digital display
      customThemes: {},                // No custom themes initially
      activeCustomTheme: null,         // No custom theme active initially

      /**
       * Set Theme Mode
       * 
       * Updates the theme mode (light, dark, or auto)
       */
      setMode: (mode) => {
        set({ mode });
        console.log(`Theme mode changed to: ${mode}`);
      },

      /**
       * Set Accent Color
       * 
       * Updates the accent color used throughout the app
       */
      setAccentColor: (color) => {
        set({ accentColor: color });
        console.log(`Accent color changed to: ${color} (${accentColors[color]})`);
      },

      /**
       * Set Timer Style
       * 
       * Updates the timer display style (digital, analog, minimal)
       */
      setTimerStyle: (style) => {
        set({ timerStyle: style });
        console.log(`Timer style changed to: ${style}`);
      },

      /**
       * Create Custom Theme
       * 
       * Creates a new custom theme with validation
       */
      createCustomTheme: (name, theme) => {
        try {
          // Validate the theme structure
          if (!validateCustomTheme(theme)) {
            console.error('Invalid custom theme structure');
            return;
          }

          const state = get();
          
          // Generate unique name if needed
          const uniqueName = generateUniqueThemeName(name, state.customThemes);
          
          set((state) => ({
            customThemes: { 
              ...state.customThemes, 
              [uniqueName]: theme 
            },
          }));

          console.log(`Created custom theme: ${uniqueName}`);
        } catch (error) {
          console.error('Error creating custom theme:', error);
        }
      },

      /**
       * Set Active Custom Theme
       * 
       * Activates or deactivates a custom theme
       */
      setActiveCustomTheme: (name) => {
        const state = get();
        
        // Validate that the theme exists if name is provided
        if (name && !state.customThemes[name]) {
          console.error(`Custom theme "${name}" not found`);
          return;
        }

        set({ activeCustomTheme: name });
        console.log(`Active custom theme set to: ${name || 'none'}`);
      },

      /**
       * Delete Custom Theme
       * 
       * Removes a custom theme and deactivates it if currently active
       */
      deleteCustomTheme: (name) => {
        try {
          set((state) => {
            const { [name]: deleted, ...rest } = state.customThemes;
            return {
              customThemes: rest,
              activeCustomTheme: state.activeCustomTheme === name ? null : state.activeCustomTheme,
            };
          });

          console.log(`Deleted custom theme: ${name}`);
        } catch (error) {
          console.error('Error deleting custom theme:', error);
        }
      },

      /**
       * Update Custom Theme
       * 
       * Updates an existing custom theme with new properties
       */
      updateCustomTheme: (name, themeUpdates) => {
        try {
          const state = get();
          
          if (!state.customThemes[name]) {
            console.error(`Custom theme "${name}" not found`);
            return;
          }

          const updatedTheme = { ...state.customThemes[name], ...themeUpdates };
          
          // Validate the updated theme
          if (!validateCustomTheme(updatedTheme)) {
            console.error('Invalid theme updates provided');
            return;
          }

          set((state) => ({
            customThemes: {
              ...state.customThemes,
              [name]: updatedTheme,
            },
          }));

          console.log(`Updated custom theme: ${name}`);
        } catch (error) {
          console.error('Error updating custom theme:', error);
        }
      },

      /**
       * Get Current Theme
       * 
       * Returns the currently active theme configuration
       */
      getCurrentTheme: () => {
        const state = get();
        
        // Return active custom theme if one is selected
        if (state.activeCustomTheme && state.customThemes[state.activeCustomTheme]) {
          return state.customThemes[state.activeCustomTheme];
        }

        // Return default theme based on mode with selected accent color
        const baseTheme = state.mode === 'dark' ? defaultDarkTheme : defaultLightTheme;
        return {
          ...baseTheme,
          accent: accentColors[state.accentColor],
        };
      },

      /**
       * Get Accent Colors
       * 
       * Returns the available accent color palette
       */
      getAccentColors: () => accentColors,

      /**
       * Export Custom Themes
       * 
       * Creates a JSON string containing all custom themes for backup/sharing
       */
      exportThemes: () => {
        try {
          const state = get();
          const exportData = {
            customThemes: state.customThemes,
            activeCustomTheme: state.activeCustomTheme,
            exportDate: new Date().toISOString(),
            version: '1.0.0',
          };
          
          return JSON.stringify(exportData, null, 2);
        } catch (error) {
          console.error('Error exporting themes:', error);
          return '{}';
        }
      },

      /**
       * Import Custom Themes
       * 
       * Imports custom themes from a JSON string with validation
       */
      importThemes: (data) => {
        try {
          const importedData = JSON.parse(data);
          
          if (!importedData.customThemes || typeof importedData.customThemes !== 'object') {
            throw new Error('Invalid data format: missing or invalid customThemes');
          }

          // Validate each custom theme
          const validThemes: Record<string, CustomTheme> = {};
          
          Object.entries(importedData.customThemes).forEach(([name, theme]) => {
            if (validateCustomTheme(theme)) {
              validThemes[name] = theme as CustomTheme;
            } else {
              console.warn(`Skipping invalid theme: ${name}`);
            }
          });

          if (Object.keys(validThemes).length === 0) {
            throw new Error('No valid themes found in import data');
          }

          // Merge with existing themes (resolve name conflicts)
          set((state) => {
            const mergedThemes = { ...state.customThemes };
            
            Object.entries(validThemes).forEach(([name, theme]) => {
              const uniqueName = generateUniqueThemeName(name, mergedThemes);
              mergedThemes[uniqueName] = theme;
            });

            return {
              customThemes: mergedThemes,
            };
          });

          console.log(`Imported ${Object.keys(validThemes).length} custom themes`);
          return true;
        } catch (error) {
          console.error('Error importing themes:', error);
          return false;
        }
      },

      /**
       * Reset Themes
       * 
       * Clears all custom themes and resets to defaults
       */
      resetThemes: () => {
        try {
          set({
            mode: 'auto',
            accentColor: 'green',
            timerStyle: 'digital',
            customThemes: {},
            activeCustomTheme: null,
          });

          console.log('Reset all themes to defaults');
        } catch (error) {
          console.error('Error resetting themes:', error);
        }
      },
    }),
    {
      name: 'theme-storage',                                    // Storage key name
      storage: createJSONStorage(() => createMMKVStorage(userStorage)), // Use MMKV for persistence
      
      /**
       * Rehydration Handler
       * 
       * Called when the store is loaded from storage on app startup
       */
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log(`Theme store rehydrated with ${Object.keys(state.customThemes).length} custom themes`);
          
          // Validate that the active custom theme still exists
          if (state.activeCustomTheme && !state.customThemes[state.activeCustomTheme]) {
            console.warn(`Active custom theme "${state.activeCustomTheme}" no longer exists, deactivating`);
            state.activeCustomTheme = null;
          }
        }
      },
    }
  )
);