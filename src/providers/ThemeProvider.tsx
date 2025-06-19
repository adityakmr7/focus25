import React, { createContext, useContext, useEffect } from "react";
import { View, useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useThemeStore } from "../store/themeStore";

interface ThemeProviderProps {
    children: React.ReactNode;
}

type ThemeContextType = {
    theme: any;
    isDark: boolean;
};

export const ThemeContext = createContext<ThemeContextType>({
    theme: {},
    isDark: false,
});

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    const systemColorScheme = useColorScheme();
    const { mode, getCurrentTheme } = useThemeStore();
    
    const isDark = mode === 'auto' ? systemColorScheme === 'dark' : mode === 'dark';
    const theme = getCurrentTheme();

    return (
        <ThemeContext.Provider value={{ theme, isDark }}>
            <StatusBar style={isDark ? "light" : "dark"} />
            <View style={{ flex: 1, backgroundColor: theme.background }}>
                {children}
            </View>
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};