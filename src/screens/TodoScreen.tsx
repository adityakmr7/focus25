import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';
import { useTodoStore } from '../store/todoStore';
import { useTheme } from '../providers/ThemeProvider';
import { Todo } from '../types/database';
import TodoForm from '../components/TodoScreenComponents/TodoForm';
import TodoItem from '../components/TodoScreenComponents/TodoItem';

const TodoScreen: React.FC = () => {
    const { theme } = useTheme();
    const {
        todos,
        error,
        showCompleted,
        searchQuery,
        initializeStore,
        createTodo,
        updateTodo,
        toggleTodo,
        deleteTodo,
        deleteCompletedTodos,
        setShowCompleted,
        setSearchQuery,
        getFilteredTodos,
        getTodoStats,
        syncWithDatabase,
    } = useTodoStore();

    const [showForm, setShowForm] = useState(false);
    const [editingTodo, setEditingTodo] = useState<Todo | undefined>();
    const [refreshing, setRefreshing] = useState(false);
    const headerAnimatedValue = useSharedValue(0);
    const statsAnimatedValue = useSharedValue(0);

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
        statsAnimatedValue.value = withDelay(200, withTiming(1, { duration: 800 }));
    }, [initializeStore]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await syncWithDatabase();
        } finally {
            setRefreshing(false);
        }
    }, [syncWithDatabase]);

    const handleCreateTodo = useCallback(
        async (todoData: Omit<Todo, 'id' | 'createdAt' | 'isCompleted'>) => {
            await createTodo(todoData);
        },
        [createTodo],
    );

    const handleUpdateTodo = useCallback(
        async (todoData: Omit<Todo, 'id' | 'createdAt' | 'isCompleted'>) => {
            if (editingTodo) {
                await updateTodo(editingTodo.id, todoData);
                setEditingTodo(undefined);
            }
        },
        [editingTodo, updateTodo],
    );

    const handleDeleteTodo = useCallback(
        (id: string) => {
            Alert.alert('Delete Todo', 'Are you sure you want to delete this todo?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteTodo(id) },
            ]);
        },
        [deleteTodo],
    );

    const handleDeleteCompleted = useCallback(() => {
        const completedCount = todos.filter((t) => t.isCompleted).length;
        if (completedCount === 0) {
            Alert.alert('No Completed Todos', 'There are no completed todos to delete.');
            return;
        }

        Alert.alert(
            'Delete Completed Todos',
            `Are you sure you want to delete ${completedCount} completed todo${completedCount > 1 ? 's' : ''}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: deleteCompletedTodos },
            ],
        );
    }, [todos, deleteCompletedTodos]);

    const filteredTodos = getFilteredTodos();
    const stats = getTodoStats();

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

    const statsAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(statsAnimatedValue.value, [0, 1], [0, 1]),
            transform: [
                {
                    translateY: interpolate(statsAnimatedValue.value, [0, 1], [20, 0]),
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
                <View style={styles.headerContent}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Todos</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                        Stay organized and productive
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.accent }]}
                    onPress={() => setShowForm(true)}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </Animated.View>

            {/* Stats */}
            <Animated.View style={[styles.statsContainer, statsAnimatedStyle]}>
                <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.pending}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Pending</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.completed}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                        Completed
                    </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.overdue}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Overdue</Text>
                </View>
            </Animated.View>

            {/* Search and Filters */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchInput, { backgroundColor: theme.surface }]}>
                    <Ionicons name="search" size={20} color={theme.textSecondary} />
                    <TextInput
                        style={[styles.searchTextInput, { color: theme.text }]}
                        placeholder="Search todos..."
                        placeholderTextColor={theme.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <View style={styles.filterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                {
                                    backgroundColor: showCompleted ? theme.accent : theme.surface,
                                },
                            ]}
                            onPress={() => setShowCompleted(!showCompleted)}
                        >
                            <Text
                                style={[
                                    styles.filterButtonText,
                                    { color: showCompleted ? 'white' : theme.text },
                                ]}
                            >
                                Show Completed
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.filterButton, { backgroundColor: theme.surface }]}
                            onPress={handleDeleteCompleted}
                        >
                            <Text style={[styles.filterButtonText, { color: theme.text }]}>
                                Clear Completed
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>

            {/* Todo List */}
            <FlatList
                data={filteredTodos}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <TodoItem
                        todo={item}
                        onToggle={toggleTodo}
                        onEdit={(todo) => {
                            setEditingTodo(todo);
                            setShowForm(true);
                        }}
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

            {/* Todo Form Modal */}
            <TodoForm
                visible={showForm}
                onClose={() => {
                    setShowForm(false);
                    setEditingTodo(undefined);
                }}
                todo={editingTodo}
                onSubmit={editingTodo ? handleUpdateTodo : handleCreateTodo}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 16,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 16,
        marginTop: 4,
        opacity: 0.7,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginBottom: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
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
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        opacity: 0.7,
    },
    searchContainer: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    searchInput: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    searchTextInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
    },
    filterContainer: {
        marginBottom: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    todoList: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
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

    // Modal styles
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    saveButton: {
        fontSize: 16,
        fontWeight: '600',
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    formGroup: {
        marginBottom: 24,
    },
    formRow: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    formLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    formInput: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        fontSize: 16,
    },
    multilineInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    priorityContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    priorityButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    priorityButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    categoryButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: 8,
    },
    categoryButtonText: {
        fontSize: 10,
        fontWeight: '600',
    },
    tagInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tagInput: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        fontSize: 14,
    },
    addTagButton: {
        padding: 8,
    },
    selectedTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    selectedTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    selectedTagText: {
        fontSize: 12,
        fontWeight: '600',
    },
});

export default TodoScreen;
