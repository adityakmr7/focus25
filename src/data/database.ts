import { hybridDatabaseService } from './hybridDatabase';

/**
 * initially it is getting
 * this will determine weather data will go to local or supabase
 */

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
