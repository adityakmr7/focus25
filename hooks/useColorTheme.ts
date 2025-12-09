import { useTheme } from '@/components/telegram-theme-switch/components/theme-provider';
import { DarkPalette, LightPalette } from '@/components/telegram-theme-switch/constants/palette';

export const useColorTheme = () => {
    const { theme } = useTheme();
    return theme === 'dark' ? DarkPalette : LightPalette;
};
