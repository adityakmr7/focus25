import { vars } from 'nativewind';

export const themes = {
    light: vars({
        '--bg-100': '#FFFFFF', // Main surface
        '--bg-200': '#F7F7F9', // Secondary panels
        '--focus-ring': '#5A67D8', // Focus mode accent
        '--focus-bg': '#EEF2FF', // Light violet background
        '--break-short': '#48BB78', // Short break accent
        '--break-short-bg': '#E6FFFA', // Light mint background
        '--break-long': '#ED8936', // Long break accent
        '--break-long-bg': '#FFF8F0', // Soft peach background
        '--text-primary': '#1A202C', // Main text
        '--text-secondary': '#4A5568', // Caption text
        '--divider': '#E2E8F0', // UI separators
        '--shadow-light': 'rgba(0,0,0,0.05)',
    }),
    dark: vars({
        '--bg-100': '#121212', // Main dark surface
        '--bg-200': '#1E1E1E', // Secondary panels
        '--focus-ring': '#7C90F7', // Slightly brighter accent
        '--focus-bg': '#1A1C2F', // Dark violet background
        '--break-short': '#4FD8A3', // Soft green accent
        '--break-short-bg': '#1A2F2B', // Deep mint background
        '--break-long': '#F0A25B', // Warm amber accent
        '--break-long-bg': '#2F1A0A', // Deep peach background
        '--text-primary': '#E0E0E0', // Light text
        '--text-secondary': '#A0A0A0', // Secondary text
        '--divider': '#2E2E2E', // Dark UI separators
        '--shadow-dark': 'rgba(0,0,0,0.7)',
    }),
};
