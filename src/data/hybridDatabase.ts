import { localDatabaseService } from './local/localDatabase';
import { firebaseTodoService } from '../services/firebaseTodoService';
import { useAuthStore } from '../store/authStore';

// Database service that uses subcollections for better performance
class DatabaseService {
    private getService() {
        return localDatabaseService;
    }

    private async getCurrentUser() {
        const authStore = useAuthStore.getState();
        return authStore.user;
    }

    async initializeDatabase(): Promise<void> {
        try {
            await localDatabaseService.initializeDatabase();
            console.log('Database service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize database service:', error);
            throw error;
        }
    }

    // Statistics operations
    async saveStatistics(stats: any): Promise<void> {
        const service = this.getService();
        await service.saveStatistics(stats);
    }

    async getStatistics(date?: string): Promise<any> {
        try {
            const service = this.getService();
            return await service.getStatistics(date);
        } catch (error) {
            console.error('Failed to load statistics from database service:', error);
            // Return default statistics as fallback
            const targetDate = date || new Date().toISOString().split('T')[0];
            return {
                date: targetDate,
                totalCount: 0,
                flows: { started: 0, completed: 0, minutes: 0 },
                breaks: { started: 0, completed: 0, minutes: 0 },
                interruptions: 0,
            };
        }
    }

    async getStatisticsRange(startDate: string, endDate: string): Promise<any[]> {
        const service = this.getService();
        return await service.getStatisticsRange(startDate, endDate);
    }

    // Flow metrics operations
    async saveFlowMetrics(metrics: any): Promise<void> {
        const service = this.getService();
        await service.saveFlowMetrics(metrics);
    }

    async getFlowMetrics(): Promise<any> {
        const service = this.getService();
        return await service.getFlowMetrics();
    }

    // Settings operations
    async saveSettings(settings: any): Promise<void> {
        const service = this.getService();
        await service.saveSettings(settings);
    }

    async getSettings(): Promise<any> {
        const service = this.getService();
        return await service.getSettings();
    }

    // Theme operations
    async saveTheme(theme: any): Promise<void> {
        return await localDatabaseService.saveTheme(theme);
    }

    async getTheme(): Promise<any> {
        return await localDatabaseService.getTheme();
    }

    // Todo operations
    async initializeTodos(): Promise<void> {
        const service = this.getService();
        await service.initializeTodos();
    }

    async saveTodo(todo: any): Promise<void> {
        const service = this.getService();
        
        // Always save to local database first
        await service.saveTodo(todo);
        
        // Only sync with Firebase if user is authenticated AND pro
        const user = await this.getCurrentUser();
        if (user?.uid && user?.isPro) {
            try {
                await firebaseTodoService.saveTodo(todo, user.uid);
                console.log('Todo synced to Firebase subcollection for pro user');
            } catch (error) {
                console.warn('Failed to sync todo to Firebase:', error);
                // Don't throw - local save was successful
            }
        } else if (user?.uid && !user?.isPro) {
            console.log('User authenticated but not pro - todo saved locally only');
        } else {
            console.log('User not authenticated - todo saved locally only');
        }
    }

    async getTodos(userId?: string, options: {
        completed?: boolean;
        priority?: string;
        category?: string;
        limit?: number;
        orderBy?: 'createdAt' | 'updatedAt' | 'priority';
        orderDirection?: 'asc' | 'desc';
    } = {}): Promise<any[]> {
        const service = this.getService();
        
        // Get from local database first
        const localTodos = await service.getTodos(userId);
        // Only sync with Firebase if user is authenticated AND pro
        const user = await this.getCurrentUser();
        if (user?.uid && user?.isPro) {
            try {
                // Use improved Firebase service with filtering
                const syncedTodos = await firebaseTodoService.getTodos(user.uid, options);
                
                // Update local database with synced data
                for (const todo of syncedTodos) {
                    await service.saveTodo(todo);
                }
                
                console.log('Todos synced from Firebase subcollection for pro user');
                return syncedTodos;
            } catch (error) {
                console.warn('Failed to sync todos from Firebase:', error);
                // Return local todos if sync fails
            }
        } else if (user?.uid && !user?.isPro) {
            console.log('User authenticated but not pro - returning local todos only');
        } else {
            console.log('User not authenticated - returning ALL local todos');
        }
        
        return localTodos;
    }

    async updateTodo(id: string, updates: any): Promise<void> {
        const service = this.getService();
        
        // Always update local database first
        await service.updateTodo(id, updates);
        
        // Only sync with Firebase if user is authenticated AND pro
        const user = await this.getCurrentUser();
        if (user?.uid && user?.isPro) {
            try {
                await firebaseTodoService.updateTodo(id, updates, user.uid);
                console.log('Todo update synced to Firebase subcollection for pro user');
            } catch (error) {
                console.warn('Failed to sync todo update to Firebase:', error);
                // Don't throw - local update was successful
            }
        } else if (user?.uid && !user?.isPro) {
            console.log('User authenticated but not pro - todo updated locally only');
        } else {
            console.log('User not authenticated - todo updated locally only');
        }
    }

    async deleteTodo(id: string): Promise<void> {
        const service = this.getService();
        
        // Always delete from local database first
        await service.deleteTodo(id);
        
        // Only sync with Firebase if user is authenticated AND pro
        const user = await this.getCurrentUser();
        if (user?.uid && user?.isPro) {
            try {
                await firebaseTodoService.deleteTodo(id, user.uid);
                console.log('Todo deletion synced to Firebase subcollection for pro user');
            } catch (error) {
                console.warn('Failed to sync todo deletion to Firebase:', error);
                // Don't throw - local deletion was successful
            }
        } else if (user?.uid && !user?.isPro) {
            console.log('User authenticated but not pro - todo deleted locally only');
        } else {
            console.log('User not authenticated - todo deleted locally only');
        }
    }

    // Advanced todo operations for pro users
    async getTodosAdvanced(filters: {
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
    }): Promise<{ todos: any[]; total: number }> {
        const user = await this.getCurrentUser();
        
        if (!user?.uid || !user?.isPro) {
            // For free users, return basic local todos
            const localTodos = await this.getService().getTodos(user?.uid);
            return { 
                todos: localTodos, 
                total: localTodos.length 
            };
        }

        try {
            // Pro users get advanced filtering
            return await firebaseTodoService.getTodosAdvanced(user.uid, filters);
        } catch (error) {
            console.warn('Failed to get advanced todos:', error);
            // Fallback to local todos
            const localTodos = await this.getService().getTodos(user.uid);
            return { 
                todos: localTodos, 
                total: localTodos.length 
            };
        }
    }

    // Export operations
    async exportAllData(): Promise<string> {
        const service = this.getService();
        return await service.exportAllData();
    }

    async clearAllData(): Promise<void> {
        const service = this.getService();
        await service.clearAllData();
    }
}

export const databaseService = new DatabaseService();
