import TypographyText from "@/components/TypographyText";
import React from "react";
import { TouchableOpacity } from "react-native";
import { HStack, VStack } from "react-native-heroui";

interface SettingItemProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  title,
  subtitle,
  onPress,
  rightElement,
  icon,
  disabled,
}) => (
  <TouchableOpacity
    disabled={disabled}
    onPress={onPress}
    style={{ marginVertical: 4 }}
  >
    <HStack alignItems="center" justifyContent="space-between" py="sm">
      <HStack alignItems="center" gap="sm" flex={1}>
        {icon}
        <VStack flex={1}>
          <TypographyText variant="body" color="default">
            {title}
          </TypographyText>
          {subtitle && (
            <TypographyText variant="caption" color="secondary">
              {subtitle}
            </TypographyText>
          )}
        </VStack>
      </HStack>
      {rightElement}
    </HStack>
  </TouchableOpacity>
);

export default SettingItem;
