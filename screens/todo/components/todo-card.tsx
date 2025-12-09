import TypographyText from '@/components/TypographyText';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useUnifiedTodoStore } from '@/hooks/useUnifiedTodoStore';
import { useColorTheme } from '@/hooks/useColorTheme';

interface TodoCardProps {
    todo: any;
    onToggle: (id: string) => void;
    onEdit: (todo: any) => void;
    onDelete: (id: string) => void;
}

const SubTaskItem = ({ todo }: { todo: any }) => {
    const colors = useColorTheme();
    const { updateTodo } = useUnifiedTodoStore();
    return (
        <View style={styles.subtaskWrapper}>
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
        </View>
    );
};

const TodoCard: React.FC<TodoCardProps> = ({ todo, onToggle, onEdit, onDelete }) => {
    const colors = useColorTheme();
    const translateX = useSharedValue(0);
    const deleteOpacity = useSharedValue(0);
    const SWIPE_THRESHOLD = -80;

    // All hooks must be called before any conditional returns
    const panGesture = Gesture.Pan()
        .activeOffsetX([-10, 10])
        .onStart(() => {
            translateX.value = 0;
            deleteOpacity.value = 0;
        })
        .onUpdate((event) => {
            const clampedTranslateX = Math.min(0, event.translationX);
            translateX.value = clampedTranslateX;

            // Show delete background as user swipes
            const progress = Math.abs(clampedTranslateX) / Math.abs(SWIPE_THRESHOLD);
            deleteOpacity.value = Math.min(1, progress);
        })
        .onEnd((event) => {
            const shouldDelete = event.translationX <= SWIPE_THRESHOLD;

            if (shouldDelete) {
                // Animate out and delete
                translateX.value = withTiming(-400, { duration: 300 });
                deleteOpacity.value = withTiming(1, { duration: 300 });
                runOnJS(onDelete)(todo?.id || '');
            } else {
                // Snap back to original position
                translateX.value = withSpring(0, { damping: 15, stiffness: 300 });
                deleteOpacity.value = withTiming(0, { duration: 200 });
            }
        });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    const deleteBackgroundStyle = useAnimatedStyle(() => {
        return {
            opacity: deleteOpacity.value,
        };
    });

    const categoryColors: Record<string, string> = {
        Work: 'green',
        Health: 'red',
        Personal: 'yellow',
    };

    // Safety check for todo object - must be after all hooks
    if (!todo || !todo.id) {
        return null;
    }

    // Minimalist row layout (list) to match mock
    return (
        <>
            <View style={styles.todoContainer}>
                <Animated.View
                    style={[
                        styles.deleteBackground,
                        deleteBackgroundStyle,
                        { backgroundColor: colors.danger },
                    ]}
                >
                    <View style={styles.deleteContent}>
                        <Ionicons name="trash" size={24} color={colors.backgroundPrimary} />
                        <Text style={[styles.deleteText, { color: colors.backgroundPrimary }]}>
                            Delete
                        </Text>
                    </View>
                </Animated.View>
                <GestureDetector gesture={panGesture}>
                    <Animated.View
                        style={[
                            styles.rowContainer,
                            {
                                borderBottomColor: colors.surfacePrimary,
                                backgroundColor: colors.backgroundPrimary,
                            },
                            animatedStyle,
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.todoContentWrapper}
                            onPress={() => onToggle(todo.id)}
                            onLongPress={() => onEdit(todo)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.todoRow}>
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
                                        <Ionicons
                                            name="checkmark"
                                            size={14}
                                            color={colors.backgroundPrimary}
                                        />
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
                                                                categoryColors[
                                                                    String(todo.category)
                                                                ] || colors.contentPrimary,
                                                        },
                                                    ]}
                                                >
                                                    {String(todo.category)}
                                                </TypographyText>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                </GestureDetector>
            </View>
            <SubTaskItem todo={todo} />
        </>
    );
};

const styles = StyleSheet.create({
    todoContainer: {
        position: 'relative',
        width: '100%',
    },
    rowContainer: {
        width: '100%',
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    todoContentWrapper: {
        width: '100%',
    },
    deleteBackground: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        borderRadius: 0,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 20,
        zIndex: -1,
    },
    deleteContent: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    deleteText: {
        fontSize: 12,
        fontWeight: '600',
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
    subtaskWrapper: {
        marginLeft: 32,
    },
    todoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
});

export default TodoCard;
