import firestore from '@react-native-firebase/firestore';
import { Todo } from '../types/database';

export class FirebaseTodoService {
    private static instance: FirebaseTodoService | null = null;

    static getInstance(): FirebaseTodoService {
        if (!FirebaseTodoService.instance) {
            FirebaseTodoService.instance = new FirebaseTodoService();
        }
        return FirebaseTodoService.instance;
    }

    /**
     * Save todo to Firestore subcollection
     */
    async saveTodo(todo: Todo, userId: string): Promise<void> {
        try {
            const todoRef = firestore()
                .collection('users')
                .doc(userId)
                .collection('todos')
                .doc(todo.id);

            await todoRef.set({
                title: todo.title,
                completed: todo.isCompleted,
                createdAt: firestore.Timestamp.fromDate(new Date(todo.createdAt)),
                updatedAt: firestore.Timestamp.now(),
                completedAt: todo.completedAt 
                    ? firestore.Timestamp.fromDate(new Date(todo.completedAt))
                    : null,
                userId: todo.userId,
            });

            console.log('Todo saved to Firestore subcollection:', todo.id);
        } catch (error) {
            console.error('Failed to save todo to Firestore:', error);
            throw error;
        }
    }

    /**
     * Get todos from Firestore subcollection with filtering
     */
    async getTodos(userId: string, options: {
        completed?: boolean;
        priority?: string;
        category?: string;
        limit?: number;
        orderBy?: 'createdAt' | 'updatedAt' | 'priority';
        orderDirection?: 'asc' | 'desc';
    } = {}): Promise<Todo[]> {
        try {
            let query: any = firestore()
                .collection('users')
                .doc(userId)
                .collection('todos');

            // Apply filters
            if (options.completed !== undefined) {
                query = query.where('completed', '==', options.completed);
            }
            if (options.priority) {
                query = query.where('priority', '==', options.priority);
            }
            if (options.category) {
                query = query.where('category', '==', options.category);
            }

            // Apply ordering
            const orderBy = options.orderBy || 'createdAt';
            const orderDirection = options.orderDirection || 'desc';
            query = query.orderBy(orderBy, orderDirection);

            // Apply limit
            if (options.limit) {
                query = query.limit(options.limit);
            }

            const todosSnapshot = await query.get();
            const todos: Todo[] = [];

            todosSnapshot.forEach((doc: any) => {
                const data = doc.data();
                todos.push({
                    id: doc.id,
                    title: data.title,
                    isCompleted: data.completed,
                    createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                    completedAt: data.completedAt?.toDate?.()?.toISOString() || undefined,
                    userId: data.userId,
                });
            });

            console.log('Todos loaded from Firestore subcollection:', todos.length);
            return todos;
        } catch (error) {
            console.error('Failed to load todos from Firestore:', error);
            throw error;
        }
    }

    /**
     * Update todo in Firestore subcollection
     */
    async updateTodo(todoId: string, updates: Partial<Todo>, userId: string): Promise<void> {
        try {
            const todoRef = firestore()
                .collection('users')
                .doc(userId)
                .collection('todos')
                .doc(todoId);

            const updateData: any = { ...updates };
            
            // Convert dates to Firestore timestamps
            if (updates.createdAt) {
                updateData.createdAt = firestore.Timestamp.fromDate(new Date(updates.createdAt));
            }
            if (updates.completedAt) {
                updateData.completedAt = firestore.Timestamp.fromDate(new Date(updates.completedAt));
            }
            if (updates.isCompleted !== undefined) {
                updateData.completed = updates.isCompleted;
            }

            updateData.updatedAt = firestore.Timestamp.now();

            await todoRef.update(updateData);
            console.log('Todo updated in Firestore subcollection:', todoId);
        } catch (error) {
            console.error('Failed to update todo in Firestore:', error);
            throw error;
        }
    }

    /**
     * Delete todo from Firestore subcollection
     */
    async deleteTodo(todoId: string, userId: string): Promise<void> {
        try {
            await firestore()
                .collection('users')
                .doc(userId)
                .collection('todos')
                .doc(todoId)
                .delete();

            console.log('Todo deleted from Firestore subcollection:', todoId);
        } catch (error) {
            console.error('Failed to delete todo from Firestore:', error);
            throw error;
        }
    }

    /**
     * Sync todos between local and Firestore (improved version)
     */
    async syncTodos(localTodos: Todo[], userId: string): Promise<Todo[]> {
        try {
            // Get remote todos with basic info only
            const remoteTodos = await this.getTodos(userId, { limit: 100 });
            
            // Create maps for efficient lookup
            const remoteTodosMap = new Map(remoteTodos.map(todo => [todo.id, todo]));
            const localTodosMap = new Map(localTodos.map(todo => [todo.id, todo]));

            const syncedTodos: Todo[] = [];
            const todosToSync: Todo[] = [];

            // Process local todos
            for (const localTodo of localTodos) {
                const remoteTodo = remoteTodosMap.get(localTodo.id);
                
                if (!remoteTodo) {
                    // Local todo doesn't exist remotely, upload it
                    todosToSync.push(localTodo);
                } else {
                    // Compare timestamps to determine which is newer
                    const localTime = new Date(localTodo.createdAt).getTime();
                    const remoteTime = new Date(remoteTodo.createdAt).getTime();
                    
                    if (localTime > remoteTime) {
                        // Local is newer, upload it
                        todosToSync.push(localTodo);
                    } else {
                        // Remote is newer or same, use remote
                        syncedTodos.push(remoteTodo);
                    }
                }
            }

            // Process remote todos that don't exist locally
            for (const remoteTodo of remoteTodos) {
                if (!localTodosMap.has(remoteTodo.id)) {
                    syncedTodos.push(remoteTodo);
                }
            }

            // Upload todos that need syncing
            for (const todo of todosToSync) {
                await this.saveTodo(todo, userId);
                syncedTodos.push(todo);
            }

            console.log('Todos synced successfully:', syncedTodos.length);
            return syncedTodos;
        } catch (error) {
            console.error('Failed to sync todos:', error);
            throw error;
        }
    }

    /**
     * Get todos with advanced filtering (Pro users only)
     */
    async getTodosAdvanced(userId: string, filters: {
        search?: string;
        completed?: boolean;
        priority?: string[];
        category?: string[];
        tags?: string[];
        dateRange?: {
            start: Date;
            end: Date;
        };
        limit?: number;
        offset?: number;
    }): Promise<{ todos: Todo[]; total: number }> {
        try {
            let query: any = firestore()
                .collection('users')
                .doc(userId)
                .collection('todos');

            // Apply filters
            if (filters.completed !== undefined) {
                query = query.where('completed', '==', filters.completed);
            }
            if (filters.priority && filters.priority.length > 0) {
                query = query.where('priority', 'in', filters.priority);
            }
            if (filters.category && filters.category.length > 0) {
                query = query.where('category', 'in', filters.category);
            }
            if (filters.dateRange) {
                query = query
                    .where('createdAt', '>=', firestore.Timestamp.fromDate(filters.dateRange.start))
                    .where('createdAt', '<=', firestore.Timestamp.fromDate(filters.dateRange.end));
            }

            // Apply ordering
            query = query.orderBy('createdAt', 'desc');

            // Get total count
            const countSnapshot = await query.get();
            const total = countSnapshot.size;

            // Apply pagination
            if (filters.offset) {
                query = query.offset(filters.offset);
            }
            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            const todosSnapshot = await query.get();
            let todos: Todo[] = [];

            todosSnapshot.forEach((doc: any) => {
                const data = doc.data();
                todos.push({
                    id: doc.id,
                    title: data.title,
                    isCompleted: data.completed,
                    createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                    completedAt: data.completedAt?.toDate?.()?.toISOString() || undefined,
                    userId: data.userId,
                });
            });

            // Apply client-side search if needed
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                todos = todos.filter(todo => 
                    todo.title.toLowerCase().includes(searchTerm)
                );
            }

            console.log('Advanced todos query completed:', todos.length);
            return { todos, total };
        } catch (error) {
            console.error('Failed to get advanced todos:', error);
            throw error;
        }
    }
}

export const firebaseTodoService = FirebaseTodoService.getInstance();
