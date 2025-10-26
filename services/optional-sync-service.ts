import { supabase } from '@/configs/supabase-config';
import {
    localDatabaseService,
    Todo,
    Session,
    UserSettings,
    SyncLog,
} from '@/services/local-database-service';

/**
 * Optional Sync Service
 * Handles synchronization between local SQLite database and Supabase
 * Only syncs when user explicitly enables it
 */
class OptionalSyncService {
    private isInitialized = false;
    private syncInProgress = false;

    async initialize(): Promise<boolean> {
        try {
            if (this.isInitialized) return true;

            // Check if user is authenticated
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();
            if (authError || !user) {
                console.log('User not authenticated, sync disabled');
                return false;
            }

            // Check if sync is enabled in settings
            const settings = await localDatabaseService.getSettings();
            if (!settings?.syncEnabled) {
                console.log('Sync is disabled, skipping initialization');
                return false;
            }

            this.isInitialized = true;
            console.log('Optional sync service initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize optional sync service:', error);
            return false;
        }
    }

    /**
     * Enable sync and perform initial sync
     */
    async enableSync(): Promise<boolean> {
        try {
            // Check if user is authenticated
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();
            if (authError || !user) {
                console.log('Cannot enable sync: user not authenticated');
                return false;
            }

            // Update settings to enable sync
            await localDatabaseService.updateSettings({
                syncEnabled: true,
                lastSyncAt: new Date().toISOString(),
            });

            // Perform initial sync
            const success = await this.performSync();

            if (success) {
                console.log('Sync enabled and initial sync completed');
            } else {
                console.log('Sync enabled but initial sync failed');
            }

            return success;
        } catch (error) {
            console.error('Failed to enable sync:', error);
            return false;
        }
    }

    /**
     * Disable sync
     */
    async disableSync(): Promise<void> {
        try {
            await localDatabaseService.updateSettings({
                syncEnabled: false,
                lastSyncAt: undefined,
            });

            console.log('Sync disabled');
        } catch (error) {
            console.error('Failed to disable sync:', error);
        }
    }

    /**
     * Perform bidirectional sync
     */
    async performSync(): Promise<boolean> {
        if (this.syncInProgress) {
            console.log('Sync already in progress, skipping');
            return false;
        }

        try {
            this.syncInProgress = true;
            console.log('Starting sync process...');

            // Check if sync is enabled
            const settings = await localDatabaseService.getSettings();
            if (!settings?.syncEnabled) {
                console.log('Sync is disabled, skipping');
                return false;
            }

            // Get unsynced local changes
            const unsyncedChanges = await localDatabaseService.getUnsyncedChanges();
            console.log(`Found ${unsyncedChanges.length} unsynced changes`);

            // Upload local changes to Supabase
            for (const change of unsyncedChanges) {
                await this.syncChangeToSupabase(change);
            }

            // Download changes from Supabase
            await this.syncFromSupabase();

            // Update last sync time
            await localDatabaseService.updateSettings({
                lastSyncAt: new Date().toISOString(),
            });

            console.log('Sync completed successfully');
            return true;
        } catch (error) {
            console.error('Sync failed:', error);
            return false;
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Sync a single change to Supabase
     */
    private async syncChangeToSupabase(change: SyncLog): Promise<void> {
        try {
            const { tableName, recordId, operation } = change;

            if (tableName === 'todos') {
                await this.syncTodoChange(recordId, operation);
            } else if (tableName === 'sessions') {
                await this.syncSessionChange(recordId, operation);
            }

            // Mark as synced
            await localDatabaseService.markAsSynced(change.id);
        } catch (error) {
            console.error(`Failed to sync ${change.tableName} ${change.operation}:`, error);
            await localDatabaseService.markSyncError(
                change.id,
                error instanceof Error ? error.message : 'Unknown error',
            );
        }
    }

    /**
     * Sync todo changes to Supabase
     */
    private async syncTodoChange(todoId: string, operation: string): Promise<void> {
        // Get authenticated user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
            throw new Error('User not authenticated');
        }

        if (operation === 'create' || operation === 'update') {
            const todo = await localDatabaseService.getTodo(todoId);
            if (!todo) return;

            const { error } = await supabase.from('todos').upsert({
                id: todo.id,
                title: todo.title,
                description: todo.description || undefined,
                icon: todo.icon || undefined,
                isCompleted: todo.isCompleted,
                created_at: todo.createdAt,
                completedAt: todo.completedAt || undefined,
                user_id: user.id, // Use authenticated user's ID
            });

            if (error) throw error;
        } else if (operation === 'delete') {
            const { error } = await supabase.from('todos').delete().eq('id', todoId);

            if (error) throw error;
        }
    }

    /**
     * Sync session changes to Supabase
     */
    private async syncSessionChange(sessionId: string, operation: string): Promise<void> {
        // Get authenticated user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
            throw new Error('User not authenticated');
        }

        if (operation === 'create' || operation === 'update') {
            const sessions = await localDatabaseService.getSessions();
            const session = sessions.find((s) => s.id === sessionId);
            if (!session) return;

            const { error } = await supabase.from('sessions').upsert({
                id: session.id,
                duration: session.duration,
                type: session.type,
                completed_at: session.endTime || undefined,
                user_id: user.id, // Use authenticated user's ID
            });

            if (error) throw error;
        } else if (operation === 'delete') {
            const { error } = await supabase.from('sessions').delete().eq('id', sessionId);

            if (error) throw error;
        }
    }

    /**
     * Sync changes from Supabase to local database
     */
    private async syncFromSupabase(): Promise<void> {
        try {
            // Get last sync time
            const settings = await localDatabaseService.getSettings();
            const lastSyncAt = settings?.lastSyncAt;

            // Sync todos
            await this.syncTodosFromSupabase(lastSyncAt || undefined);

            // Sync sessions
            await this.syncSessionsFromSupabase(lastSyncAt || undefined);
        } catch (error) {
            console.error('Failed to sync from Supabase:', error);
            throw error;
        }
    }

    /**
     * Sync todos from Supabase
     */
    private async syncTodosFromSupabase(lastSyncAt?: string): Promise<void> {
        try {
            let query = supabase.from('todos').select('*');

            if (lastSyncAt) {
                query = query.gte('created_at', lastSyncAt);
            }

            const { data: todos, error } = await query;

            if (error) throw error;
            if (!todos) return;

            // Import todos to local database
            for (const todo of todos) {
                const localTodo: Todo = {
                    id: todo.id,
                    title: todo.title,
                    description: todo.description,
                    icon: todo.icon,
                    isCompleted: todo.isCompleted,
                    createdAt: todo.created_at,
                    completedAt: todo.completedAt || null,
                    category: undefined,
                    priority: 0,
                    estimatedMinutes: undefined,
                    actualMinutes: 0,
                };

                // Check if todo exists locally
                const existingTodo = await localDatabaseService.getTodo(todo.id);
                if (existingTodo) {
                    await localDatabaseService.updateTodo(todo.id, localTodo);
                } else {
                    await localDatabaseService.createTodo(localTodo);
                }
            }

            console.log(`Synced ${todos.length} todos from Supabase`);
        } catch (error) {
            console.error('Failed to sync todos from Supabase:', error);
            throw error;
        }
    }

    /**
     * Sync sessions from Supabase
     */
    private async syncSessionsFromSupabase(lastSyncAt?: string): Promise<void> {
        try {
            let query = supabase.from('sessions').select('*');

            if (lastSyncAt) {
                query = query.gte('completed_at', lastSyncAt);
            }

            const { data: sessions, error } = await query;

            if (error) throw error;
            if (!sessions) return;

            // Import sessions to local database
            for (const session of sessions) {
                const localSession: Session = {
                    id: session.id,
                    todoId: undefined,
                    todoTitle: undefined,
                    startTime: new Date(Date.now() - session.duration * 1000).toISOString(),
                    endTime: session.completed_at || undefined,
                    duration: session.duration,
                    type: session.type,
                    sessionNumber: undefined,
                    isCompleted: true,
                    notes: undefined,
                };

                await localDatabaseService.createSession(localSession);
            }

            console.log(`Synced ${sessions.length} sessions from Supabase`);
        } catch (error) {
            console.error('Failed to sync sessions from Supabase:', error);
            throw error;
        }
    }

    /**
     * Get sync status
     */
    async getSyncStatus(): Promise<{
        enabled: boolean;
        lastSyncAt?: string;
        unsyncedChanges: number;
    }> {
        try {
            const settings = await localDatabaseService.getSettings();
            const unsyncedChanges = await localDatabaseService.getUnsyncedChanges();

            return {
                enabled: settings?.syncEnabled || false,
                lastSyncAt: settings?.lastSyncAt || undefined,
                unsyncedChanges: unsyncedChanges.length,
            };
        } catch (error) {
            console.error('Failed to get sync status:', error);
            return {
                enabled: false,
                unsyncedChanges: 0,
            };
        }
    }

    /**
     * Force sync (ignore last sync time)
     */
    async forceSync(): Promise<boolean> {
        try {
            console.log('Performing force sync...');

            // Clear sync log to force full sync
            await localDatabaseService.updateSettings({
                lastSyncAt: undefined,
            });

            return await this.performSync();
        } catch (error) {
            console.error('Force sync failed:', error);
            return false;
        }
    }
}

// Export singleton instance
export const optionalSyncService = new OptionalSyncService();
