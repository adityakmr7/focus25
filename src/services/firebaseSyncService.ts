import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { databaseService } from '../data/database';

export interface SyncResult {
    success: boolean;
    message: string;
    error?: Error;
}

export interface UserData {
    statistics: any;
    flowMetrics: any;
    settings: any;
    theme: any;
    todos: any[];
    lastSync: Date;
}

class FirebaseSyncService {
    private isInitialized = false;

    constructor() {
        this.initialize();
    }

    private sanitizeDataForFirestore(data: any): any {
        if (data === undefined) {
            return null;
        }
        
        if (data === null) {
            return null;
        }
        
        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeDataForFirestore(item));
        }
        
        if (typeof data === 'object' && data !== null) {
            const sanitized: any = {};
            for (const [key, value] of Object.entries(data)) {
                const sanitizedValue = this.sanitizeDataForFirestore(value);
                if (sanitizedValue !== undefined) {
                    sanitized[key] = sanitizedValue;
                }
            }
            return sanitized;
        }
        
        return data;
    }

    private async initialize() {
        try {
            // Check if Firebase is configured
            if (auth().currentUser) {
                this.isInitialized = true;
                console.log('Firebase sync service initialized');
            }
        } catch (error) {
            console.warn('Firebase sync service initialization failed:', error);
        }
    }

    private getCurrentUserId(): string | null {
        const user = auth().currentUser;
        return user ? user.uid : null;
    }

    private getUserDataCollection() {
        const userId = this.getCurrentUserId();
        if (!userId) {
            throw new Error('User not authenticated');
        }
        return firestore().collection('userData').doc(userId);
    }

    private async backupLocalData(): Promise<UserData> {
        const userId = this.getCurrentUserId();
        const [statistics, flowMetrics, settings, theme, todos] = await Promise.all([
            databaseService.getStatistics(),
            databaseService.getFlowMetrics(),
            databaseService.getSettings(),
            databaseService.getTheme(),
            databaseService.getTodos(userId || undefined),
        ]);

        // If user is authenticated, assign userId to any legacy todos (for future sync consistency)
        if (userId) {
            for (const todo of todos) {
                if (!todo.userId) {
                    const updatedTodo = { ...todo, userId };
                    await databaseService.saveTodo(updatedTodo);
                    todo.userId = userId; // Update the in-memory object too
                }
            }
        }

        const userData = {
            statistics,
            flowMetrics,
            settings,
            theme,
            todos,
            lastSync: new Date(),
        };

        // Sanitize data to remove undefined values for Firestore
        return this.sanitizeDataForFirestore(userData);
    }

    private async restoreLocalData(userData: UserData): Promise<void> {
        try {
            // Restore data to local database
            await Promise.all([
                databaseService.saveStatistics(userData.statistics),
                databaseService.saveFlowMetrics(userData.flowMetrics),
                databaseService.saveSettings(userData.settings),
                databaseService.saveTheme(userData.theme),
            ]);

            // Restore todos
            for (const todo of userData.todos) {
                await databaseService.saveTodo(todo);
            }

            console.log('Local data restored successfully from cloud');
        } catch (error) {
            console.error('Error restoring local data:', error);
            throw error;
        }
    }

    async syncToFirebase(): Promise<SyncResult> {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) {
                return {
                    success: false,
                    message: 'Please sign in to sync your data to the cloud',
                };
            }

            // Backup local data
            const userData = await this.backupLocalData();
            
            // Save to Firestore
            const userDataRef = this.getUserDataCollection();
            await userDataRef.set(userData, { merge: true });

            console.log('Data synced successfully to cloud for user:', userId);

            return {
                success: true,
                message: 'Your data has been successfully synced to the cloud!',
            };

        } catch (error) {
            console.error('Firebase sync failed:', error);
            return {
                success: false,
                message: 'Failed to sync data to cloud. Please try again.',
                error: error instanceof Error ? error : new Error('Unknown error'),
            };
        }
    }

    async syncFromFirebase(): Promise<SyncResult> {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) {
                return {
                    success: false,
                    message: 'Please sign in to sync your data from the cloud',
                };
            }

            // Get data from Firestore
            const userDataRef = this.getUserDataCollection();
            const doc = await userDataRef.get();

            if (!doc.exists) {
                return {
                    success: false,
                    message: 'No cloud data found for your account',
                };
            }

            const userData = doc.data() as UserData;
            
            // Convert Firestore timestamp back to Date
            if (userData.lastSync && typeof userData.lastSync === 'object' && 'toDate' in userData.lastSync) {
                userData.lastSync = (userData.lastSync as any).toDate();
            }

            // Restore data to local database
            await this.restoreLocalData(userData);

            console.log('Data synced successfully from cloud for user:', userId);

            return {
                success: true,
                message: 'Your data has been successfully restored from the cloud!',
            };

        } catch (error) {
            console.error('Firebase sync from cloud failed:', error);
            return {
                success: false,
                message: 'Failed to sync data from cloud. Please try again.',
                error: error instanceof Error ? error : new Error('Unknown error'),
            };
        }
    }

    async getCloudSyncInfo(): Promise<{
        hasCloudData: boolean;
        lastSync: Date | null;
        isSignedIn: boolean;
    }> {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) {
                return {
                    hasCloudData: false,
                    lastSync: null,
                    isSignedIn: false,
                };
            }

            // Check Firestore for cloud data
            const userDataRef = this.getUserDataCollection();
            const doc = await userDataRef.get();
            
            const hasCloudData = doc.exists;
            let lastSync: Date | null = null;
            
            if (hasCloudData) {
                const data = doc.data() as UserData;
                if (data.lastSync) {
                    lastSync = typeof data.lastSync === 'object' && 'toDate' in data.lastSync ? 
                        (data.lastSync as any).toDate() : 
                        data.lastSync;
                }
            }

            return {
                hasCloudData,
                lastSync,
                isSignedIn: true,
            };
        } catch (error) {
            console.error('Failed to get cloud sync info:', error);
            return {
                hasCloudData: false,
                lastSync: null,
                isSignedIn: false,
            };
        }
    }

    async clearCloudData(): Promise<SyncResult> {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) {
                return {
                    success: false,
                    message: 'Please sign in to clear cloud data',
                };
            }

            // Clear Firestore data
            const userDataRef = this.getUserDataCollection();
            await userDataRef.delete();

            console.log('Cloud data cleared successfully for user:', userId);

            return {
                success: true,
                message: 'Your cloud data has been cleared successfully!',
            };
        } catch (error) {
            console.error('Failed to clear cloud data:', error);
            return {
                success: false,
                message: 'Failed to clear cloud data. Please try again.',
                error: error instanceof Error ? error : new Error('Unknown error'),
            };
        }
    }

    async performFullSync(): Promise<SyncResult> {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) {
                return {
                    success: false,
                    message: 'Please sign in to perform full sync',
                };
            }

            // First, sync to cloud (backup current data)
            const syncToResult = await this.syncToFirebase();
            if (!syncToResult.success) {
                return syncToResult;
            }

            return {
                success: true,
                message: 'Full sync completed successfully!',
            };
        } catch (error) {
            console.error('Full sync failed:', error);
            return {
                success: false,
                message: 'Full sync failed. Please try again.',
                error: error instanceof Error ? error : new Error('Unknown error'),
            };
        }
    }
}

export const firebaseSyncService = new FirebaseSyncService();