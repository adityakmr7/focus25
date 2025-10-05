/**
 * Design System Theme Provider
 * Provides theme context to the application
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Theme, createTheme } from './theme';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: 'light' | 'dark' | 'auto') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: 'light' | 'dark' | 'auto';
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialMode = 'auto',
}) => {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = React.useState<'light' | 'dark' | 'auto'>(
    initialMode
  );

  const isDark =
    mode === 'auto' ? systemColorScheme === 'dark' : mode === 'dark';
  const theme = createTheme(isDark ? 'dark' : 'light');

  const toggleTheme = () => {
    setMode(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newMode: 'light' | 'dark' | 'auto') => {
    setMode(newMode);
  };

  const value: ThemeContextType = {
    theme,
    isDark,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
