import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTheme } from "react-native-heroui";

const ChevronRight: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Ionicons
      name="chevron-forward"
      size={20}
      color={theme.colors.foreground}
    />
  );
};

export default ChevronRight;
