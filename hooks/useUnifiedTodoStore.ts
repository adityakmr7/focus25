import { useAuthStore } from '@/stores/auth-store';
import { useTodoStore } from '@/stores/local-todo-store';
import { useSupabaseTodoStore } from '@/stores/supabase-todo-store';
import { useEffect } from 'react';

/**
 * Unified Todo Store Hook
 * Automatically selects between local and Supabase stores based on:
 * - User authentication status
 * - Pro subscription status
 * 
 * Logic:
 * - If user is authenticated AND has pro subscription → use Supabase store
 * - Otherwise → use local store
 */
export function useUnifiedTodoStore() {
    const { user, isProUser } = useAuthStore();
    const localStore = useTodoStore();
    const supabaseStore = useSupabaseTodoStore();

    // Determine which store to use
    const shouldUseSupabase = user !== null && isProUser;
    const activeStore = shouldUseSupabase ? supabaseStore : localStore;

    // Load todos when switching stores or on mount
    useEffect(() => {
        if (shouldUseSupabase && !supabaseStore.isInitialized) {
            supabaseStore.loadTodos();
        } else if (!shouldUseSupabase && !localStore.isInitialized) {
            localStore.loadTodos();
        }
    }, [shouldUseSupabase, supabaseStore.isInitialized, localStore.isInitialized]);

    // Return the active store with a unified interface
    return {
        // State
        todos: activeStore.todos,
        isLoading: activeStore.isLoading,
        error: activeStore.error,
        isInitialized: activeStore.isInitialized,
        showCompleted: activeStore.showCompleted,
        searchQuery: activeStore.searchQuery,

        // Actions
        loadTodos: activeStore.loadTodos,
        createTodo: activeStore.createTodo,
        updateTodo: activeStore.updateTodo,
        toggleTodo: activeStore.toggleTodo,
        deleteTodo: activeStore.deleteTodo,
        setShowCompleted: activeStore.setShowCompleted,
        setSearchQuery: activeStore.setSearchQuery,

        // Local-only actions (if available)
        deleteCompletedTodos: 'deleteCompletedTodos' in activeStore 
            ? (activeStore as typeof localStore).deleteCompletedTodos 
            : undefined,
        getCompletedTodos: 'getCompletedTodos' in activeStore
            ? (activeStore as typeof localStore).getCompletedTodos
            : undefined,
        getActiveTodos: 'getActiveTodos' in activeStore
            ? (activeStore as typeof localStore).getActiveTodos
            : undefined,
        exportTodos: 'exportTodos' in activeStore
            ? (activeStore as typeof localStore).exportTodos
            : undefined,
        importTodos: 'importTodos' in activeStore
            ? (activeStore as typeof localStore).importTodos
            : undefined,
        resetTodos: 'resetTodos' in activeStore
            ? (activeStore as typeof supabaseStore).resetTodos
            : undefined,

        // Store metadata
        isUsingSupabase: shouldUseSupabase,
        isUsingLocal: !shouldUseSupabase,
    };
}

