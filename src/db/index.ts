import {drizzle} from 'drizzle-orm/expo-sqlite';
import {openDatabaseSync} from 'expo-sqlite';
import * as schema from './schema';


export const DB_NAME = 'focus25.db';
// Open the database
export const expoDB = openDatabaseSync(DB_NAME);

// Create drizzle instance
export const db = drizzle(expoDB, { schema });

export { schema };
export * from './schema';
