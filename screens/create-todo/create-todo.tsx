import TypographyText from '@/components/TypographyText';
import { useUnifiedTodoStore } from '@/hooks/useUnifiedTodoStore';
import { useCategoryStore } from '@/stores/category-store';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
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
} from 'react-native';
import { Button, HStack, SPACING, VStack, useTheme } from 'react-native-heroui';
import { SafeAreaView } from 'react-native-safe-area-context';

const CreateTodoScreen = () => {
    const { theme } = useTheme();
    const { createTodo, updateTodo, todos } = useUnifiedTodoStore();
    const { categories } = useCategoryStore();
    const { todoId } = useLocalSearchParams<{ todoId?: string }>();

    // Check if we're editing an existing todo
    const isEditing = Boolean(todoId);
    const existingTodo = isEditing ? todos.find((todo) => todo.id === todoId) : null;

    const [title, setTitle] = useState(existingTodo?.title ?? '');
    const [selectedCategory, setSelectedCategory] = useState<string>(existingTodo?.category ?? '');
    const [isLoading, setIsLoading] = useState(false);
    const [reminderAt, setReminderAt] = useState<string | null>(existingTodo?.reminderAt ?? null);
    const [showPicker, setShowPicker] = useState(false);
    const [enableSubtasks, setEnableSubtasks] = useState(
        Array.isArray(existingTodo?.subtasks) ? existingTodo!.subtasks!.length > 0 : false,
    );
    const [newSubtask, setNewSubtask] = useState('');
    const [subtasks, setSubtasks] = useState((existingTodo?.subtasks ?? []).map((s) => ({ ...s })));

    // Update form when editing existing todo
    useEffect(() => {
        if (existingTodo) {
            setTitle(existingTodo.title ?? '');
            setSelectedCategory(existingTodo.category ?? '');
            setReminderAt(existingTodo.reminderAt ?? null);
            setSubtasks(existingTodo.subtasks ?? []);
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
        setSubtasks((prev) => [
            ...prev,
            { id: Math.random().toString(36).slice(2), title: trimmed, done: false },
        ]);
        setNewSubtask('');
    };

    const toggleSubtask = (id: string) => {
        setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));
    };

    const deleteSubtask = (id: string) => {
        setSubtasks((prev) => prev.filter((s) => s.id !== id));
    };

    const handleSaveTodo = async () => {
        if (!title.trim()) return;

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
                    isCompleted: false,
                    category: selectedCategory || undefined,
                    priority: 0,
                    estimatedMinutes: undefined,
                    reminderAt: reminderAt || null,
                    subtasks: enableSubtasks ? subtasks : [],
                });
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
            style={{
                flex: 1,
                backgroundColor: theme.colors.background,
            }}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }}>
                    {/* Header */}
                    <HStack
                        alignItems="center"
                        justifyContent="space-between"
                        style={{ marginBottom: 32 }}
                    >
                        <View />
                        <TouchableOpacity onPress={handleCancel}>
                            <Ionicons name="close" size={24} color={theme.colors.foreground} />
                        </TouchableOpacity>
                    </HStack>

                    {/* Title area like mock */}
                    <VStack gap="lg" style={{ flex: 1 }}>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Write a new task..."
                            placeholderTextColor={theme.colors.content3}
                            style={{
                                fontSize: 32,
                                fontWeight: '700',
                                color: theme.colors.foreground,
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
                                    borderColor: theme.colors.content3,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: enableSubtasks
                                        ? theme.colors['secondary-400']
                                        : 'transparent',
                                }}
                            >
                                {enableSubtasks && (
                                    <Ionicons
                                        name="checkmark"
                                        size={16}
                                        color={theme.colors.background}
                                    />
                                )}
                            </TouchableOpacity>
                            <TypographyText variant="body" color="default">
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
                                            placeholderTextColor={theme.colors.content3}
                                            style={{
                                                paddingHorizontal: 12,
                                                paddingVertical: 10,
                                                color: theme.colors.foreground,
                                            }}
                                            onSubmitEditing={handleAddSubtask}
                                            returnKeyType="done"
                                        />
                                    </View>
                                    <TouchableOpacity onPress={handleAddSubtask}>
                                        <Ionicons
                                            name="add-circle"
                                            size={28}
                                            color={theme.colors['secondary-400']}
                                        />
                                    </TouchableOpacity>
                                </HStack>
                                <FlatList
                                    data={subtasks}
                                    keyExtractor={(item) => item.id}
                                    renderItem={({ item }) => (
                                        <HStack
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
                                                        color={theme.colors.foreground}
                                                    />
                                                </TouchableOpacity>
                                                <Text
                                                    style={{
                                                        color: theme.colors.foreground,
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
                                                    color={theme.colors.content3}
                                                />
                                            </TouchableOpacity>
                                        </HStack>
                                    )}
                                />
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
                                                    : theme.colors.content2,
                                                borderWidth: 1,
                                                borderColor: isActive
                                                    ? color
                                                    : theme.colors.content3,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: isActive
                                                        ? theme.colors.background
                                                        : theme.colors.foreground,
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

                    {/* Action Buttons */}
                    <HStack gap="md" style={{ marginBottom: 20 }}>
                        {/* Reminder button like mock (left circle) */}
                        <TouchableOpacity
                            onPress={() => setShowPicker(true)}
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: 28,
                                backgroundColor: theme.colors.content2,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: theme.colors.content3,
                            }}
                        >
                            <Ionicons
                                name="time-outline"
                                size={22}
                                color={theme.colors.foreground}
                            />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Button
                                onPress={handleSaveTodo}
                                disabled={!title.trim() || isLoading}
                                style={{
                                    borderRadius: 24,
                                    backgroundColor: theme.colors['default-900'],
                                    paddingVertical: SPACING['unit-3'],
                                }}
                            >
                                <TypographyText
                                    variant="body"
                                    style={{
                                        color: theme.colors.background,
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
                    {showPicker && (
                        <DateTimePicker
                            value={reminderAt ? new Date(reminderAt) : new Date()}
                            mode="datetime"
                            display={Platform.OS === 'ios' ? 'inline' : 'default'}
                            onChange={(_, date) => {
                                setShowPicker(false);
                                if (date) setReminderAt(date.toISOString());
                            }}
                        />
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default CreateTodoScreen;
