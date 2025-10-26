import TypographyText from "@/components/TypographyText";
import React from "react";
import { Card, CardBody, VStack } from "react-native-heroui";

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  children,
}) => (
  <VStack gap="sm">
    <TypographyText
      variant="label"
      color="secondary"
      style={{ marginBottom: 8 }}
    >
      {title}
    </TypographyText>
    <Card variant="bordered">
      <CardBody>{children}</CardBody>
    </Card>
  </VStack>
);

export default SettingsSection;
