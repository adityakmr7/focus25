import { useUnifiedTodoStore } from '@/hooks/useUnifiedTodoStore';
import { groupTodosByDate } from '@/utils/dateUtils';
import { useColorTheme } from '@/hooks/useColorTheme';
import { Todo } from '@/services/local-database-service';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Box, SPACING } from 'react-native-heroui';
import { SafeAreaView } from 'react-native-safe-area-context';
import TodoSectionComponent from './components/todo-section';
import EmptyState from './components/empty-state';
import { Ionicons } from '@expo/vector-icons';

const TodoScreen: React.FC = () => {
    const colors = useColorTheme();
    const { todos, toggleTodo, loadTodos } = useUnifiedTodoStore();
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
    const onFabPress = () => {
        router.push('/(create-todo)/create-todo');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingBottom: SPACING['unit-18'],
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
                                />
                            ))}
                        </View>
                    ) : (
                        <EmptyState viewMode={viewMode} />
                    )}
                </View>
            </ScrollView>
            <Box
                style={{
                    backgroundColor: colors.contentPrimary,
                    position: 'absolute',
                    bottom: 100,
                    right: 20,
                }}
                borderRadius="full"
                p="md"
            >
                <TouchableOpacity onPress={onFabPress}>
                    <Ionicons name="add" size={24} color={colors.backgroundPrimary} />
                </TouchableOpacity>
            </Box>
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
        gap: SPACING['unit-2'],
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 24,
        width: 56,
        height: 56,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
});

export default TodoScreen;
