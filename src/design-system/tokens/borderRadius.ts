/**
 * Design System Border Radius Tokens
 * Defines the border radius system for the Focus25 application
 */

export const borderRadiusTokens = {
  none: 0,
  sm: 4,
  base: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

export type BorderRadiusToken = keyof typeof borderRadiusTokens;
