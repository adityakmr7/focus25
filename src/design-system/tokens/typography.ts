/**
 * Design System Typography Tokens
 * Defines the complete typography system for the Focus25 application
 */

export const typographyTokens = {
  // Font Families
  fontFamily: {
    primary: 'SF-Pro-Display-Regular',
    medium: 'SF-Pro-Display-Medium',
    semibold: 'SF-Pro-Display-Semibold',
    bold: 'SF-Pro-Display-Bold',
    heavy: 'SF-Pro-Display-Heavy',
    light: 'SF-Pro-Display-Light',
    thin: 'SF-Pro-Display-Thin',
    ultralight: 'SF-Pro-Display-Ultralight',
  },

  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
    '6xl': 48,
    '7xl': 64,
    '8xl': 80,
    '9xl': 96,
  },

  // Font Weights
  fontWeight: {
    thin: '100',
    ultralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
    black: '900',
  },

  // Line Heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: -0.05,
    tight: -0.025,
    normal: 0,
    wide: 0.025,
    wider: 0.05,
    widest: 0.1,
  },
} as const;

export type FontFamily = keyof typeof typographyTokens.fontFamily;
export type FontSize = keyof typeof typographyTokens.fontSize;
export type FontWeight = keyof typeof typographyTokens.fontWeight;
export type LineHeight = keyof typeof typographyTokens.lineHeight;
export type LetterSpacing = keyof typeof typographyTokens.letterSpacing;
