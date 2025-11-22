import TypographyText from '@/components/TypographyText';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { HStack, useTheme } from 'react-native-heroui';
import { useUnifiedTodoStore } from '@/hooks/useUnifiedTodoStore';
import { useColorTheme } from '@/hooks/useColorTheme';

interface TodoCardProps {
    todo: any;
    onToggle: (id: string) => void;
    onEdit: (todo: any) => void;
}

const SubTaskItem = ({ todo }: { todo: any }) => {
    const colors = useColorTheme();
    const { updateTodo } = useUnifiedTodoStore();
    return (
        <HStack ml="xl">
            {Array.isArray((todo as any)?.subtasks) && (todo as any).subtasks.length > 0 && (
                <View style={styles.subtasksContainer}>
                    {(todo as any).subtasks.map(
                        (s: { id: string; title: string; done: boolean }, idx: number) => {
                            return (
                                <View key={s.id || idx.toString()} style={styles.subtaskRow}>
                                    <TouchableOpacity
                                        onPress={async () => {
                                            try {
                                                const current = Array.isArray(
                                                    (todo as any).subtasks,
                                                )
                                                    ? [...(todo as any).subtasks]
                                                    : [];
                                                const updated = current.map((item: any) =>
                                                    (item.id || '') === (s.id || '')
                                                        ? { ...item, done: !item.done }
                                                        : item,
                                                );
                                                // Cast to any so we can pass additional field
                                                await (updateTodo as any)(todo.id, {
                                                    subtasks: updated,
                                                });
                                            } catch {}
                                        }}
                                        style={[
                                            styles.subtaskCheckbox,
                                            {
                                                borderColor: colors.surfacePrimary,
                                                backgroundColor: s.done
                                                    ? colors.secondary
                                                    : 'transparent',
                                            },
                                        ]}
                                    >
                                        {s.done && (
                                            <Ionicons
                                                name="checkmark"
                                                size={12}
                                                color={colors.backgroundPrimary}
                                            />
                                        )}
                                    </TouchableOpacity>
                                    <Text
                                        style={[
                                            styles.subtaskText,
                                            {
                                                color: colors.contentPrimary,
                                                textDecorationLine: s.done
                                                    ? 'line-through'
                                                    : 'none',
                                                opacity: s.done ? 0.6 : 1,
                                            },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {s.title}
                                    </Text>
                                </View>
                            );
                        },
                    )}
                </View>
            )}
        </HStack>
    );
};

const TodoCard: React.FC<TodoCardProps> = ({ todo, onToggle, onEdit }) => {
    const colors = useColorTheme();
    const { updateTodo } = useUnifiedTodoStore();
    const categoryColors: Record<string, string> = {
        Work: 'green',
        Health: 'red',
        Personal: 'yellow',
    };
    console.log('todo', todo);

    // Safety check for todo object
    if (!todo || !todo.id) {
        return null;
    }

    // Minimalist row layout (list) to match mock
    return (
        <>
            <TouchableOpacity
                key={todo.id}
                style={[
                    styles.rowContainer,
                    {
                        borderBottomColor: colors.surfacePrimary,
                    },
                ]}
                onPress={() => onToggle(todo.id)}
                onLongPress={() => onEdit(todo)}
                activeOpacity={0.8}
            >
                <HStack alignItems="center" gap="md">
                    <View
                        style={[
                            styles.checkbox,
                            {
                                backgroundColor: Boolean(todo.isCompleted)
                                    ? colors.secondary
                                    : colors.primary,
                                borderColor: colors.surfacePrimary,
                            },
                        ]}
                    >
                        {Boolean(todo.isCompleted) && (
                            <Ionicons name="checkmark" size={14} color={colors.backgroundPrimary} />
                        )}
                    </View>

                    <View style={styles.textContainer}>
                        <TypographyText
                            variant="body"
                            style={[styles.title, { color: colors.contentPrimary }]}
                            numberOfLines={2}
                        >
                            {todo.title || 'Untitled Todo'}
                        </TypographyText>

                        {todo?.category && (
                            <View style={styles.badgeRow}>
                                <View
                                    style={[
                                        styles.badge,
                                        {
                                            backgroundColor: colors.backgroundPrimary,
                                            borderColor:
                                                categoryColors[String(todo.category)] ||
                                                colors.surfacePrimary,
                                            borderWidth: 1,
                                        },
                                    ]}
                                >
                                    <TypographyText
                                        variant="caption"
                                        style={[
                                            styles.badgeText,
                                            {
                                                color:
                                                    categoryColors[String(todo.category)] ||
                                                    colors.contentPrimary,
                                            },
                                        ]}
                                    >
                                        {String(todo.category)}
                                    </TypographyText>
                                </View>
                            </View>
                        )}
                    </View>
                    {/* Subtasks */}
                </HStack>
            </TouchableOpacity>
            <SubTaskItem todo={todo} />
        </>
    );
};

const styles = StyleSheet.create({
    rowContainer: {
        width: '100%',
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    rowLeft: {
        flexDirection: 'column',
        // alignItems: 'center',
        gap: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 22,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        opacity: 0.8,
    },
    subtasksContainer: {
        marginTop: 8,
        gap: 6,
    },
    subtaskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    subtaskCheckbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    subtaskText: {
        fontSize: 13,
        fontWeight: '500',
    },
});

export default TodoCard;
