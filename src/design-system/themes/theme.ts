/**
 * Design System Theme
 * Defines the theme system for the Focus25 application
 */
// @ts-nocheck

import { colorTokens, ColorMode } from '../tokens';
import { typographyTokens } from '../tokens';
import { spacingTokens } from '../tokens';
import { shadowTokens } from '../tokens';
import { borderRadiusTokens } from '../tokens';

export interface Theme {
  colors: typeof colorTokens.light;
  typography: typeof typographyTokens;
  spacing: typeof spacingTokens;
  shadows: typeof shadowTokens;
  borderRadius: typeof borderRadiusTokens;
  mode: ColorMode;
}

export const createTheme = (mode: ColorMode = 'light'): Theme => ({
  colors: colorTokens[mode],
  typography: typographyTokens,
  spacing: spacingTokens,
  shadows: shadowTokens,
  borderRadius: borderRadiusTokens,
  mode,
});

export const lightTheme = createTheme('light');
export const darkTheme = createTheme('dark');
