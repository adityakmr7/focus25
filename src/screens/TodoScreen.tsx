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
    const calendarRef = useRef<FlatList>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const headerAnimatedValue = useSharedValue(0);

    // Generate calendar days for the horizontal calendar
    const generateCalendarDays = () => {
        const days = [];
        const today = new Date();

        // Generate 14 days (7 before and 7 after today)
        for (let i = -7; i <= 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            days.push({
                date,
                day: date.getDate().toString(),
                dayName: date.toLocaleDateString('en-GB', { weekday: 'short' }),
                dateString: date.toISOString().split('T')[0],
            });
        }

        return days;
    };

    // Helper function to check if two dates are the same day
    const isSameDay = (date1: Date, date2: Date) => {
        return date1.toDateString() === date2.toDateString();
    };

    // Filter todos based on selected date
    const filteredTodos = todos.filter((todo) => {
        if (!todo.createdAt) return false;
        const todoDate = new Date(todo.createdAt);
        return isSameDay(todoDate, selectedDate);
    });

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

        // Scroll to today's date (index 7 in the 15-day calendar)
        setTimeout(() => {
            calendarRef.current?.scrollToIndex({ index: 7, animated: true, viewPosition: 0.5 });
        }, 100);
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

            {/* Horizontal Calendar */}
            <View style={styles.calendarContainer}>
                <FlatList
                    ref={calendarRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={generateCalendarDays()}
                    keyExtractor={(item) => item.dateString}
                    getItemLayout={(data, index) => ({
                        length: 68,
                        offset: 68 * index,
                        index,
                    })}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.calendarDay,
                                {
                                    backgroundColor: isSameDay(item.date, selectedDate)
                                        ? theme.accent
                                        : theme.background,
                                },
                            ]}
                            onPress={() => setSelectedDate(item.date)}
                        >
                            <Text
                                style={[
                                    styles.calendarDayText,
                                    {
                                        color: isSameDay(item.date, selectedDate)
                                            ? 'white'
                                            : theme.textSecondary,
                                    },
                                ]}
                            >
                                {item.dayName}
                            </Text>
                            <Text
                                style={[
                                    styles.calendarDateText,
                                    {
                                        color: isSameDay(item.date, selectedDate)
                                            ? 'white'
                                            : theme.text,
                                    },
                                ]}
                            >
                                {item.day}
                            </Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.calendarList}
                />
            </View>

            {/* Todo List */}
            <FlatList
                data={filteredTodos}
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
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>
                            No todos for this date
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                            Tap the + button to create a todo for{' '}
                            {selectedDate.toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'long',
                            })}
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
    calendarContainer: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    calendarList: {
        paddingHorizontal: 16,
        gap: 8,
    },
    calendarDay: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
        height: 70,
        marginHorizontal: 4,
        borderRadius: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    calendarDayText: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    calendarDateText: {
        fontSize: 16,
        fontWeight: '700',
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
