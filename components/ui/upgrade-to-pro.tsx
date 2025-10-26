import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { useTheme } from "react-native-heroui";
import TypographyText from "../TypographyText";

interface UpgradeToProProps {
  onPress?: () => void;
  disabled?: boolean;
}

const UpgradeToPro: React.FC<UpgradeToProProps> = ({
  onPress,
  disabled = false,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: theme.colors.background,
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: theme.colors.foreground,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {/* Left side - "Upgrade to" text */}
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        <TypographyText
          variant="body"
          color="default"
          style={{
            fontSize: 16,
            fontWeight: "500",
            marginRight: 8,
          }}
        >
          Upgrade to
        </TypographyText>

        {/* PRO Badge */}
        <View
          style={{
            backgroundColor: theme.colors.foreground,
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
            marginRight: 12,
          }}
        >
          <TypographyText
            variant="body"
            style={{
              fontSize: 14,
              fontWeight: "700",
              letterSpacing: 0.5,
              color: theme.colors["default-300"],
            }}
          >
            PRO
          </TypographyText>
        </View>
      </View>

      {/* Right side - Arrow icon */}
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: theme.colors.background,
          borderWidth: 1,
          borderColor: theme.colors.content3,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name="arrow-forward"
          size={12}
          color={theme.colors.foreground}
        />
      </View>
    </TouchableOpacity>
  );
};

export default UpgradeToPro;
