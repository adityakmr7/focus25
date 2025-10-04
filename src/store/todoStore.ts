import { create } from 'zustand';
import { databaseService } from '../data/database';
import { Todo } from '../types/database';
import { v4 as uuidv4 } from 'uuid';
import { widgetService } from '../services/widgetService';
import { useAuthStore } from './authStore';

interface TodoState {
    todos: Todo[];
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;

    // Filters
    showCompleted: boolean;
    searchQuery: string;

    // Actions
    initializeStore: () => Promise<void>;
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

    // Statistics

    // Export/Import
    exportTodosToCSV: () => string;
    syncWithDatabase: () => Promise<void>;
}

const defaultTodos: Omit<Todo, 'id' | 'createdAt' | 'isCompleted'>[] = [];

export const useTodoStore = create<TodoState>((set, get) => ({
    todos: [],
    isLoading: false,
    error: null,
    isInitialized: false,

    // Filters
    selectedCategory: 'all',
    selectedPriority: 'all',
    showCompleted: true,
    searchQuery: '',

    initializeStore: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true, error: null });

        try {
            // Initialize database table if needed
            await databaseService.initializeTodos();

            // Get current user from auth store
            const authStore = useAuthStore.getState();
            const currentUser = authStore.user;

            // Load existing todos (filtered by user if authenticated)
            const savedTodos = await databaseService.getTodos(currentUser?.uid);
            console.log('currentUser', currentUser?.uid);
            // If no todos exist, create default ones
            if (savedTodos.length === 0) {
                const todosToCreate = defaultTodos.map((todo) => ({
                    id: uuidv4(),
                    ...todo,
                    isCompleted: false,
                    createdAt: new Date().toISOString(),
                    userId: currentUser?.uid,
                }));

                await Promise.all(todosToCreate.map((todo) => databaseService.saveTodo(todo)));

                set({ todos: todosToCreate, isInitialized: true });
            } else {
                set({ todos: savedTodos, isInitialized: true });
            }
        } catch (error) {
            console.error('Failed to initialize todos:', error);
            set({ error: 'Failed to initialize todos' });
        } finally {
            set({ isLoading: false });
        }
    },

    createTodo: async (todoData) => {
        set({ isLoading: true, error: null });

        try {
            // Get current user from auth store
            const authStore = useAuthStore.getState();
            const currentUser = authStore.user;

            const newTodo: Todo = {
                id: uuidv4(),
                ...todoData,
                isCompleted: false,
                createdAt: new Date().toISOString(),
                userId: currentUser?.uid,
            };

            await databaseService.saveTodo(newTodo);

            set((state) => ({
                todos: [...state.todos, newTodo],
                isLoading: false,
            }));

            // Update widget with new todo data
            widgetService.updateTodoData();
        } catch (error) {
            console.error('Failed to create todo:', error);
            set({ error: 'Failed to create todo', isLoading: false });
        }
    },

    updateTodo: async (id, updates) => {
        set({ isLoading: true, error: null });

        try {
            const todos = get().todos;
            const todoIndex = todos.findIndex((t) => t.id === id);

            if (todoIndex === -1) {
                throw new Error('Todo not found');
            }

            const updatedTodo = { ...todos[todoIndex], ...updates };
            await databaseService.saveTodo(updatedTodo);

            const updatedTodos = [...todos];
            updatedTodos[todoIndex] = updatedTodo;

            set({ todos: updatedTodos, isLoading: false });

            // Update widget with updated todo data
            widgetService.updateTodoData();
        } catch (error) {
            console.error('Failed to update todo:', error);
            set({ error: 'Failed to update todo', isLoading: false });
        }
    },

    toggleTodo: async (id) => {
        const todo = get().todos.find((t) => t.id === id);
        if (!todo) return;

        const updates: Partial<Todo> = {
            isCompleted: !todo.isCompleted,
            completedAt: !todo.isCompleted ? new Date().toISOString() : undefined,
        };

        await get().updateTodo(id, updates);
    },

    deleteTodo: async (id) => {
        set({ isLoading: true, error: null });

        try {
            await databaseService.deleteTodo(id);

            set((state) => ({
                todos: state.todos.filter((t) => t.id !== id),
                isLoading: false,
            }));

            // Update widget with updated todo data
            widgetService.updateTodoData();
        } catch (error) {
            console.error('Failed to delete todo:', error);
            set({ error: 'Failed to delete todo', isLoading: false });
        }
    },

    deleteCompletedTodos: async () => {
        const completedTodos = get().getCompletedTodos();

        try {
            await Promise.all(completedTodos.map((todo) => databaseService.deleteTodo(todo.id)));

            set((state) => ({
                todos: state.todos.filter((t) => !t.isCompleted),
            }));

            // Update widget with updated todo data
            widgetService.updateTodoData();
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

    exportTodosToCSV: () => {
        const todos = get().todos;
        const headers = ['ID', 'Title', 'Completed', 'Created At', 'Completed At'];

        const csvContent = [
            headers.join(','),
            ...todos.map((todo) =>
                [
                    todo.id,
                    `"${todo.title}"`,
                    todo.isCompleted,
                    todo.createdAt,
                    todo.completedAt || '',
                ].join(','),
            ),
        ].join('\n');

        return csvContent;
    },

    syncWithDatabase: async () => {
        try {
            // Get current user from auth store
            const authStore = useAuthStore.getState();
            const currentUser = authStore.user;

            const todos = await databaseService.getTodos(currentUser?.uid);
            set({ todos });
        } catch (error) {
            console.error('Failed to sync with database:', error);
            set({ error: 'Failed to sync with database' });
        }
    },
}));
