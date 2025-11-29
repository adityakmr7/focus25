import { useUnifiedTodoStore } from '@/hooks/useUnifiedTodoStore';
import { groupTodosByDate } from '@/utils/dateUtils';
import { useColorTheme } from '@/hooks/useColorTheme';
import { Todo } from '@/services/local-database-service';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TodoSectionComponent from './components/todo-section';
import EmptyState from './components/empty-state';
import { Ionicons } from '@expo/vector-icons';

const TodoScreen: React.FC = () => {
    const colors = useColorTheme();
    const { todos, toggleTodo, loadTodos, deleteTodo } = useUnifiedTodoStore();
    const [viewMode] = useState<'grid' | 'list'>('grid');

    // Load todos on component mount
    useEffect(() => {
        loadTodos();
    }, [loadTodos]);

    // Group todos by date
    // Normalize todos to local Todo format for groupTodosByDate
    const normalizedTodos = useMemo(() => {
        return todos.map((todo) => {
            // If it's a Supabase todo, convert it to local format
            const supabaseTodo = todo as any;
            if ('created_at' in supabaseTodo && !('createdAt' in supabaseTodo)) {
                return {
                    ...supabaseTodo,
                    createdAt: supabaseTodo.created_at,
                    priority: supabaseTodo.priority ?? 0,
                    actualMinutes: supabaseTodo.actualMinutes ?? 0,
                } as Todo;
            }
            return todo as Todo;
        });
    }, [todos]);

    const todoSections = useMemo(() => {
        return groupTodosByDate(normalizedTodos);
    }, [normalizedTodos]);

    const handleToggleTodo = useCallback(
        (id: string) => {
            toggleTodo(id);
        },
        [toggleTodo],
    );

    const handleEditTodo = useCallback((todo: any) => {
        router.push(`/(create-todo)/create-todo?todoId=${todo.id}`);
    }, []);

    const handleDeleteTodo = useCallback(
        async (id: string) => {
            try {
                await deleteTodo(id);
            } catch (error) {
                console.error('Failed to delete todo:', error);
            }
        },
        [deleteTodo],
    );
    const onFabPress = () => {
        router.push('/(create-todo)/create-todo');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingBottom: 72,
                }}
                style={{ flex: 1 }}
            >
                <View style={styles.content}>
                    {/* Todo Sections or Empty State */}
                    {todoSections.length > 0 ? (
                        <View style={styles.todoSections}>
                            {todoSections.map((section) => (
                                <TodoSectionComponent
                                    key={section.title}
                                    section={section}
                                    viewMode={viewMode}
                                    onToggleTodo={handleToggleTodo}
                                    onEditTodo={handleEditTodo}
                                    onDeleteTodo={handleDeleteTodo}
                                />
                            ))}
                        </View>
                    ) : (
                        <EmptyState viewMode={viewMode} />
                    )}
                </View>
            </ScrollView>
            <View
                style={[
                    styles.fab,
                    {
                        backgroundColor: colors.contentPrimary,
                        bottom: 45,
                    },
                ]}
            >
                <TouchableOpacity onPress={onFabPress} style={styles.fabButton}>
                    <Ionicons name="add" size={24} color={colors.backgroundPrimary} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    todoSections: {
        gap: 8,
    },
    fab: {
        position: 'absolute',
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    fabButton: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default TodoScreen;
