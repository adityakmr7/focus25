import { localDatabaseService, Todo } from '@/services/local-database-service';
import { errorHandlingService, DatabaseError } from '@/services/error-handling-service';
import { showError, showSuccess } from '@/utils/error-toast';
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
        if (get().isInitialized) return;

        set({ isLoading: true, error: null });

        try {
            // Wait for database initialization
            await localDatabaseService.waitForInitialization();

            const todos = await localDatabaseService.getTodos();
            set({ todos, isLoading: false, isInitialized: true });
        } catch (error) {
            const appError = errorHandlingService.processError(error, { action: 'loadTodos' });
            set({
                error: appError.userMessage || 'Failed to load todos',
                isLoading: false,
            });
            showError(error, { action: 'loadTodos' });
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

            set((state) => ({
                todos: [newTodo, ...state.todos],
                isLoading: false,
            }));
            showSuccess('Todo created successfully');
        } catch (error) {
            const appError = errorHandlingService.processError(error, { action: 'createTodo' });
            set({
                error: appError.userMessage || 'Failed to create todo',
                isLoading: false,
            });
            showError(error, { action: 'createTodo' });
        }
    },

    updateTodo: async (id, updates) => {
        set({ isLoading: true, error: null });

        try {
            // Wait for database initialization
            await localDatabaseService.waitForInitialization();

            await localDatabaseService.updateTodo(id, updates);

            set((state) => ({
                todos: state.todos.map((todo) => (todo.id === id ? { ...todo, ...updates } : todo)),
                isLoading: false,
            }));
        } catch (error) {
            const appError = errorHandlingService.processError(error, { action: 'updateTodo', todoId: id });
            set({
                error: appError.userMessage || 'Failed to update todo',
                isLoading: false,
            });
            showError(error, { action: 'updateTodo', todoId: id });
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

            set((state) => ({
                todos: state.todos.map((todo) => (todo.id === id ? { ...todo, ...updates } : todo)),
            }));
        } catch (error) {
            const appError = errorHandlingService.processError(error, { action: 'toggleTodo', todoId: id });
            set({
                error: appError.userMessage || 'Failed to toggle todo',
            });
            showError(error, { action: 'toggleTodo', todoId: id });
        }
    },

    deleteTodo: async (id) => {
        set({ isLoading: true, error: null });

        try {
            // Wait for database initialization
            await localDatabaseService.waitForInitialization();

            await localDatabaseService.deleteTodo(id);

            set((state) => ({
                todos: state.todos.filter((todo) => todo.id !== id),
                isLoading: false,
            }));
            showSuccess('Todo deleted successfully');
        } catch (error) {
            const appError = errorHandlingService.processError(error, { action: 'deleteTodo', todoId: id });
            set({
                error: appError.userMessage || 'Failed to delete todo',
                isLoading: false,
            });
            showError(error, { action: 'deleteTodo', todoId: id });
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

            set((state) => ({
                todos: state.todos.filter((todo) => !todo.isCompleted),
                isLoading: false,
            }));
            showSuccess('Completed todos deleted successfully');
        } catch (error) {
            const appError = errorHandlingService.processError(error, { action: 'deleteCompletedTodos' });
            set({
                error: appError.userMessage || 'Failed to delete completed todos',
                isLoading: false,
            });
            showError(error, { action: 'deleteCompletedTodos' });
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
            const appError = errorHandlingService.processError(error, { action: 'exportTodos' });
            showError(error, { action: 'exportTodos' });
            throw new DatabaseError(appError.message, error instanceof Error ? error : undefined);
        }
    },

    importTodos: async (todos) => {
        set({ isLoading: true, error: null });

        try {
            await localDatabaseService.importData({ todos });

            // Reload todos to reflect changes
            await get().loadTodos();

            set({ isLoading: false });
            showSuccess('Todos imported successfully');
        } catch (error) {
            const appError = errorHandlingService.processError(error, { action: 'importTodos' });
            set({
                error: appError.userMessage || 'Failed to import todos',
                isLoading: false,
            });
            showError(error, { action: 'importTodos' });
        }
    },
}));
