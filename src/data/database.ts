import { databaseService as hybridDatabaseService } from './hybridDatabase';

/**
 * Database service using improved Firestore structure with subcollections
 * - Better performance with server-side filtering
 * - Pro user features with advanced queries
 * - Enhanced security with subscription-based permissions
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
