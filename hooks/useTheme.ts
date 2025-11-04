import { useSettingsStore } from "@/stores/local-settings-store";
import { useColorScheme } from "react-native";

export const useTheme = () => {
  const { themeMode } = useSettingsStore();
  const systemColorScheme = useColorScheme();

  // Resolve the actual theme based on user preference and system setting
  const resolvedTheme =
    themeMode === "system"
      ? systemColorScheme === "dark"
        ? "dark"
        : "light"
      : themeMode;

  // Debug logging
  console.log(
    "useTheme - themeMode:",
    themeMode,
    "systemColorScheme:",
    systemColorScheme,
    "resolvedTheme:",
    resolvedTheme
  );

  return {
    themeMode,
    resolvedTheme,
    setThemeMode: useSettingsStore.getState().setThemeMode,
  };
};
