import { useSettingsStore } from '@/stores/local-settings-store';
import { useTodoStore } from '@/stores/local-todo-store';
import { groupTodosByDate } from '@/utils/dateUtils';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SPACING, useTheme } from 'react-native-heroui';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderSection from './components/header-section';
import TodoSectionComponent from './components/todo-section';
import ViewToggle from './components/view-toggle';
import EmptyState from './components/empty-state';

const TodoScreen: React.FC = () => {
    const { theme } = useTheme();
    const { todos, toggleTodo, loadTodos } = useTodoStore();
    const { userName } = useSettingsStore();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Generate personalized greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        let timeGreeting = 'Good morning';

        if (hour >= 12 && hour < 17) {
            timeGreeting = 'Good afternoon';
        } else if (hour >= 17) {
            timeGreeting = 'Good evening';
        }

        return `${timeGreeting} ${userName}`;
    };

    // Load todos on component mount
    useEffect(() => {
        loadTodos();
    }, [loadTodos]);

    // Group todos by date
    const todoSections = useMemo(() => {
        return groupTodosByDate(todos);
    }, [todos]);

    const handleToggleTodo = useCallback(
        (id: string) => {
            toggleTodo(id);
        },
        [toggleTodo],
    );

    const handleEditTodo = useCallback((todo: any) => {
        router.push(`/(create-todo)/create-todo?todoId=${todo.id}`);
    }, []);

    const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
        setViewMode(mode);
    }, []);

    // Helper functions
    const getCurrentGreeting = () => {
        return getGreeting();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingBottom: SPACING['unit-18'],
                }}
                style={{ flex: 1 }}
            >
                <View style={styles.content}>
                    {/* Header Section */}
                    <HeaderSection
                        greeting={getCurrentGreeting()}
                        subtitle={
                            todos.length > 0
                                ? 'Here are your plan for today'
                                : 'Ready to get organized?'
                        }
                    />

                    {/* View Toggle */}
                    <ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />

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
        gap: 24,
    },
});

export default TodoScreen;
