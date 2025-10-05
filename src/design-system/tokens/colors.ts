/**
 * Design System Color Tokens
 * Defines the complete color palette for the Focus25 application
 */

export const colorTokens = {
  // Base Colors
  white: '#FFFFFF',
  black: '#000000',

  // Light Mode Colors
  light: {
    // Background Colors
    'bg-primary': '#FFFFFF',
    'bg-secondary': '#F7F7F9',
    'bg-tertiary': '#F0F0F0',
    'bg-elevated': '#FFFFFF',

    // Text Colors
    'text-primary': '#1A202C',
    'text-secondary': '#4A5568',
    'text-tertiary': '#718096',
    'text-inverse': '#FFFFFF',

    // Accent Colors
    'accent-focus': '#5A67D8',
    'accent-break-short': '#48BB78',
    'accent-break-long': '#ED8936',
    'accent-success': '#38A169',
    'accent-warning': '#D69E2E',
    'accent-error': '#E53E3E',
    'accent-info': '#3182CE',

    // Background Accent Colors
    'bg-focus': '#EEF2FF',
    'bg-break-short': '#E6FFFA',
    'bg-break-long': '#FFF8F0',
    'bg-success': '#F0FFF4',
    'bg-warning': '#FFFBEB',
    'bg-error': '#FED7D7',
    'bg-info': '#EBF8FF',

    // Border Colors
    'border-primary': '#E2E8F0',
    'border-secondary': '#CBD5E0',
    'border-focus': '#5A67D8',

    // Shadow Colors
    'shadow-light': 'rgba(0, 0, 0, 0.05)',
    'shadow-medium': 'rgba(0, 0, 0, 0.1)',
    'shadow-heavy': 'rgba(0, 0, 0, 0.15)',
  },

  // Dark Mode Colors
  dark: {
    // Background Colors
    'bg-primary': '#121212',
    'bg-secondary': '#1E1E1E',
    'bg-tertiary': '#2A2A2A',
    'bg-elevated': '#1E1E1E',

    // Text Colors
    'text-primary': '#E0E0E0',
    'text-secondary': '#A0A0A0',
    'text-tertiary': '#808080',
    'text-inverse': '#121212',

    // Accent Colors
    'accent-focus': '#7C90F7',
    'accent-break-short': '#4FD8A3',
    'accent-break-long': '#F0A25B',
    'accent-success': '#68D391',
    'accent-warning': '#F6E05E',
    'accent-error': '#FC8181',
    'accent-info': '#63B3ED',

    // Background Accent Colors
    'bg-focus': '#1A1C2F',
    'bg-break-short': '#1A2F2B',
    'bg-break-long': '#2F1A0A',
    'bg-success': '#1A2F1A',
    'bg-warning': '#2F2A1A',
    'bg-error': '#2F1A1A',
    'bg-info': '#1A2A2F',

    // Border Colors
    'border-primary': '#2E2E2E',
    'border-secondary': '#404040',
    'border-focus': '#7C90F7',

    // Shadow Colors
    'shadow-light': 'rgba(0, 0, 0, 0.3)',
    'shadow-medium': 'rgba(0, 0, 0, 0.5)',
    'shadow-heavy': 'rgba(0, 0, 0, 0.7)',
  },
} as const;

export type ColorToken = keyof typeof colorTokens.light;
export type ColorMode = 'light' | 'dark';
