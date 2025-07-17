import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    Platform,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useTodoStore } from '../store/todoStore';
import { Todo } from '../types/database';
import TodoFormBottomSheet, {
    TodoFormBottomSheetMethods,
} from '../components/TodoScreenComponents/TodoFormBottomSheet';
import TodoItem from '../components/TodoScreenComponents/TodoItem';
import { useTheme } from '../hooks/useTheme';

const TodoScreen: React.FC = () => {
    const { theme } = useTheme();
    const {
        todos,
        error,
        initializeStore,
        createTodo,
        updateTodo,
        toggleTodo,
        deleteTodo,
        syncWithDatabase,
    } = useTodoStore();

    const todoFormRef = useRef<TodoFormBottomSheetMethods>(null);
    const [refreshing, setRefreshing] = useState(false);
    const headerAnimatedValue = useSharedValue(0);

    useEffect(() => {
        const initialize = async () => {
            try {
                await initializeStore();
            } catch (error) {
                console.error('Failed to initialize todo store:', error);
            }
        };
        void initialize();
        headerAnimatedValue.value = withTiming(1, { duration: 800 });
    }, [initializeStore]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await syncWithDatabase();
        } finally {
            setRefreshing(false);
        }
    }, [syncWithDatabase]);

    const handleSaveTodo = useCallback(
        async (todoData: Partial<Todo>) => {
            if (todoData.id) {
                // Update existing todo
                await updateTodo(todoData.id, todoData);
            } else {
                // Create new todo
                // Ensure required fields are present and types are correct
                if (!todoData.title) {
                    Alert.alert('Validation Error', 'Title is required.');
                    return;
                }
                const { title } = todoData;
                await createTodo({
                    title,
                });
            }
        },
        [createTodo, updateTodo],
    );

    const handleOpenCreateForm = useCallback(() => {
        todoFormRef.current?.openForCreate();
    }, []);

    const handleOpenEditForm = useCallback((todo: Todo) => {
        todoFormRef.current?.openForEdit(todo);
    }, []);

    const handleFormCancel = useCallback(() => {
        // Bottom sheet will handle closing itself
    }, []);

    const handleDeleteTodo = useCallback(
        (id: string) => {
            Alert.alert('Delete Todo', 'Are you sure you want to delete this todo?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteTodo(id) },
            ]);
        },
        [deleteTodo],
    );

    const headerAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(headerAnimatedValue.value, [0, 1], [0, 1]),
            transform: [
                {
                    translateY: interpolate(headerAnimatedValue.value, [0, 1], [-30, 0]),
                },
            ],
        };
    });

    if (error) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.errorContainer}>
                    <Ionicons name="warning-outline" size={48} color={theme.textSecondary} />
                    <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: theme.accent }]}
                        onPress={initializeStore}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <Animated.View style={[styles.header, headerAnimatedStyle]}>
                <Text style={[styles.headerDate, { color: theme.text }]}>17 July</Text>
            </Animated.View>

            {/* Todo List */}
            <FlatList
                data={todos}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <TodoItem
                        todo={item}
                        onToggle={toggleTodo}
                        onEdit={handleOpenEditForm}
                        onDelete={handleDeleteTodo}
                        delay={index * 50}
                    />
                )}
                contentContainerStyle={styles.todoList}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={theme.accent}
                        colors={[theme.accent]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons
                            name="checkmark-done-outline"
                            size={64}
                            color={theme.textSecondary}
                        />
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>No todos yet</Text>
                        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                            Tap the + button to create your first todo
                        </Text>
                    </View>
                }
            />

            {/* Floating Action Button */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.accent }]}
                onPress={handleOpenCreateForm}
            >
                <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>

            {/* Todo Form Bottom Sheet */}
            <TodoFormBottomSheet
                ref={todoFormRef}
                onSave={handleSaveTodo}
                onCancel={handleFormCancel}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 16,
    },
    headerDate: {
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    todoList: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        textAlign: 'center',
        opacity: 0.7,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default TodoScreen;
