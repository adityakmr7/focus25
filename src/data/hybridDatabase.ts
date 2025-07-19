import { localDatabaseService } from './local/localDatabase';
import { supabaseDatabaseService } from './remote/supabaseDatabase';

// Hybrid database service that uses Supabase when authenticated, local storage otherwise
class HybridDatabaseService {
    private isAuthenticated = false;
    private userId: string | null = null;

    setAuthState(isAuthenticated: boolean, userId?: string) {
        this.isAuthenticated = isAuthenticated;
        this.userId = userId || null;
    }

    private useSupabase(): boolean {
        return false;
        // return this.isAuthenticated && !!this.userId;
    }

    private getService() {
        // return this.useSupabase() ? supabaseDatabaseService : localDatabaseService;
        return localDatabaseService;
    }

    async initializeDatabase(): Promise<void> {
        try {
            // Always initialize local database as fallback
            await localDatabaseService.initializeDatabase();
            console.log('Hybrid database service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize hybrid database service:', error);
            throw error;
        }
    }

    // Goals operations
    async saveGoal(goal: any): Promise<void> {
        const service = this.getService();

        // If using local storage but authenticated, also sync to Supabase
        // if (!this.useSupabase() && this.isAuthenticated) {
        //     try {
        //         await supabaseDatabaseService.saveGoal(goal);
        //     } catch (error) {
        //         console.warn('Failed to sync goal to Supabase:', error);
        //     }
        // }
    }

    // Statistics operations
    async saveStatistics(stats: any): Promise<void> {
        const service = this.getService();
        await service.saveStatistics(stats);

        // // If using local storage but authenticated, also sync to Supabase
        // if (!this.useSupabase() && this.isAuthenticated) {
        //     try {
        //         await supabaseDatabaseService.saveStatistics(stats);
        //     } catch (error) {
        //         console.warn('Failed to sync statistics to Supabase:', error);
        //     }
        // }
    }

    async getStatistics(date?: string): Promise<any> {
        try {
            const service = this.getService();
            return await service.getStatistics(date);
        } catch (error) {
            console.error('Failed to load statistics from hybrid service:', error);
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

        // // If using local storage but authenticated, also sync to Supabase
        // if (!this.useSupabase() && this.isAuthenticated) {
        //     try {
        //         await supabaseDatabaseService.saveFlowMetrics(metrics);
        //     } catch (error) {
        //         console.warn('Failed to sync flow metrics to Supabase:', error);
        //     }
        // }
    }

    async getFlowMetrics(): Promise<any> {
        const service = this.getService();
        return await service.getFlowMetrics();
    }

    // Settings operations
    async saveSettings(settings: any): Promise<void> {
        const service = this.getService();
        await service.saveSettings(settings);

        // // If using local storage but authenticated, also sync to Supabase
        // if (!this.useSupabase() && this.isAuthenticated) {
        //     try {
        //         await supabaseDatabaseService.saveSettings(settings);
        //     } catch (error) {
        //         console.warn('Failed to sync settings to Supabase:', error);
        //     }
        // }
    }

    async getSettings(): Promise<any> {
        const service = this.getService();
        return await service.getSettings();
    }

    // Theme operations (only local for now)
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
        await service.saveTodo(todo);

        // // If using local storage but authenticated, also sync to Supabase
        // if (!this.useSupabase() && this.isAuthenticated) {
        //     try {
        //         await supabaseDatabaseService.saveTodo(todo);
        //     } catch (error) {
        //         console.warn('Failed to sync todo to Supabase:', error);
        //     }
        // }
    }

    async getTodos(): Promise<any[]> {
        const service = this.getService();
        return await service.getTodos();
    }

    async updateTodo(id: string, updates: any): Promise<void> {
        const service = this.getService();
        await service.updateTodo(id, updates);

        // // If using local storage but authenticated, also sync to Supabase
        // if (!this.useSupabase() && this.isAuthenticated) {
        //     try {
        //         await supabaseDatabaseService.updateTodo(id, updates);
        //     } catch (error) {
        //         console.warn('Failed to sync todo update to Supabase:', error);
        //     }
        // }
    }

    async deleteTodo(id: string): Promise<void> {
        const service = this.getService();
        await service.deleteTodo(id);

        // // If using local storage but authenticated, also sync to Supabase
        // if (!this.useSupabase() && this.isAuthenticated) {
        //     try {
        //         await supabaseDatabaseService.deleteTodo(id);
        //     } catch (error) {
        //         console.warn('Failed to sync todo deletion to Supabase:', error);
        //     }
        // }
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

    // Sync operations
    async syncToSupabase(): Promise<void> {
        if (!this.isAuthenticated) {
            throw new Error('User not authenticated for Supabase sync');
        }

        try {
            // Get all local data
            const [flowMetrics, settings] = await Promise.all([
                localDatabaseService.getFlowMetrics(),
                localDatabaseService.getSettings(),
            ]);

            // Get today's statistics
            const today = new Date().toISOString().split('T')[0];
            const statistics = await localDatabaseService.getStatistics(today);

            // Save to Supabase
            await Promise.all([
                supabaseDatabaseService.saveFlowMetrics(flowMetrics),
                supabaseDatabaseService.saveSettings(settings),
                supabaseDatabaseService.saveStatistics(statistics),
            ]);

            console.log('Successfully synced local data to Supabase');
        } catch (error) {
            console.error('Failed to sync to Supabase:', error);
            throw error;
        }
    }

    async syncFromSupabase(): Promise<void> {
        if (!this.isAuthenticated) {
            throw new Error('User not authenticated for Supabase sync');
        }

        try {
            // Get all Supabase data
            const [goals, flowMetrics, settings] = await Promise.all([
                supabaseDatabaseService.getGoals(),
                supabaseDatabaseService.getFlowMetrics(),
                supabaseDatabaseService.getSettings(),
            ]);

            // Get today's statistics
            const today = new Date().toISOString().split('T')[0];
            const statistics = await supabaseDatabaseService.getStatistics(today);

            // Save to local database
            await Promise.all([
                localDatabaseService.saveFlowMetrics(flowMetrics),
                localDatabaseService.saveSettings(settings),
                localDatabaseService.saveStatistics(statistics),
            ]);

            console.log('Successfully synced Supabase data to local storage');
        } catch (error) {
            console.error('Failed to sync from Supabase:', error);
            throw error;
        }
    }
}

export const hybridDatabaseService = new HybridDatabaseService();
