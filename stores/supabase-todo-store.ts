import { createSupabaseService, Todo } from '@/services/supabase-service';
import { create } from 'zustand';
import { useAuthStore } from './auth-store';

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
    createTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'isCompleted' | 'user_id'>) => Promise<void>;
    updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
    toggleTodo: (id: string) => Promise<void>;
    deleteTodo: (id: string) => Promise<void>;
    setShowCompleted: (show: boolean) => void;
    setSearchQuery: (query: string) => void;
    resetTodos: () => void;
}

export const useSupabaseTodoStore = create<TodoState>((set, get) => ({
    todos: [],
    isLoading: false,
    error: null,
    isInitialized: false,

    // Filters
    showCompleted: true,
    searchQuery: '',

    // Actions
    loadTodos: async () => {
        const { isProUser } = useAuthStore.getState();
        if (!isProUser) {
            set({ error: 'Pro subscription required to load cloud todos', isLoading: false });
            return;
        }

        const { user } = useAuthStore.getState();
        if (!user) {
            set({ error: 'User not authenticated', isLoading: false });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            const supabaseService = createSupabaseService(user.id);
            const todos = await supabaseService.getTodos();
            set({ todos, isLoading: false, isInitialized: true });
        } catch (error) {
            console.error('Error loading todos:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to load todos',
                isLoading: false,
            });
        }
    },

    createTodo: async (todoData) => {
        const { isProUser } = useAuthStore.getState();
        if (!isProUser) {
            set({ error: 'Pro subscription required to create cloud todos' });
            return;
        }

        const { user } = useAuthStore.getState();
        if (!user) {
            set({ error: 'User not authenticated' });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            const supabaseService = createSupabaseService(user.id);
            const todoId = await supabaseService.createTodo(todoData);

            const newTodo: Todo = {
                id: todoId,
                ...todoData,
                isCompleted: false,
                created_at: new Date().toISOString(),
                completedAt: null,
                user_id: user.id,
            };

            set((state) => ({
                todos: [newTodo, ...state.todos],
                isLoading: false,
            }));
        } catch (error) {
            console.error('Error creating todo:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to create todo',
                isLoading: false,
            });
        }
    },

    updateTodo: async (id, updates) => {
        const { isProUser } = useAuthStore.getState();
        if (!isProUser) {
            set({ error: 'Pro subscription required to update cloud todos' });
            return;
        }

        const { user } = useAuthStore.getState();
        if (!user) {
            set({ error: 'User not authenticated' });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            const supabaseService = createSupabaseService(user.id);
            await supabaseService.updateTodo(id, updates);

            set((state) => ({
                todos: state.todos.map((todo) => (todo.id === id ? { ...todo, ...updates } : todo)),
                isLoading: false,
            }));
        } catch (error) {
            console.error('Error updating todo:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to update todo',
                isLoading: false,
            });
        }
    },

    toggleTodo: async (id) => {
        const { isProUser } = useAuthStore.getState();
        if (!isProUser) {
            set({ error: 'Pro subscription required to update cloud todos' });
            return;
        }

        const { user } = useAuthStore.getState();
        if (!user) {
            set({ error: 'User not authenticated' });
            return;
        }

        const todo = get().todos.find((t) => t.id === id);
        if (!todo) return;

        const updates = {
            isCompleted: !todo.isCompleted,
            completedAt: !todo.isCompleted ? new Date().toISOString() : null,
        };

        set({ isLoading: true, error: null });

        try {
            const supabaseService = createSupabaseService(user.id);
            await supabaseService.updateTodo(id, updates);

            set((state) => ({
                todos: state.todos.map((todo) => (todo.id === id ? { ...todo, ...updates } : todo)),
                isLoading: false,
            }));
        } catch (error) {
            console.error('Error toggling todo:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to toggle todo',
                isLoading: false,
            });
        }
    },

    deleteTodo: async (id) => {
        const { isProUser } = useAuthStore.getState();
        if (!isProUser) {
            set({ error: 'Pro subscription required to delete cloud todos' });
            return;
        }

        const { user } = useAuthStore.getState();
        if (!user) {
            set({ error: 'User not authenticated' });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            const supabaseService = createSupabaseService(user.id);
            await supabaseService.deleteTodo(id);

            set((state) => ({
                todos: state.todos.filter((todo) => todo.id !== id),
                isLoading: false,
            }));
        } catch (error) {
            console.error('Error deleting todo:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to delete todo',
                isLoading: false,
            });
        }
    },

    setShowCompleted: (show) => set({ showCompleted: show }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    resetTodos: () => set({ todos: [], isLoading: false, error: null }),
}));
