import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import * as schema from './schema';

// Open the database
const expo = openDatabaseSync('focus25.db', { enableChangeListener: true });

// Create drizzle instance
export const db = drizzle(expo, { schema });

// Migration function
export const runMigrations = async () => {
  try {
    await migrate(db, {
      migrationsFolder: './src/db/migrations',
    });
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// Initialize database
export const initializeDatabase = async () => {
  try {
    await runMigrations();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

export { schema };
export * from './schema';