import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store/themeStore';

export const useTheme = () => {
  const { mode, getCurrentTheme } = useThemeStore();
  const systemColorScheme = useColorScheme();
  const theme = getCurrentTheme();
  const isDark =
    mode === 'auto' ? systemColorScheme === 'dark' : mode === 'dark';

  return { theme, isDark, mode, systemColorScheme };
};
