import { localDatabaseService, Todo } from '@/services/local-database-service';
import { createSupabaseService } from '@/services/supabase-service';
import { errorHandlingService } from '@/services/error-handling-service';
import { supabase } from '@/configs/supabase-config';
import { showError, showSuccess } from '@/utils/error-toast';

export interface MigrationResult {
    success: boolean;
    migratedCount: number;
    totalCount: number;
    errorCount: number;
    errors: Array<{ todoId: string; error: string }>;
    message: string;
}

export type MigrationStatus = 'idle' | 'in_progress' | 'completed' | 'failed' | 'partial_success';

/**
 * Todo Migration Service
 * Handles migration of local todos to Supabase when user upgrades to pro
 */
class TodoMigrationService {
    private migrationStatus: MigrationStatus = 'idle';
    private lastMigrationResult: MigrationResult | null = null;
    /**
     * Get current migration status
     */
    getMigrationStatus(): MigrationStatus {
        return this.migrationStatus;
    }

    /**
     * Get last migration result
     */
    getLastMigrationResult(): MigrationResult | null {
        return this.lastMigrationResult;
    }

    /**
     * Migrate all local todos to Supabase
     * @param userId - The authenticated user's ID
     * @param showNotifications - Whether to show success/error notifications (default: true)
     * @returns Promise<MigrationResult> - Detailed migration result
     */
    async migrateLocalTodosToSupabase(
        userId: string,
        showNotifications: boolean = true,
    ): Promise<MigrationResult> {
        this.migrationStatus = 'in_progress';

        try {
            // Wait for local database to be initialized
            await localDatabaseService.waitForInitialization();

            // Get all local todos
            const localTodos = await localDatabaseService.getTodos();
            
            if (localTodos.length === 0) {
                console.log('[TodoMigration] No local todos to migrate');
                const result: MigrationResult = {
                    success: true,
                    migratedCount: 0,
                    totalCount: 0,
                    errorCount: 0,
                    errors: [],
                    message: 'No todos to migrate',
                };
                this.lastMigrationResult = result;
                this.migrationStatus = 'completed';
                return result;
            }

            console.log(`[TodoMigration] Starting migration of ${localTodos.length} todos to Supabase`);

            // Create Supabase service
            const supabaseService = createSupabaseService(userId);

            // Migrate each todo
            let migratedCount = 0;
            const migrationErrors: Array<{ todoId: string; error: string }> = [];

            // Get existing todos once to avoid multiple API calls
            let existingTodos: any[] = [];
            try {
                existingTodos = await supabaseService.getTodos();
            } catch (error) {
                console.error('[TodoMigration] Failed to fetch existing todos:', error);
            }

            for (const localTodo of localTodos) {
                try {
                    // Check if todo already exists in Supabase (by ID)
                    const exists = existingTodos.some((t) => t.id === localTodo.id);

                    if (exists) {
                        // Update existing todo
                        await supabaseService.updateTodo(localTodo.id, {
                            title: localTodo.title,
                            description: localTodo.description,
                            icon: localTodo.icon,
                            isCompleted: localTodo.isCompleted,
                            completedAt: localTodo.completedAt || undefined,
                            category: localTodo.category,
                            priority: localTodo.priority,
                            estimatedMinutes: localTodo.estimatedMinutes,
                        });
                    } else {
                        // Create new todo in Supabase
                        await supabaseService.createTodo({
                            title: localTodo.title,
                            description: localTodo.description,
                            icon: localTodo.icon,
                            category: localTodo.category,
                            priority: localTodo.priority,
                            estimatedMinutes: localTodo.estimatedMinutes,
                        });

                        // If the todo was completed, update it
                        if (localTodo.isCompleted) {
                            await supabaseService.updateTodo(localTodo.id, {
                                isCompleted: true,
                                completedAt: localTodo.completedAt || undefined,
                            });
                        }
                    }

                    migratedCount++;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    console.error(`[TodoMigration] Failed to migrate todo ${localTodo.id}:`, error);
                    migrationErrors.push({
                        todoId: localTodo.id,
                        error: errorMessage,
                    });
                }
            }

            const success = migrationErrors.length === 0;
            const result: MigrationResult = {
                success,
                migratedCount,
                totalCount: localTodos.length,
                errorCount: migrationErrors.length,
                errors: migrationErrors,
                message: this.getMigrationMessage(migratedCount, localTodos.length, migrationErrors.length),
            };

            this.lastMigrationResult = result;
            this.migrationStatus = success ? 'completed' : migrationErrors.length === localTodos.length ? 'failed' : 'partial_success';

            // Show notifications if requested
            if (showNotifications) {
                if (success) {
                    showSuccess(
                        `Successfully migrated ${migratedCount} ${migratedCount === 1 ? 'todo' : 'todos'} to cloud`,
                        'Migration Complete',
                    );
                } else if (migrationErrors.length < localTodos.length) {
                    showError(
                        new Error(
                            `Migrated ${migratedCount} of ${localTodos.length} todos. ${migrationErrors.length} failed. You can retry later.`,
                        ),
                        { action: 'TodoMigration.partialSuccess' },
                    );
                } else {
                    showError(
                        new Error(
                            'Failed to migrate todos to cloud. Please check your connection and try again.',
                        ),
                        { action: 'TodoMigration.failed' },
                    );
                }
            }

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const result: MigrationResult = {
                success: false,
                migratedCount: 0,
                totalCount: 0,
                errorCount: 1,
                errors: [{ todoId: 'all', error: errorMessage }],
                message: `Migration failed: ${errorMessage}`,
            };

            this.lastMigrationResult = result;
            this.migrationStatus = 'failed';

            errorHandlingService.processError(error, { action: 'TodoMigration.migrateLocalTodosToSupabase' });
            
            if (showNotifications) {
                showError(
                    new Error('Failed to migrate todos. Please try again later.'),
                    { action: 'TodoMigration.migrateLocalTodosToSupabase' },
                );
            }

            return result;
        }
    }

    /**
     * Retry migration for failed todos
     * @param userId - The authenticated user's ID
     * @param showNotifications - Whether to show notifications
     * @returns Promise<MigrationResult> - Retry result
     */
    async retryMigration(userId: string, showNotifications: boolean = true): Promise<MigrationResult> {
        if (!this.lastMigrationResult || this.lastMigrationResult.errors.length === 0) {
            const result: MigrationResult = {
                success: true,
                migratedCount: 0,
                totalCount: 0,
                errorCount: 0,
                errors: [],
                message: 'No failed migrations to retry',
            };
            return result;
        }

        // Retry only failed todos
        try {
            await localDatabaseService.waitForInitialization();
            const supabaseService = createSupabaseService(userId);
            const localTodos = await localDatabaseService.getTodos();

            const failedTodoIds = this.lastMigrationResult.errors.map((e) => e.todoId);
            const todosToRetry = localTodos.filter((todo) => failedTodoIds.includes(todo.id));

            if (todosToRetry.length === 0) {
                const result: MigrationResult = {
                    success: true,
                    migratedCount: 0,
                    totalCount: 0,
                    errorCount: 0,
                    errors: [],
                    message: 'No todos found to retry',
                };
                return result;
            }

            // Retry migration
            return await this.migrateLocalTodosToSupabase(userId, showNotifications);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const result: MigrationResult = {
                success: false,
                migratedCount: 0,
                totalCount: 0,
                errorCount: 1,
                errors: [{ todoId: 'retry', error: errorMessage }],
                message: `Retry failed: ${errorMessage}`,
            };

            if (showNotifications) {
                showError(
                    new Error('Failed to retry migration. Please try again later.'),
                    { action: 'TodoMigration.retryMigration' },
                );
            }

            return result;
        }
    }

    /**
     * Get user-friendly migration message
     */
    private getMigrationMessage(
        migratedCount: number,
        totalCount: number,
        errorCount: number,
    ): string {
        if (errorCount === 0) {
            return `Successfully migrated ${migratedCount} ${migratedCount === 1 ? 'todo' : 'todos'}`;
        } else if (errorCount === totalCount) {
            return 'Migration failed. Please check your connection and try again.';
        } else {
            return `Migrated ${migratedCount} of ${totalCount} todos. ${errorCount} failed.`;
        }
    }

    /**
     * Check if migration is needed
     * @param userId - The authenticated user's ID
     * @returns Promise<boolean> - True if local todos exist and should be migrated
     */
    async shouldMigrate(userId: string): Promise<boolean> {
        try {
            await localDatabaseService.waitForInitialization();
            const localTodos = await localDatabaseService.getTodos();
            
            if (localTodos.length === 0) {
                return false;
            }

            // Check if user already has todos in Supabase
            const supabaseService = createSupabaseService(userId);
            const supabaseTodos = await supabaseService.getTodos();

            // If Supabase has fewer todos than local, migration might be needed
            // But we'll migrate anyway to ensure all local data is in cloud
            return true;
        } catch (error) {
            console.error('[TodoMigration] Error checking migration status:', error);
            return false;
        }
    }

    /**
     * Download todos from Supabase to local (for downgrade scenario)
     * Note: This is optional and may not be needed if we keep data in Supabase
     */
    async downloadSupabaseTodosToLocal(userId: string): Promise<number> {
        try {
            await localDatabaseService.waitForInitialization();

            const supabaseService = createSupabaseService(userId);
            const supabaseTodos = await supabaseService.getTodos();

            if (supabaseTodos.length === 0) {
                return 0;
            }

            let downloadedCount = 0;

            for (const supabaseTodo of supabaseTodos) {
                try {
                    // Check if todo exists locally
                    const existingTodo = await localDatabaseService.getTodo(supabaseTodo.id);

                    if (existingTodo) {
                        // Update local todo with Supabase data
                        await localDatabaseService.updateTodo(supabaseTodo.id, {
                            title: supabaseTodo.title,
                            description: supabaseTodo.description,
                            icon: supabaseTodo.icon,
                            isCompleted: supabaseTodo.isCompleted,
                            completedAt: supabaseTodo.completedAt || null,
                            category: supabaseTodo.category,
                            priority: supabaseTodo.priority,
                            estimatedMinutes: supabaseTodo.estimatedMinutes,
                        });
                    } else {
                        // Create new local todo
                        await localDatabaseService.createTodo({
                            title: supabaseTodo.title,
                            description: supabaseTodo.description,
                            icon: supabaseTodo.icon,
                            category: supabaseTodo.category,
                            priority: supabaseTodo.priority,
                            estimatedMinutes: supabaseTodo.estimatedMinutes,
                            isCompleted: supabaseTodo.isCompleted,
                            completedAt: supabaseTodo.completedAt || null,
                        });
                    }

                    downloadedCount++;
                } catch (error) {
                    console.error(`[TodoMigration] Failed to download todo ${supabaseTodo.id}:`, error);
                }
            }

            console.log(`[TodoMigration] Downloaded ${downloadedCount} todos from Supabase to local`);
            return downloadedCount;
        } catch (error) {
            errorHandlingService.processError(error, { action: 'TodoMigration.downloadSupabaseTodosToLocal' });
            throw error;
        }
    }
}

// Export singleton instance
export const todoMigrationService = new TodoMigrationService();

