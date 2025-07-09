import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { Todo, TodoPriority, TodoCategory } from '../../types/database';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
} from 'react-native-reanimated';

interface TodoFormProps {
    initialTodo?: Todo;
    onSave: (todo: Partial<Todo>) => void;
    onCancel: () => void;
}

const TodoForm: React.FC<TodoFormProps> = ({ initialTodo, onSave, onCancel }) => {
    const { theme } = useTheme();
    const [title, setTitle] = useState(initialTodo?.title || '');
    const [description, setDescription] = useState(initialTodo?.description || '');
    const [priority, setPriority] = useState(initialTodo?.priority || TodoPriority.MEDIUM);
    const [category, setCategory] = useState(initialTodo?.category || TodoCategory.PERSONAL);
    const [dueDate, setDueDate] = useState(initialTodo?.dueDate || '');
    const [tags, setTags] = useState(initialTodo?.tags?.join(', ') || '');

    const animatedValue = useSharedValue(0);

    useEffect(() => {
        animatedValue.value = withTiming(1, { duration: 600 });
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(animatedValue.value, [0, 1], [0, 1]),
            transform: [{ translateY: interpolate(animatedValue.value, [0, 1], [30, 0]) }],
        };
    });

    const handleSave = () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title for your todo');
            return;
        }

        const todoData: Partial<Todo> = {
            title: title.trim(),
            description: description.trim() || undefined,
            priority,
            category,
            dueDate: dueDate || undefined,
            tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
        };

        if (initialTodo) {
            todoData.id = initialTodo.id;
        }

        onSave(todoData);
    };

    const getPriorityColor = (priorityLevel: TodoPriority) => {
        switch (priorityLevel) {
            case TodoPriority.URGENT:
                return '#EF4444';
            case TodoPriority.HIGH:
                return '#F59E0B';
            case TodoPriority.MEDIUM:
                return '#3B82F6';
            case TodoPriority.LOW:
                return '#10B981';
            default:
                return theme.textSecondary;
        }
    };

    const getCategoryIcon = (categoryType: TodoCategory) => {
        switch (categoryType) {
            case TodoCategory.WORK:
                return 'briefcase-outline';
            case TodoCategory.PERSONAL:
                return 'person-outline';
            case TodoCategory.HEALTH:
                return 'fitness-outline';
            case TodoCategory.LEARNING:
                return 'book-outline';
            case TodoCategory.SHOPPING:
                return 'basket-outline';
            case TodoCategory.PROJECTS:
                return 'folder-outline';
            case TodoCategory.HABITS:
                return 'repeat-outline';
            default:
                return 'list-outline';
        }
    };

    return (
        <Animated.View style={[styles.container, { backgroundColor: theme.background }, animatedStyle]}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>
                            {initialTodo ? 'Edit Todo' : 'New Todo'}
                        </Text>
                        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.formCard, { backgroundColor: theme.surface }]}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.text }]}>Title</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: theme.background,
                                        borderColor: theme.textSecondary + '30',
                                        color: theme.text,
                                    },
                                ]}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Enter todo title..."
                                placeholderTextColor={theme.textSecondary}
                                returnKeyType="next"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.text }]}>Description</Text>
                            <TextInput
                                style={[
                                    styles.textArea,
                                    {
                                        backgroundColor: theme.background,
                                        borderColor: theme.textSecondary + '30',
                                        color: theme.text,
                                    },
                                ]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Enter description (optional)..."
                                placeholderTextColor={theme.textSecondary}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.text }]}>Priority</Text>
                            <View style={styles.priorityContainer}>
                                {Object.values(TodoPriority).map((priorityLevel) => (
                                    <TouchableOpacity
                                        key={priorityLevel}
                                        style={[
                                            styles.priorityButton,
                                            {
                                                backgroundColor:
                                                    priority === priorityLevel
                                                        ? getPriorityColor(priorityLevel) + '20'
                                                        : theme.background,
                                                borderColor:
                                                    priority === priorityLevel
                                                        ? getPriorityColor(priorityLevel)
                                                        : theme.textSecondary + '30',
                                            },
                                        ]}
                                        onPress={() => setPriority(priorityLevel)}
                                    >
                                        <Text
                                            style={[
                                                styles.priorityText,
                                                {
                                                    color:
                                                        priority === priorityLevel
                                                            ? getPriorityColor(priorityLevel)
                                                            : theme.textSecondary,
                                                },
                                            ]}
                                        >
                                            {priorityLevel.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.text }]}>Category</Text>
                            <View style={styles.categoryContainer}>
                                {Object.values(TodoCategory).map((categoryType) => (
                                    <TouchableOpacity
                                        key={categoryType}
                                        style={[
                                            styles.categoryButton,
                                            {
                                                backgroundColor:
                                                    category === categoryType
                                                        ? theme.accent + '20'
                                                        : theme.background,
                                                borderColor:
                                                    category === categoryType
                                                        ? theme.accent
                                                        : theme.textSecondary + '30',
                                            },
                                        ]}
                                        onPress={() => setCategory(categoryType)}
                                    >
                                        <Ionicons
                                            name={getCategoryIcon(categoryType)}
                                            size={16}
                                            color={
                                                category === categoryType
                                                    ? theme.accent
                                                    : theme.textSecondary
                                            }
                                        />
                                        <Text
                                            style={[
                                                styles.categoryText,
                                                {
                                                    color:
                                                        category === categoryType
                                                            ? theme.accent
                                                            : theme.textSecondary,
                                                },
                                            ]}
                                        >
                                            {categoryType.charAt(0).toUpperCase() +
                                                categoryType.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.text }]}>Due Date</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: theme.background,
                                        borderColor: theme.textSecondary + '30',
                                        color: theme.text,
                                    },
                                ]}
                                value={dueDate}
                                onChangeText={setDueDate}
                                placeholder="YYYY-MM-DD (optional)"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.text }]}>Tags</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: theme.background,
                                        borderColor: theme.textSecondary + '30',
                                        color: theme.text,
                                    },
                                ]}
                                value={tags}
                                onChangeText={setTags}
                                placeholder="Enter tags separated by commas..."
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.cancelButton, { backgroundColor: theme.surface }]}
                            onPress={onCancel}
                        >
                            <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: theme.accent }]}
                            onPress={handleSave}
                        >
                            <Text style={styles.saveButtonText}>
                                {initialTodo ? 'Update' : 'Create'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    formCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        fontWeight: '500',
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        fontWeight: '500',
        height: 100,
    },
    priorityContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    priorityButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    priorityText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        gap: 6,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});

export default TodoForm;
