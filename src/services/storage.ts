import { MMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

/**
 * MMKV Storage Service
 * 
 * This service provides a high-performance, encrypted storage solution
 * using react-native-mmkv. It's significantly faster than AsyncStorage
 * and provides better security with built-in encryption.
 */

// Create different MMKV instances for different data types
// This helps with organization and allows for different encryption keys
export const appStorage = new MMKV({
  id: 'app-storage',
  encryptionKey: 'flow-app-encryption-key-2024'
});

export const userStorage = new MMKV({
  id: 'user-storage', 
  encryptionKey: 'flow-user-encryption-key-2024'
});

export const settingsStorage = new MMKV({
  id: 'settings-storage',
  encryptionKey: 'flow-settings-encryption-key-2024'
});

export const statisticsStorage = new MMKV({
  id: 'statistics-storage',
  encryptionKey: 'flow-stats-encryption-key-2024'
});

/**
 * Zustand MMKV Storage Adapter
 * 
 * This adapter allows Zustand stores to use MMKV for persistence
 * instead of AsyncStorage, providing better performance.
 */
export const createMMKVStorage = (storage: MMKV): StateStorage => ({
  getItem: (name: string) => {
    try {
      const value = storage.getString(name);
      return value ?? null;
    } catch (error) {
      console.error(`Error getting item ${name} from MMKV:`, error);
      return null;
    }
  },
  
  setItem: (name: string, value: string) => {
    try {
      storage.set(name, value);
    } catch (error) {
      console.error(`Error setting item ${name} in MMKV:`, error);
    }
  },
  
  removeItem: (name: string) => {
    try {
      storage.delete(name);
    } catch (error) {
      console.error(`Error removing item ${name} from MMKV:`, error);
    }
  },
});

/**
 * Storage Service Class
 * 
 * Provides a unified interface for all storage operations
 * with type safety and error handling.
 */
export class StorageService {
  private storage: MMKV;

  constructor(storage: MMKV) {
    this.storage = storage;
  }

  /**
   * Store a string value
   */
  setString(key: string, value: string): void {
    try {
      this.storage.set(key, value);
    } catch (error) {
      console.error(`Error storing string for key ${key}:`, error);
    }
  }

  /**
   * Retrieve a string value
   */
  getString(key: string, defaultValue?: string): string | undefined {
    try {
      return this.storage.getString(key) ?? defaultValue;
    } catch (error) {
      console.error(`Error retrieving string for key ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Store a number value
   */
  setNumber(key: string, value: number): void {
    try {
      this.storage.set(key, value);
    } catch (error) {
      console.error(`Error storing number for key ${key}:`, error);
    }
  }

  /**
   * Retrieve a number value
   */
  getNumber(key: string, defaultValue?: number): number | undefined {
    try {
      return this.storage.getNumber(key) ?? defaultValue;
    } catch (error) {
      console.error(`Error retrieving number for key ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Store a boolean value
   */
  setBoolean(key: string, value: boolean): void {
    try {
      this.storage.set(key, value);
    } catch (error) {
      console.error(`Error storing boolean for key ${key}:`, error);
    }
  }

  /**
   * Retrieve a boolean value
   */
  getBoolean(key: string, defaultValue?: boolean): boolean | undefined {
    try {
      return this.storage.getBoolean(key) ?? defaultValue;
    } catch (error) {
      console.error(`Error retrieving boolean for key ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Store an object as JSON
   */
  setObject<T>(key: string, value: T): void {
    try {
      this.storage.set(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error storing object for key ${key}:`, error);
    }
  }

  /**
   * Retrieve an object from JSON
   */
  getObject<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const jsonString = this.storage.getString(key);
      if (jsonString) {
        return JSON.parse(jsonString) as T;
      }
      return defaultValue;
    } catch (error) {
      console.error(`Error retrieving object for key ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Remove a value
   */
  remove(key: string): void {
    try {
      this.storage.delete(key);
    } catch (error) {
      console.error(`Error removing key ${key}:`, error);
    }
  }

  /**
   * Check if a key exists
   */
  contains(key: string): boolean {
    try {
      return this.storage.contains(key);
    } catch (error) {
      console.error(`Error checking if key ${key} exists:`, error);
      return false;
    }
  }

  /**
   * Get all keys
   */
  getAllKeys(): string[] {
    try {
      return this.storage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    try {
      this.storage.clearAll();
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }

  /**
   * Get storage size in bytes
   */
  getSize(): number {
    try {
      return this.storage.size;
    } catch (error) {
      console.error('Error getting storage size:', error);
      return 0;
    }
  }
}

// Create service instances for different data types
export const appStorageService = new StorageService(appStorage);
export const userStorageService = new StorageService(userStorage);
export const settingsStorageService = new StorageService(settingsStorage);
export const statisticsStorageService = new StorageService(statisticsStorage);

/**
 * Data Export Service
 * 
 * Provides functionality to export data in various formats
 */
export class DataExportService {
  /**
   * Export all app data as JSON
   */
  static exportAllDataAsJSON(): string {
    try {
      const allData = {
        app: DataExportService.getStorageData(appStorage),
        user: DataExportService.getStorageData(userStorage),
        settings: DataExportService.getStorageData(settingsStorage),
        statistics: DataExportService.getStorageData(statisticsStorage),
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      return JSON.stringify(allData, null, 2);
    } catch (error) {
      console.error('Error exporting data as JSON:', error);
      throw new Error('Failed to export data');
    }
  }

  /**
   * Export specific storage data as CSV
   */
  static exportStorageAsCSV(storage: MMKV, name: string): string {
    try {
      const keys = storage.getAllKeys();
      const csvRows = ['Key,Value,Type'];

      keys.forEach(key => {
        try {
          const value = storage.getString(key);
          const type = typeof value;
          // Escape commas and quotes in CSV
          const escapedValue = value ? `"${value.replace(/"/g, '""')}"` : '';
          csvRows.push(`"${key}",${escapedValue},"${type}"`);
        } catch (error) {
          console.warn(`Error reading key ${key}:`, error);
        }
      });

      return csvRows.join('\n');
    } catch (error) {
      console.error(`Error exporting ${name} storage as CSV:`, error);
      throw new Error(`Failed to export ${name} data`);
    }
  }

  /**
   * Get all data from a storage instance
   */
  private static getStorageData(storage: MMKV): Record<string, any> {
    const data: Record<string, any> = {};
    
    try {
      const keys = storage.getAllKeys();
      keys.forEach(key => {
        try {
          // Try to get as different types
          const stringValue = storage.getString(key);
          const numberValue = storage.getNumber(key);
          const booleanValue = storage.getBoolean(key);

          if (stringValue !== undefined) {
            data[key] = stringValue;
          } else if (numberValue !== undefined) {
            data[key] = numberValue;
          } else if (booleanValue !== undefined) {
            data[key] = booleanValue;
          }
        } catch (error) {
          console.warn(`Error reading key ${key}:`, error);
        }
      });
    } catch (error) {
      console.error('Error getting storage data:', error);
    }

    return data;
  }

  /**
   * Get storage statistics
   */
  static getStorageStats(): {
    app: { size: number; keys: number };
    user: { size: number; keys: number };
    settings: { size: number; keys: number };
    statistics: { size: number; keys: number };
    total: { size: number; keys: number };
  } {
    try {
      const appStats = { size: appStorage.size, keys: appStorage.getAllKeys().length };
      const userStats = { size: userStorage.size, keys: userStorage.getAllKeys().length };
      const settingsStats = { size: settingsStorage.size, keys: settingsStorage.getAllKeys().length };
      const statisticsStats = { size: statisticsStorage.size, keys: statisticsStorage.getAllKeys().length };

      return {
        app: appStats,
        user: userStats,
        settings: settingsStats,
        statistics: statisticsStats,
        total: {
          size: appStats.size + userStats.size + settingsStats.size + statisticsStats.size,
          keys: appStats.keys + userStats.keys + settingsStats.keys + statisticsStats.keys
        }
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        app: { size: 0, keys: 0 },
        user: { size: 0, keys: 0 },
        settings: { size: 0, keys: 0 },
        statistics: { size: 0, keys: 0 },
        total: { size: 0, keys: 0 }
      };
    }
  }
}