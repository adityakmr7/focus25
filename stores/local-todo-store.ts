import { localDatabaseService, Todo } from '@/services/local-database-service';
import { optionalSyncService } from '@/services/optional-sync-service';
import { create } from 'zustand';

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
    createTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'actualMinutes'>) => Promise<void>;
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
    exportTodos: () => Promise<Todo[]>;
    importTodos: (todos: Todo[]) => Promise<void>;
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
        set({ isLoading: true, error: null });

        try {
            // Wait for database initialization
            await localDatabaseService.waitForInitialization();

            // Check if sync is enabled - if so, sync before loading
            const settings = await localDatabaseService.getSettings();
            if (settings?.syncEnabled) {
                try {
                    // Perform sync to get latest todos from Supabase
                    await optionalSyncService.performSync();
                } catch (syncError) {
                    console.error('Failed to sync before loading todos:', syncError);
                    // Continue loading local todos even if sync fails
                }
            }

            // Load todos from local database (which now includes synced todos)
            const todos = await localDatabaseService.getTodos();
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
        set({ isLoading: true, error: null });

        try {
            // Wait for database initialization
            await localDatabaseService.waitForInitialization();

            const todoId = await localDatabaseService.createTodo(todoData);

            const newTodo: Todo = {
                id: todoId,
                ...todoData,
                isCompleted: false,
                createdAt: new Date().toISOString(),
                completedAt: null,
                actualMinutes: 0,
            };

            // Check if sync is enabled and sync to Supabase
            const settings = await localDatabaseService.getSettings();
            if (settings?.syncEnabled) {
                try {
                    // Sync will happen automatically via sync log trigger, but we can trigger immediate sync
                    // The sync log will be processed during next sync cycle
                    await optionalSyncService.performSync();
                } catch (syncError) {
                    console.error('Failed to sync todo to Supabase:', syncError);
                    // Don't fail the operation if sync fails
                }
            }

            // Reload todos to get latest state (in case sync brought in other todos)
            const todos = await localDatabaseService.getTodos();
            set({ todos, isLoading: false });
        } catch (error) {
            console.error('Error creating todo:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to create todo',
                isLoading: false,
            });
        }
    },

    updateTodo: async (id, updates) => {
        set({ isLoading: true, error: null });

        try {
            // Wait for database initialization
            await localDatabaseService.waitForInitialization();

            await localDatabaseService.updateTodo(id, updates);

            // Check if sync is enabled and sync to Supabase
            const settings = await localDatabaseService.getSettings();
            if (settings?.syncEnabled) {
                try {
                    // Sync will happen automatically via sync log trigger
                    await optionalSyncService.performSync();
                } catch (syncError) {
                    console.error('Failed to sync todo update to Supabase:', syncError);
                    // Don't fail the operation if sync fails
                }
            }

            // Reload todos to get latest state
            const todos = await localDatabaseService.getTodos();
            set({ todos, isLoading: false });
        } catch (error) {
            console.error('Failed to update todo:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to update todo',
                isLoading: false,
            });
        }
    },

    toggleTodo: async (id) => {
        const todo = get().todos.find((t) => t.id === id);
        if (!todo) return;

        const updates = {
            isCompleted: !todo.isCompleted,
            completedAt: !todo.isCompleted ? new Date().toISOString() : null,
        };

        try {
            // Wait for database initialization
            await localDatabaseService.waitForInitialization();

            await localDatabaseService.updateTodo(id, updates);

            // Check if sync is enabled and sync to Supabase
            const settings = await localDatabaseService.getSettings();
            if (settings?.syncEnabled) {
                try {
                    // Sync will happen automatically via sync log trigger
                    await optionalSyncService.performSync();
                } catch (syncError) {
                    console.error('Failed to sync todo toggle to Supabase:', syncError);
                    // Don't fail the operation if sync fails
                }
            }

            // Reload todos to get latest state
            const todos = await localDatabaseService.getTodos();
            set({ todos });
        } catch (error) {
            console.error('Failed to toggle todo:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to toggle todo',
            });
        }
    },

    deleteTodo: async (id) => {
        set({ isLoading: true, error: null });

        try {
            // Wait for database initialization
            await localDatabaseService.waitForInitialization();

            await localDatabaseService.deleteTodo(id);

            // Check if sync is enabled and sync to Supabase
            const settings = await localDatabaseService.getSettings();
            if (settings?.syncEnabled) {
                try {
                    // Sync will happen automatically via sync log trigger
                    await optionalSyncService.performSync();
                } catch (syncError) {
                    console.error('Failed to sync todo delete to Supabase:', syncError);
                    // Don't fail the operation if sync fails
                }
            }

            // Reload todos to get latest state
            const todos = await localDatabaseService.getTodos();
            set({ todos, isLoading: false });
        } catch (error) {
            console.error('Failed to delete todo:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to delete todo',
                isLoading: false,
            });
        }
    },

    deleteCompletedTodos: async () => {
        set({ isLoading: true, error: null });

        try {
            // Wait for database initialization
            await localDatabaseService.waitForInitialization();

            const completedTodos = await localDatabaseService.getCompletedTodos();

            for (const todo of completedTodos) {
                await localDatabaseService.deleteTodo(todo.id);
            }

            // Check if sync is enabled and sync to Supabase
            const settings = await localDatabaseService.getSettings();
            if (settings?.syncEnabled) {
                try {
                    // Sync will happen automatically via sync log trigger
                    await optionalSyncService.performSync();
                } catch (syncError) {
                    console.error(
                        'Failed to sync completed todos deletion to Supabase:',
                        syncError,
                    );
                    // Don't fail the operation if sync fails
                }
            }

            // Reload todos to get latest state
            const todos = await localDatabaseService.getTodos();
            set({ todos, isLoading: false });
        } catch (error) {
            console.error('Failed to delete completed todos:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to delete completed todos',
                isLoading: false,
            });
        }
    },

    getCompletedTodos: () => {
        return get().todos.filter((todo) => todo.isCompleted);
    },

    getActiveTodos: () => {
        return get().todos.filter((todo) => !todo.isCompleted);
    },

    setShowCompleted: (show) => {
        set({ showCompleted: show });
    },

    setSearchQuery: (query) => {
        set({ searchQuery: query });
    },

    exportTodos: async () => {
        try {
            return await localDatabaseService.getTodos();
        } catch (error) {
            console.error('Failed to export todos:', error);
            throw error;
        }
    },

    importTodos: async (todos) => {
        set({ isLoading: true, error: null });

        try {
            await localDatabaseService.importData({ todos });

            // Reload todos to reflect changes
            await get().loadTodos();

            set({ isLoading: false });
        } catch (error) {
            console.error('Failed to import todos:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to import todos',
                isLoading: false,
            });
        }
    },
}));
