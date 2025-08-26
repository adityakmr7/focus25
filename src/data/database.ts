import { databaseService as localDatabaseService } from './hybridDatabase';

/**
 * Database service using only local SQLite storage
 */

// Export the database service as the main database service
export const databaseService = localDatabaseService;

// Initialize database
export const initializeDatabase = async () => {
    try {
        await localDatabaseService.initializeDatabase();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
    }
};
