import TypographyText from '@/components/TypographyText';
import { useUnifiedTodoStore } from '@/hooks/useUnifiedTodoStore';
import { useCategoryStore } from '@/stores/category-store';
import { Subtask } from '@/services/local-database-service';
import { useColorTheme } from '@/hooks/useColorTheme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    TextInput,
    TouchableOpacity,
    View,
    Text,
    FlatList,
    ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING } from '@/constants/spacing';
import { HStack } from '@/components/ui/HStack';
import { VStack } from '@/components/ui/VStack';
import { Button } from '@/components/ui/Button';
const CreateTodoScreen = () => {
    const colors = useColorTheme();
    const insets = useSafeAreaInsets();
    const { createTodo, updateTodo, todos } = useUnifiedTodoStore();
    const { categories } = useCategoryStore();
    const { todoId } = useLocalSearchParams<{ todoId?: string }>();

    // Check if we're editing an existing todo
    const isEditing = Boolean(todoId);
    const existingTodo = isEditing ? todos.find((todo) => todo.id === todoId) : null;

    // Safely extract local properties with type assertion
    const todoWithLocalProps = existingTodo as typeof existingTodo & {
        category?: string;
        reminderAt?: string | null;
        subtasks?: Subtask[];
    };

    const [title, setTitle] = useState(existingTodo?.title ?? '');
    const [selectedCategory, setSelectedCategory] = useState<string>(
        todoWithLocalProps?.category ?? '',
    );
    const [isLoading, setIsLoading] = useState(false);
    const [reminderAt, setReminderAt] = useState<string | null>(
        todoWithLocalProps?.reminderAt ?? null,
    );
    const existingSubtasks = (todoWithLocalProps?.subtasks ?? []) as Subtask[];
    const [enableSubtasks, setEnableSubtasks] = useState(
        Array.isArray(existingSubtasks) && existingSubtasks.length > 0,
    );
    const [newSubtask, setNewSubtask] = useState('');
    const [subtasks, setSubtasks] = useState<Subtask[]>(
        existingSubtasks.map((s: Subtask) => ({ ...s })),
    );

    // Update form when editing existing todo
    useEffect(() => {
        if (existingTodo) {
            setTitle(existingTodo.title ?? '');
            const todo = existingTodo as typeof existingTodo & {
                category?: string;
                reminderAt?: string | null;
                subtasks?: Subtask[];
            };
            setSelectedCategory(todo.category ?? '');
            setReminderAt(todo.reminderAt ?? null);
            setSubtasks(Array.isArray(todo.subtasks) ? todo.subtasks : []);
        }
    }, [existingTodo]);

    const formattedReminder = useMemo(() => {
        if (!reminderAt) return '';
        try {
            const d = new Date(reminderAt);
            return d.toLocaleString();
        } catch {
            return '';
        }
    }, [reminderAt]);

    const handleAddSubtask = () => {
        const trimmed = newSubtask.trim();
        if (!trimmed) return;
        setSubtasks((prev: Subtask[]) => [
            ...prev,
            { id: Math.random().toString(36).slice(2), title: trimmed, done: false },
        ]);
        setNewSubtask('');
    };

    const toggleSubtask = (id: string) => {
        setSubtasks((prev: Subtask[]) =>
            prev.map((s: Subtask) => (s.id === id ? { ...s, done: !s.done } : s)),
        );
    };

    const deleteSubtask = (id: string) => {
        setSubtasks((prev: Subtask[]) => prev.filter((s: Subtask) => s.id !== id));
    };

    const handleSaveTodo = async () => {
        if (!title.trim()) return;

        console.log('subtasks', subtasks);
        setIsLoading(true);
        try {
            if (isEditing && todoId) {
                // Update existing todo
                await updateTodo(todoId, {
                    title: title.trim(),
                    category: selectedCategory || undefined,
                    reminderAt: reminderAt || null,
                    subtasks: enableSubtasks ? subtasks : [],
                });
            } else {
                // Create new todo
                await createTodo({
                    title: title.trim(),
                    description: undefined,
                    icon: undefined,
                    isCompleted: false,
                    completedAt: null,
                    category: selectedCategory || undefined,
                    priority: 0,
                    estimatedMinutes: undefined,
                    reminderAt: reminderAt || null,
                    subtasks: enableSubtasks ? subtasks : [],
                } as any);
            }

            // Reset form and navigate back
            setTitle('');
            setSubtasks([]);
            setReminderAt(null);
            router.back();
        } catch (error) {
            console.error(`Failed to ${isEditing ? 'update' : 'create'} todo:`, error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setTitle('');
        setSubtasks([]);
        setReminderAt(null);
        router.back();
    };

    return (
        <SafeAreaView
            edges={['top', 'left', 'right']}
            style={{
                flex: 1,
                backgroundColor: colors.backgroundPrimary,
            }}
        >
            <View style={{ flex: 1 }}>
                <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
                    {/* Header */}
                    <HStack
                        alignItems="center"
                        justifyContent="space-between"
                        style={{ marginBottom: 32 }}
                    >
                        <View />
                        <TouchableOpacity onPress={handleCancel}>
                            <Ionicons name="close" size={24} color={colors.contentPrimary} />
                        </TouchableOpacity>
                    </HStack>
                </View>

                {/* Scrollable Content */}
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                        <VStack gap="lg">
                            <TextInput
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Write a new task..."
                                placeholderTextColor={colors.contentSecondary}
                                style={{
                                    fontSize: 32,
                                    fontWeight: '700',
                                    color: colors.contentPrimary,
                                }}
                                autoFocus={true}
                                multiline
                            />
                            {!!formattedReminder && (
                                <TypographyText variant="caption" color="default">
                                    {formattedReminder}
                                </TypographyText>
                            )}

                            {/* Subtasks toggle and list */}
                            <HStack alignItems="center" gap="md">
                                <TouchableOpacity
                                    onPress={() => setEnableSubtasks((v) => !v)}
                                    style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: 6,
                                        borderWidth: 1.5,
                                        borderColor: colors.contentSecondary,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: enableSubtasks
                                            ? colors.secondary
                                            : 'transparent',
                                    }}
                                >
                                    {enableSubtasks && (
                                        <Ionicons
                                            name="checkmark"
                                            size={16}
                                            color={colors.backgroundPrimary}
                                        />
                                    )}
                                </TouchableOpacity>
                                <TypographyText variant="body" style={{ color: colors.contentPrimary }}>
                                    Add subtask
                                </TypographyText>
                            </HStack>
                            {enableSubtasks && (
                                <VStack gap="sm">
                                    <HStack gap="sm" alignItems="center">
                                        <View style={{ flex: 1 }}>
                                            <TextInput
                                                value={newSubtask}
                                                onChangeText={setNewSubtask}
                                                placeholder="New subtask"
                                                placeholderTextColor={colors.contentSecondary}
                                                style={{
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 10,
                                                    color: colors.contentPrimary,
                                                }}
                                                onSubmitEditing={handleAddSubtask}
                                                returnKeyType="done"
                                            />
                                        </View>
                                        <TouchableOpacity onPress={handleAddSubtask}>
                                            <Ionicons
                                                name="add-circle"
                                                size={28}
                                                color={colors.secondary}
                                            />
                                        </TouchableOpacity>
                                    </HStack>
                                    {subtasks.map((item) => (
                                        <HStack
                                            key={item.id}
                                            alignItems="center"
                                            justifyContent="space-between"
                                            style={{ paddingVertical: 6 }}
                                        >
                                            <HStack
                                                alignItems="center"
                                                gap="sm"
                                                style={{ flex: 1 }}
                                            >
                                                <TouchableOpacity
                                                    onPress={() => toggleSubtask(item.id)}
                                                >
                                                    <Ionicons
                                                        name={
                                                            item.done
                                                                ? 'checkbox'
                                                                : 'square-outline'
                                                        }
                                                        size={22}
                                                        color={colors.contentPrimary}
                                                    />
                                                </TouchableOpacity>
                                                <Text
                                                    style={{
                                                        color: colors.contentPrimary,
                                                        textDecorationLine: item.done
                                                            ? 'line-through'
                                                            : 'none',
                                                    }}
                                                >
                                                    {item.title}
                                                </Text>
                                            </HStack>
                                            <TouchableOpacity
                                                onPress={() => deleteSubtask(item.id)}
                                            >
                                                <Ionicons
                                                    name="trash-outline"
                                                    size={20}
                                                    color={colors.contentSecondary}
                                                />
                                            </TouchableOpacity>
                                        </HStack>
                                    ))}
                                </VStack>
                            )}

                            {/* Category Selection */}
                            <VStack gap="xs">
                                <HStack mt="sm" gap="sm" style={{ flexWrap: 'wrap' }}>
                                    {categories.map(({ key, label, color }) => {
                                        const isActive = selectedCategory === label;
                                        return (
                                            <TouchableOpacity
                                                key={label}
                                                onPress={() =>
                                                    setSelectedCategory(isActive ? '' : label)
                                                }
                                                style={{
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 8,
                                                    backgroundColor: isActive
                                                        ? color
                                                        : colors.surfacePrimary,
                                                    borderWidth: 1,
                                                    borderColor: isActive
                                                        ? color
                                                        : colors.contentSecondary,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color: isActive
                                                            ? colors.backgroundPrimary
                                                            : colors.contentPrimary,
                                                        fontWeight: '700',
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    {label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </HStack>
                            </VStack>
                        </VStack>
                </ScrollView>

                {/* Action Buttons - Fixed at bottom */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'position' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <HStack 
                        gap="md" 
                        style={{ 
                            paddingHorizontal: 20,
                            paddingTop: 12,
                            paddingBottom: Math.max(insets.bottom, 12),
                            backgroundColor: colors.backgroundPrimary,
                            borderTopWidth: 1,
                            borderTopColor: colors.surfacePrimary,
                        }}
                    >
                        <View style={{ flex: 1 }}>
                            <Button
                                onPress={handleSaveTodo}
                                disabled={!title.trim() || isLoading}
                                style={{
                                    borderRadius: 24,
                                    backgroundColor: colors.contentPrimary,
                                    paddingVertical: SPACING['unit-3'],
                                }}
                            >
                                <TypographyText
                                    variant="body"
                                    style={{
                                        color: colors.backgroundPrimary,
                                        fontWeight: '700',
                                        fontSize: 16,
                                        lineHeight: 22,
                                    }}
                                >
                                    {isLoading ? 'Saving...' : 'Save'}
                                </TypographyText>
                            </Button>
                        </View>
                    </HStack>
                </KeyboardAvoidingView>
            </View>
        </SafeAreaView>
    );
};

export default CreateTodoScreen;
