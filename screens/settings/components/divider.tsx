import React from "react";
import { View } from "react-native";
import { useTheme } from "react-native-heroui";

const Divider: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        height: 1,
        backgroundColor: theme.colors.divider,
        marginVertical: 8,
      }}
    />
  );
};

export default Divider;
