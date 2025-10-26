import TypographyText from "@/components/TypographyText";
import { useSettingsStore } from "@/stores/setting-store";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import {
  Card,
  CardBody,
  HStack,
  SPACING,
  VStack,
  useTheme,
} from "react-native-heroui";

interface ThemeSelectionModalProps {
  visible: boolean;
  onClose: () => void;
}

const ThemeSelectionModal: React.FC<ThemeSelectionModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useTheme();
  const { themeMode, setThemeMode } = useSettingsStore();

  const handleThemeSelect = (mode: "light" | "dark" | "system") => {
    setThemeMode(mode);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <HStack
            alignItems="center"
            justifyContent="space-between"
            pb="md"
            style={[styles.header, { borderBottomColor: theme.colors.divider }]}
          >
            <TypographyText variant="title" color="default">
              Choose Theme
            </TypographyText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons
                name="close"
                size={24}
                color={theme.colors.foreground}
              />
            </TouchableOpacity>
          </HStack>

          {/* Theme Options */}
          <VStack gap="xs" style={{ marginTop: SPACING["unit-4"] }}>
            <Card
              isPressable
              onPress={() => handleThemeSelect("system")}
              variant={themeMode === "system" ? "bordered" : "flat"}
              style={{
                backgroundColor:
                  themeMode === "system"
                    ? theme.colors.primary + "20"
                    : theme.colors.content1,
                borderColor:
                  themeMode === "system"
                    ? theme.colors.primary
                    : theme.colors.divider,
              }}
            >
              <CardBody>
                <HStack alignItems="center" justifyContent="space-between">
                  <VStack>
                    <TypographyText
                      variant="body"
                      color={themeMode === "system" ? "primary" : "default"}
                      style={{
                        fontWeight: themeMode === "system" ? "600" : "400",
                      }}
                    >
                      System
                    </TypographyText>
                    <TypographyText variant="caption" color="secondary">
                      Follow system setting
                    </TypographyText>
                  </VStack>
                  {themeMode === "system" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={theme.colors.primary}
                    />
                  )}
                </HStack>
              </CardBody>
            </Card>

            <Card
              isPressable
              onPress={() => handleThemeSelect("light")}
              variant={themeMode === "light" ? "bordered" : "flat"}
              style={{
                backgroundColor:
                  themeMode === "light"
                    ? theme.colors.primary + "20"
                    : theme.colors.content1,
                borderColor:
                  themeMode === "light"
                    ? theme.colors.primary
                    : theme.colors.divider,
              }}
            >
              <CardBody>
                <HStack alignItems="center" justifyContent="space-between">
                  <VStack>
                    <TypographyText
                      variant="body"
                      color={themeMode === "light" ? "primary" : "default"}
                      style={{
                        fontWeight: themeMode === "light" ? "600" : "400",
                      }}
                    >
                      Light
                    </TypographyText>
                    <TypographyText variant="caption" color="secondary">
                      Always use light theme
                    </TypographyText>
                  </VStack>
                  {themeMode === "light" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={theme.colors.primary}
                    />
                  )}
                </HStack>
              </CardBody>
            </Card>

            <Card
              isPressable
              onPress={() => handleThemeSelect("dark")}
              variant={themeMode === "dark" ? "bordered" : "flat"}
              style={{
                backgroundColor:
                  themeMode === "dark"
                    ? theme.colors.primary + "20"
                    : theme.colors.content1,
                borderColor:
                  themeMode === "dark"
                    ? theme.colors.primary
                    : theme.colors.divider,
              }}
            >
              <CardBody>
                <HStack alignItems="center" justifyContent="space-between">
                  <VStack>
                    <TypographyText
                      variant="body"
                      color={themeMode === "dark" ? "primary" : "default"}
                      style={{
                        fontWeight: themeMode === "dark" ? "600" : "400",
                      }}
                    >
                      Dark
                    </TypographyText>
                    <TypographyText variant="caption" color="secondary">
                      Always use dark theme
                    </TypographyText>
                  </VStack>
                  {themeMode === "dark" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={theme.colors.primary}
                    />
                  )}
                </HStack>
              </CardBody>
            </Card>
          </VStack>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING["unit-6"],
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: SPACING["unit-6"],
    maxHeight: "80%",
  },
  header: {
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
});

export default ThemeSelectionModal;
