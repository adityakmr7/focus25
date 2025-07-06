import { create } from 'zustand';
import { databaseService } from '../data/database';
import { Todo, TodoPriority, TodoCategory } from '../types/database';
import { v4 as uuidv4 } from 'uuid';

interface TodoState {
    todos: Todo[];
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;
    
    // Filters
    selectedCategory: TodoCategory | 'all';
    selectedPriority: TodoPriority | 'all';
    showCompleted: boolean;
    searchQuery: string;

    // Actions
    initializeStore: () => Promise<void>;
    createTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'isCompleted'>) => Promise<void>;
    updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
    toggleTodo: (id: string) => Promise<void>;
    deleteTodo: (id: string) => Promise<void>;
    deleteCompletedTodos: () => Promise<void>;
    getTodosByCategory: (category: TodoCategory) => Todo[];
    getTodosByPriority: (priority: TodoPriority) => Todo[];
    getCompletedTodos: () => Todo[];
    getActiveTodos: () => Todo[];
    getOverdueTodos: () => Todo[];
    getTodosForToday: () => Todo[];
    
    // Filters
    setSelectedCategory: (category: TodoCategory | 'all') => void;
    setSelectedPriority: (priority: TodoPriority | 'all') => void;
    setShowCompleted: (show: boolean) => void;
    setSearchQuery: (query: string) => void;
    getFilteredTodos: () => Todo[];
    
    // Statistics
    getTodoStats: () => {
        total: number;
        completed: number;
        pending: number;
        overdue: number;
        today: number;
    };
    
    // Export/Import
    exportTodosToCSV: () => string;
    syncWithDatabase: () => Promise<void>;
}

const defaultTodos: Omit<Todo, 'id' | 'createdAt' | 'isCompleted'>[] = [
    {
        title: 'Review daily goals',
        description: 'Check progress on daily objectives and adjust as needed',
        priority: TodoPriority.HIGH,
        category: TodoCategory.PERSONAL,
        tags: ['daily', 'goals', 'review'],
    },
    {
        title: 'Complete project documentation',
        description: 'Write comprehensive documentation for the current project',
        priority: TodoPriority.MEDIUM,
        category: TodoCategory.WORK,
        tags: ['documentation', 'project'],
    },
    {
        title: 'Schedule workout session',
        description: 'Book a 1-hour workout session at the gym',
        priority: TodoPriority.LOW,
        category: TodoCategory.HEALTH,
        tags: ['fitness', 'health', 'exercise'],
    },
];

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
            
            // Load existing todos
            const savedTodos = await databaseService.getTodos();
            
            // If no todos exist, create default ones
            if (savedTodos.length === 0) {
                const todosToCreate = defaultTodos.map(todo => ({
                    id: uuidv4(),
                    ...todo,
                    isCompleted: false,
                    createdAt: new Date().toISOString(),
                }));
                
                await Promise.all(
                    todosToCreate.map(todo => databaseService.saveTodo(todo))
                );
                
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
            const newTodo: Todo = {
                id: uuidv4(),
                ...todoData,
                isCompleted: false,
                createdAt: new Date().toISOString(),
            };
            
            await databaseService.saveTodo(newTodo);
            
            set(state => ({
                todos: [...state.todos, newTodo],
                isLoading: false,
            }));
        } catch (error) {
            console.error('Failed to create todo:', error);
            set({ error: 'Failed to create todo', isLoading: false });
        }
    },

    updateTodo: async (id, updates) => {
        set({ isLoading: true, error: null });
        
        try {
            const todos = get().todos;
            const todoIndex = todos.findIndex(t => t.id === id);
            
            if (todoIndex === -1) {
                throw new Error('Todo not found');
            }
            
            const updatedTodo = { ...todos[todoIndex], ...updates };
            await databaseService.saveTodo(updatedTodo);
            
            const updatedTodos = [...todos];
            updatedTodos[todoIndex] = updatedTodo;
            
            set({ todos: updatedTodos, isLoading: false });
        } catch (error) {
            console.error('Failed to update todo:', error);
            set({ error: 'Failed to update todo', isLoading: false });
        }
    },

    toggleTodo: async (id) => {
        const todo = get().todos.find(t => t.id === id);
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
            
            set(state => ({
                todos: state.todos.filter(t => t.id !== id),
                isLoading: false,
            }));
        } catch (error) {
            console.error('Failed to delete todo:', error);
            set({ error: 'Failed to delete todo', isLoading: false });
        }
    },

    deleteCompletedTodos: async () => {
        const completedTodos = get().getCompletedTodos();
        
        try {
            await Promise.all(
                completedTodos.map(todo => databaseService.deleteTodo(todo.id))
            );
            
            set(state => ({
                todos: state.todos.filter(t => !t.isCompleted),
            }));
        } catch (error) {
            console.error('Failed to delete completed todos:', error);
            set({ error: 'Failed to delete completed todos' });
        }
    },

    getTodosByCategory: (category) => {
        return get().todos.filter(todo => todo.category === category);
    },

    getTodosByPriority: (priority) => {
        return get().todos.filter(todo => todo.priority === priority);
    },

    getCompletedTodos: () => {
        return get().todos.filter(todo => todo.isCompleted);
    },

    getActiveTodos: () => {
        return get().todos.filter(todo => !todo.isCompleted);
    },

    getOverdueTodos: () => {
        const now = new Date();
        return get().todos.filter(todo => {
            if (!todo.dueDate || todo.isCompleted) return false;
            return new Date(todo.dueDate) < now;
        });
    },

    getTodosForToday: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().todos.filter(todo => {
            if (!todo.dueDate) return false;
            return todo.dueDate.startsWith(today);
        });
    },

    // Filters
    setSelectedCategory: (category) => set({ selectedCategory: category }),
    setSelectedPriority: (priority) => set({ selectedPriority: priority }),
    setShowCompleted: (show) => set({ showCompleted: show }),
    setSearchQuery: (query) => set({ searchQuery: query }),

    getFilteredTodos: () => {
        const { 
            todos, 
            selectedCategory, 
            selectedPriority, 
            showCompleted, 
            searchQuery 
        } = get();
        
        let filtered = todos;
        
        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(todo => todo.category === selectedCategory);
        }
        
        // Filter by priority
        if (selectedPriority !== 'all') {
            filtered = filtered.filter(todo => todo.priority === selectedPriority);
        }
        
        // Filter by completion status
        if (!showCompleted) {
            filtered = filtered.filter(todo => !todo.isCompleted);
        }
        
        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(todo =>
                todo.title.toLowerCase().includes(query) ||
                todo.description?.toLowerCase().includes(query) ||
                todo.tags?.some(tag => tag.toLowerCase().includes(query))
            );
        }
        
        // Sort: incomplete first, then by priority, then by creation date
        return filtered.sort((a, b) => {
            if (a.isCompleted !== b.isCompleted) {
                return a.isCompleted ? 1 : -1;
            }
            
            const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
            const aPriority = priorityOrder[a.priority] || 4;
            const bPriority = priorityOrder[b.priority] || 4;
            
            if (aPriority !== bPriority) {
                return aPriority - bPriority;
            }
            
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    },

    getTodoStats: () => {
        const todos = get().todos;
        const completed = todos.filter(t => t.isCompleted);
        const pending = todos.filter(t => !t.isCompleted);
        const overdue = get().getOverdueTodos();
        const today = get().getTodosForToday();
        
        return {
            total: todos.length,
            completed: completed.length,
            pending: pending.length,
            overdue: overdue.length,
            today: today.length,
        };
    },

    exportTodosToCSV: () => {
        const todos = get().todos;
        const headers = ['ID', 'Title', 'Description', 'Priority', 'Category', 'Completed', 'Due Date', 'Created At', 'Completed At', 'Tags', 'Notes'];
        
        const csvContent = [
            headers.join(','),
            ...todos.map(todo => [
                todo.id,
                `"${todo.title}"`,
                `"${todo.description || ''}"`,
                todo.priority,
                todo.category,
                todo.isCompleted,
                todo.dueDate || '',
                todo.createdAt,
                todo.completedAt || '',
                `"${todo.tags?.join(';') || ''}"`,
                `"${todo.notes || ''}"`,
            ].join(','))
        ].join('\n');
        
        return csvContent;
    },

    syncWithDatabase: async () => {
        try {
            const todos = await databaseService.getTodos();
            set({ todos });
        } catch (error) {
            console.error('Failed to sync with database:', error);
            set({ error: 'Failed to sync with database' });
        }
    },
}));