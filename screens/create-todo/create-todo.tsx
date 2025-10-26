import TypographyText from "@/components/TypographyText";
import { useSupabaseTodoStore } from "@/stores/supabase-todo-store";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, HStack, SPACING, VStack, useTheme } from "react-native-heroui";
import { SafeAreaView } from "react-native-safe-area-context";

const CreateTodoScreen = () => {
  const { theme } = useTheme();
  const { createTodo, updateTodo, todos } = useSupabaseTodoStore();
  const { todoId } = useLocalSearchParams<{ todoId?: string }>();

  // Check if we're editing an existing todo
  const isEditing = Boolean(todoId);
  const existingTodo = isEditing
    ? todos.find((todo) => todo.id === todoId)
    : null;

  const [title, setTitle] = useState(existingTodo?.title || "");
  const [description, setDescription] = useState(
    existingTodo?.description || ""
  );
  const [selectedIcon, setSelectedIcon] = useState(
    existingTodo?.icon || "checkmark-circle"
  );
  const [isLoading, setIsLoading] = useState(false);

  // Available icons for selection
  const availableIcons = [
    "checkmark-circle",
    "star",
    "heart",
    "flash",
    "bookmark",
  ];

  // Update form when editing existing todo
  useEffect(() => {
    if (existingTodo) {
      setTitle(existingTodo.title);
      setDescription(existingTodo.description);
      setSelectedIcon(existingTodo.icon);
    }
  }, [existingTodo]);

  const handleSaveTodo = async () => {
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      if (isEditing && todoId) {
        // Update existing todo
        await updateTodo(todoId, {
          title: title.trim(),
          description: description.trim(),
          icon: selectedIcon,
        });
      } else {
        // Create new todo
        await createTodo({
          title: title.trim(),
          description: description.trim(),
          icon: selectedIcon,
          completedAt: null,
        });
      }

      // Reset form and navigate back
      setTitle("");
      setDescription("");
      router.back();
    } catch (error) {
      console.error(
        `Failed to ${isEditing ? "update" : "create"} todo:`,
        error
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setDescription("");
    router.back();
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }}>
          {/* Header */}
          <HStack
            alignItems="center"
            justifyContent="space-between"
            style={{ marginBottom: 32 }}
          >
            <TouchableOpacity onPress={handleCancel}>
              <Ionicons
                name="close"
                size={24}
                color={theme.colors.foreground}
              />
            </TouchableOpacity>
            <TypographyText variant="title" color="default">
              {isEditing ? "Edit Todo" : "Create Todo"}
            </TypographyText>
            <View style={{ width: 24 }} />
          </HStack>

          {/* Form */}
          <VStack gap="lg" style={{ flex: 1 }}>
            {/* Title Input */}
            <VStack gap="xs">
              <TypographyText variant="body" color="default">
                Title *
              </TypographyText>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Enter todo title..."
                placeholderTextColor={theme.colors.content3}
                style={{
                  backgroundColor: theme.colors.content2,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: theme.colors.foreground,
                  borderWidth: 1,
                  borderColor: theme.colors.content3,
                }}
                autoFocus={true}
                returnKeyType="next"
              />
            </VStack>

            {/* Description Input */}
            <VStack gap="xs">
              <TypographyText variant="body" color="default">
                Description
              </TypographyText>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Enter todo description (optional)..."
                placeholderTextColor={theme.colors.content3}
                style={{
                  backgroundColor: theme.colors.content2,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: theme.colors.foreground,
                  borderWidth: 1,
                  borderColor: theme.colors.content3,
                  minHeight: 100,
                  textAlignVertical: "top",
                }}
                multiline={true}
                numberOfLines={4}
                returnKeyType="done"
              />
            </VStack>

            {/* Icon Selection */}
            <VStack gap="xs">
              <TypographyText variant="body" color="default">
                Icon
              </TypographyText>
              <HStack gap="md" style={{ flexWrap: "wrap" }}>
                {availableIcons.map((iconName) => (
                  <TouchableOpacity
                    key={iconName}
                    onPress={() => setSelectedIcon(iconName)}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor:
                        selectedIcon === iconName
                          ? theme.colors["secondary-400"]
                          : theme.colors.content2,
                      borderWidth: 2,
                      borderColor:
                        selectedIcon === iconName
                          ? theme.colors["secondary-400"]
                          : theme.colors.content3,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name={iconName as any}
                      size={24}
                      color={
                        selectedIcon === iconName
                          ? theme.colors.background
                          : theme.colors.foreground
                      }
                    />
                  </TouchableOpacity>
                ))}
              </HStack>
            </VStack>
          </VStack>

          {/* Action Buttons */}
          <HStack gap="md" style={{ marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <Button
                variant="outline"
                onPress={handleCancel}
                disabled={isLoading}
                style={{
                  borderColor: theme.colors.content3,
                  paddingVertical: SPACING["unit-3"],
                }}
              >
                <TypographyText variant="body" color="default">
                  Cancel
                </TypographyText>
              </Button>
            </View>

            <View style={{ flex: 1 }}>
              <Button
                onPress={handleSaveTodo}
                disabled={!title.trim() || isLoading}
                style={{
                  backgroundColor: theme.colors["secondary-400"],
                  paddingVertical: SPACING["unit-3"],
                }}
              >
                <TypographyText variant="body" color="default">
                  {isLoading
                    ? isEditing
                      ? "Updating..."
                      : "Creating..."
                    : isEditing
                      ? "Update"
                      : "Create"}
                </TypographyText>
              </Button>
            </View>
          </HStack>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateTodoScreen;
