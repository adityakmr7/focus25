import TypographyText from "@/components/TypographyText";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "react-native-heroui";

interface TodoSelectionButtonProps {
  selectedTodoTitle: string | null;
  onPress: () => void;
}

export default function TodoSelectionButton({
  selectedTodoTitle,
  onPress,
}: TodoSelectionButtonProps) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: selectedTodoTitle
            ? theme.colors.primary
            : theme.colors.content1,
          borderColor: selectedTodoTitle
            ? theme.colors.primary
            : theme.colors.content3,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <View
          style={[
            styles.icon,
            {
              backgroundColor: selectedTodoTitle
                ? theme.colors.primary
                : theme.colors.content3,
            },
          ]}
        >
          <TypographyText
            variant="body"
            size="sm"
            style={[
              styles.iconText,
              { color: selectedTodoTitle ? "white" : theme.colors.default },
            ]}
          >
            {selectedTodoTitle ? "✓" : "📝"}
          </TypographyText>
        </View>
      </View>

      <View style={styles.textContainer}>
        <TypographyText
          variant="body"
          size="xs"
          color="default"
          style={styles.label}
        >
          Working on
        </TypographyText>
        <TypographyText
          variant="body"
          size="sm"
          color="default"
          style={styles.todoTitle}
          numberOfLines={1}
        >
          {selectedTodoTitle || "Select a todo"}
        </TypographyText>
      </View>

      <View style={styles.chevron}>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.foreground}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 24,
    width: "100%",
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 18,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    opacity: 0.6,
    marginBottom: 2,
  },
  todoTitle: {
    fontWeight: "600",
  },
  chevron: {
    marginLeft: 8,
    opacity: 0.5,
  },
});
