import { create } from 'zustand';
import { mockTodos } from './mock-data/todos';

export interface Todo {
    id: string;
    title: string;
    description: string;
    icon: string;
    isCompleted: boolean;
    createdAt: Date;
    completedAt: Date | null;
}

interface TodoState {
    todos: Todo[];
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;

    // Filters
    showCompleted: boolean;
    searchQuery: string;

    // Actions
    loadTodos: () => Promise<void>;
    createTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'isCompleted'>) => Promise<void>;
    updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
    toggleTodo: (id: string) => Promise<void>;
    deleteTodo: (id: string) => Promise<void>;
    deleteCompletedTodos: () => Promise<void>;
    getCompletedTodos: () => Todo[];
    getActiveTodos: () => Todo[];

    // Filters
    setShowCompleted: (show: boolean) => void;
    setSearchQuery: (query: string) => void;

    // Export/Import
    syncWithDatabase: () => Promise<void>;
}

export const useTodoStore = create<TodoState>((set, get) => ({
    todos: [],
    isLoading: false,
    error: null,
    isInitialized: false,

    // Filters
    showCompleted: true,
    searchQuery: '',

    loadTodos: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true, error: null });

        try {
            // Simulate API call delay
            await new Promise((resolve) => setTimeout(resolve, 1000));
            set({ todos: mockTodos, isInitialized: true });
        } catch {
            set({ error: 'Failed to load todos' });
        } finally {
            set({ isLoading: false });
        }
    },

    createTodo: async (todoData) => {
        set({ isLoading: true, error: null });

        try {
            const newTodo: Todo = {
                id: Date.now().toString(),
                title: todoData.title,
                description: todoData.description,
                icon: todoData.icon || '',
                isCompleted: false,
                createdAt: new Date(),
                completedAt: null,
            };
            set({ todos: [...get().todos, newTodo] });
        } catch {
            set({ error: 'Failed to create todo', isLoading: false });
        } finally {
            set({ isLoading: false });
        }
    },

    updateTodo: async (id, updates) => {
        set({ isLoading: true, error: null });

        try {
            set({
                todos: get().todos.map((todo) => (todo.id === id ? { ...todo, ...updates } : todo)),
            });
        } catch (error) {
            console.error('Failed to update todo:', error);
            set({ error: 'Failed to update todo', isLoading: false });
        } finally {
            set({ isLoading: false });
        }
    },

    toggleTodo: async (id) => {
        set({
            todos: get().todos.map((todo) =>
                todo.id === id
                    ? {
                          ...todo,
                          isCompleted: !todo.isCompleted,
                          completedAt: !todo.isCompleted ? new Date() : null,
                      }
                    : todo,
            ),
        });
    },

    deleteTodo: async (id) => {
        set({ isLoading: true, error: null });

        try {
            set({ todos: get().todos.filter((todo) => todo.id !== id) });
        } catch (error) {
            console.error('Failed to delete todo:', error);
            set({ error: 'Failed to delete todo', isLoading: false });
        } finally {
            set({ isLoading: false });
        }
    },

    deleteCompletedTodos: async () => {
        try {
            // Update widget with updated todo data
        } catch (error) {
            console.error('Failed to delete completed todos:', error);
            set({ error: 'Failed to delete completed todos' });
        }
    },

    getTodosByCategory: () => {
        return get().todos;
    },

    getTodosByPriority: () => {
        return get().todos;
    },

    getCompletedTodos: () => {
        return get().todos.filter((todo) => todo.isCompleted);
    },

    getActiveTodos: () => {
        return get().todos.filter((todo) => !todo.isCompleted);
    },

    // Filters
    setShowCompleted: (show) => set({ showCompleted: show }),
    setSearchQuery: (query) => set({ searchQuery: query }),

    syncWithDatabase: async () => {},
}));
