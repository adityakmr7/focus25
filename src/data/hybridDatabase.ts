import { localDatabaseService } from './local/localDatabase';

// Database service that uses only local SQLite storage
class DatabaseService {
    private getService() {
        return localDatabaseService;
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

    // Goals operations (disabled - was part of Supabase functionality)
    async saveGoal(goal: any): Promise<void> {
        console.log('Goals functionality disabled - was part of Supabase integration');
        // const service = this.getService();
        // await service.saveGoal(goal);
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
        await service.saveTodo(todo);
    }

    async getTodos(): Promise<any[]> {
        const service = this.getService();
        return await service.getTodos();
    }

    async updateTodo(id: string, updates: any): Promise<void> {
        const service = this.getService();
        await service.updateTodo(id, updates);
    }

    async deleteTodo(id: string): Promise<void> {
        const service = this.getService();
        await service.deleteTodo(id);
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