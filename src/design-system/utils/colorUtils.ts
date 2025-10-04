/**
 * Design System Color Utilities
 * Utility functions for working with colors
 */

import { colorTokens, ColorMode } from '../tokens/colors';

export const getColor = (colorKey: string, mode: ColorMode = 'light'): string => {
  const colors = colorTokens[mode];
  return (colors as any)[colorKey] || colorKey;
};

export const withOpacity = (color: string, opacity: number): string => {
  // Convert hex to rgba
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  // If already rgba, extract values and apply new opacity
  if (color.startsWith('rgba')) {
    const values = color.match(/\d+/g);
    if (values && values.length >= 3) {
      const r = values[0];
      const g = values[1];
      const b = values[2];
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }
  
  return color;
};

export const getContrastColor = (backgroundColor: string): string => {
  // Simple contrast calculation - in a real app, you'd want more sophisticated logic
  if (backgroundColor.includes('dark') || backgroundColor === '#000000' || backgroundColor === '#121212') {
    return '#FFFFFF';
  }
  return '#000000';
};
