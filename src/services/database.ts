import { hybridDatabaseService } from './hybridDatabase';

// Export the hybrid database service as the main database service
export const databaseService = hybridDatabaseService;

// Initialize database
export const initializeDatabase = async () => {
    try {
        await hybridDatabaseService.initializeDatabase();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
    }
};
