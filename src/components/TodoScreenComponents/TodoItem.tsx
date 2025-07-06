import { Todo, TodoCategory, TodoPriority } from '../../types/database';
import React, { useEffect } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';

interface TodoItemProps {
    todo: Todo;
    onToggle: (id: string) => void;
    onEdit: (todo: Todo) => void;
    onDelete: (id: string) => void;
    delay?: number;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onEdit, onDelete, delay = 0 }) => {
    const { theme } = useTheme();
    const animatedValue = useSharedValue(0);
    const scaleValue = useSharedValue(0.9);

    useEffect(() => {
        animatedValue.value = withDelay(delay, withTiming(1, { duration: 600 }));
        scaleValue.value = withDelay(delay, withTiming(1, { duration: 600 }));
    }, [delay]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(animatedValue.value, [0, 1], [0, 1]),
            transform: [
                { translateY: interpolate(animatedValue.value, [0, 1], [30, 0]) },
                { scale: scaleValue.value },
            ],
        };
    });

    const getPriorityColor = (priority: TodoPriority) => {
        switch (priority) {
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

    const getCategoryIcon = (category: TodoCategory) => {
        switch (category) {
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

    const isOverdue = todo.dueDate && !todo.isCompleted && new Date(todo.dueDate) < new Date();

    return (
        <Animated.View style={[styles.todoItem, { backgroundColor: theme.surface }, animatedStyle]}>
            <TouchableOpacity
                onPress={() => onToggle(todo.id)}
                style={[
                    styles.todoCheckbox,
                    {
                        backgroundColor: todo.isCompleted ? theme.accent : 'transparent',
                        borderColor: todo.isCompleted ? theme.accent : theme.textSecondary,
                    },
                ]}
            >
                {todo.isCompleted && <Ionicons name="checkmark" size={16} color="white" />}
            </TouchableOpacity>

            <View style={styles.todoContent}>
                <View style={styles.todoHeader}>
                    <Text
                        style={[
                            styles.todoTitle,
                            {
                                color: todo.isCompleted ? theme.textSecondary : theme.text,
                                textDecorationLine: todo.isCompleted ? 'line-through' : 'none',
                            },
                        ]}
                    >
                        {todo.title}
                    </Text>
                    <View style={styles.todoMetadata}>
                        <View
                            style={[
                                styles.priorityBadge,
                                { backgroundColor: getPriorityColor(todo.priority) + '20' },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.priorityText,
                                    { color: getPriorityColor(todo.priority) },
                                ]}
                            >
                                {todo.priority.toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.categoryContainer}>
                            <Ionicons
                                name={getCategoryIcon(todo.category)}
                                size={14}
                                color={theme.textSecondary}
                            />
                        </View>
                    </View>
                </View>

                {todo.description && (
                    <Text
                        style={[
                            styles.todoDescription,
                            {
                                color: todo.isCompleted ? theme.textSecondary : theme.textSecondary,
                            },
                        ]}
                    >
                        {todo.description}
                    </Text>
                )}

                {todo.dueDate && (
                    <Text
                        style={[
                            styles.todoDueDate,
                            {
                                color: isOverdue ? '#EF4444' : theme.textSecondary,
                            },
                        ]}
                    >
                        Due: {new Date(todo.dueDate).toLocaleDateString()}
                        {isOverdue && ' (Overdue)'}
                    </Text>
                )}

                {todo.tags && todo.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                        {todo.tags.slice(0, 3).map((tag, index) => (
                            <View
                                key={index}
                                style={[styles.tag, { backgroundColor: theme.accent + '20' }]}
                            >
                                <Text style={[styles.tagText, { color: theme.accent }]}>{tag}</Text>
                            </View>
                        ))}
                        {todo.tags.length > 3 && (
                            <Text style={[styles.moreTagsText, { color: theme.textSecondary }]}>
                                +{todo.tags.length - 3} more
                            </Text>
                        )}
                    </View>
                )}
            </View>

            <View style={styles.todoActions}>
                <TouchableOpacity
                    onPress={() => onEdit(todo)}
                    style={[styles.actionButton, { backgroundColor: theme.accent + '20' }]}
                >
                    <Ionicons name="create-outline" size={16} color={theme.accent} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => onDelete(todo.id)}
                    style={[styles.actionButton, { backgroundColor: '#EF444420' }]}
                >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    todoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
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
    todoCheckbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        marginTop: 2,
    },
    todoContent: {
        flex: 1,
    },
    todoHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    todoTitle: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    todoMetadata: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    categoryContainer: {
        padding: 4,
    },
    todoDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
        opacity: 0.8,
    },
    todoDueDate: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 10,
        fontWeight: '600',
    },
    moreTagsText: {
        fontSize: 10,
        fontWeight: '600',
        opacity: 0.7,
    },
    todoActions: {
        flexDirection: 'row',
        gap: 8,
        marginLeft: 8,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default TodoItem;
