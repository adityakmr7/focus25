import TypographyText from "@/components/TypographyText";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { HStack, SPACING, VStack, useTheme } from "react-native-heroui";

interface DurationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  selectedDuration: number;
  onSelectDuration: (duration: number) => void;
}

const DURATION_OPTIONS = [1, 5, 10, 15, 25]; // Minutes

export default function DurationPickerModal({
  visible,
  onClose,
  title,
  selectedDuration,
  onSelectDuration,
}: DurationPickerModalProps) {
  const { theme } = useTheme();

  const handleSelect = (duration: number) => {
    onSelectDuration(duration);
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
              {title}
            </TypographyText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons
                name="close"
                size={24}
                color={theme.colors.foreground}
              />
            </TouchableOpacity>
          </HStack>

          {/* Duration Options */}
          <ScrollView style={styles.scrollView}>
            <VStack gap="xs">
              {DURATION_OPTIONS.map((duration) => {
                const isSelected = duration === selectedDuration;
                return (
                  <TouchableOpacity
                    key={duration}
                    onPress={() => handleSelect(duration)}
                    style={[
                      styles.optionItem,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary + "20"
                          : "transparent",
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.divider,
                      },
                    ]}
                  >
                    <HStack
                      alignItems="center"
                      justifyContent="space-between"
                      flex={1}
                    >
                      <TypographyText
                        variant="body"
                        color={isSelected ? "primary" : "default"}
                        style={{ fontWeight: isSelected ? "600" : "400" }}
                      >
                        {duration} {duration === 1 ? "minute" : "minutes"}
                      </TypographyText>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={theme.colors.primary}
                        />
                      )}
                    </HStack>
                  </TouchableOpacity>
                );
              })}
            </VStack>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
  scrollView: {
    marginTop: SPACING["unit-4"],
  },
  optionItem: {
    padding: SPACING["unit-4"],
    borderRadius: 12,
    borderWidth: 2,
  },
});
