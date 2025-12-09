import * as SQLite from 'expo-sqlite';
import { performanceMonitor } from './performance-monitor';

// Simple UUID v4 generator for React Native
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// Database types
export interface Subtask {
    id: string;
    title: string;
    done: boolean;
}

export interface Todo {
    id: string;
    title: string;
    description?: string;
    icon?: string;
    isCompleted: boolean;
    createdAt: string;
    completedAt?: string | null;
    category?: string;
    priority: number;
    estimatedMinutes?: number;
    actualMinutes: number;
    reminderAt?: string | null;
    subtasks?: Subtask[];
}

export interface Session {
    id: string;
    todoId?: string | null;
    todoTitle?: string | null;
    startTime: string;
    endTime?: string | null;
    duration: number;
    type: 'focus' | 'break';
    sessionNumber?: number | null;
    isCompleted: boolean;
    notes?: string | null;
}

export interface UserSettings {
    id: string;
    focusDuration: number;
    breakDuration: number;
    notifications: boolean;
    soundEffects: boolean;
    metronome: boolean;
    theme: string;
    userName?: string | null;
    userEmail?: string | null;
    onboardingCompleted: boolean;
    syncEnabled: boolean;
    lastSyncAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface SyncLog {
    id: string;
    tableName: string;
    recordId: string;
    operation: 'create' | 'update' | 'delete';
    timestamp: string;
    synced: boolean;
    error?: string;
}

// Simple cache interface
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
}

class LocalDatabaseService {
    private db: SQLite.SQLiteDatabase | null = null;
    private isInitialized = false;
    private queryCache: Map<string, CacheEntry<any>> = new Map();
    private readonly DEFAULT_CACHE_TTL = 5000; // 5 seconds default TTL

    async initialize(): Promise<boolean> {
        try {
            if (this.isInitialized) return true;

            // Open database
            this.db = await SQLite.openDatabaseAsync('flowzy.db');

            // Read and execute schema
            const schema = await this.loadSchema();
            await this.db.execAsync(schema);

            // Apply lightweight migrations (ignore errors if already applied)
            await this.applyMigrations();

            this.isInitialized = true;
            console.log('Local database initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize local database:', error);
            return false;
        }
    }

    /**
     * Check if the database is initialized
     */
    isDatabaseInitialized(): boolean {
        return this.isInitialized && this.db !== null;
    }

    /**
     * Wait for database initialization
     */
    async waitForInitialization(): Promise<void> {
        if (this.isInitialized) return;

        // Wait up to 5 seconds for initialization
        const maxWaitTime = 5000;
        const checkInterval = 100;
        let waited = 0;

        while (!this.isInitialized && waited < maxWaitTime) {
            await new Promise((resolve) => setTimeout(resolve, checkInterval));
            waited += checkInterval;
        }

        if (!this.isInitialized) {
            throw new Error('Database initialization timeout');
        }
    }

    private async loadSchema(): Promise<string> {
        // In a real app, you'd load this from a file
        // For now, we'll include the schema inline
        return `
      -- SQLite Database Schema for Flowzy Local-First App
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        isCompleted BOOLEAN DEFAULT 0,
        createdAt TEXT NOT NULL,
        completedAt TEXT,
        category TEXT,
        priority INTEGER DEFAULT 0,
        estimatedMinutes INTEGER,
        actualMinutes INTEGER DEFAULT 0,
        reminderAt TEXT,
        subtasks TEXT
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        todoId TEXT,
        todoTitle TEXT,
        startTime TEXT NOT NULL,
        endTime TEXT,
        duration INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('focus', 'break')),
        sessionNumber INTEGER,
        isCompleted BOOLEAN DEFAULT 0,
        notes TEXT,
        FOREIGN KEY (todoId) REFERENCES todos(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS user_settings (
        id TEXT PRIMARY KEY,
        focusDuration INTEGER DEFAULT 25,
        breakDuration INTEGER DEFAULT 5,
        notifications BOOLEAN DEFAULT 1,
        soundEffects BOOLEAN DEFAULT 1,
        metronome BOOLEAN DEFAULT 0,
        theme TEXT DEFAULT 'system',
        userName TEXT,
        userEmail TEXT,
        onboardingCompleted BOOLEAN DEFAULT 0,
        syncEnabled BOOLEAN DEFAULT 0,
        lastSyncAt TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_log (
        id TEXT PRIMARY KEY,
        tableName TEXT NOT NULL,
        recordId TEXT NOT NULL,
        operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
        timestamp TEXT NOT NULL,
        synced BOOLEAN DEFAULT 0,
        error TEXT
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(createdAt);
      CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(isCompleted);
      CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(startTime);
      CREATE INDEX IF NOT EXISTS idx_sessions_todo_id ON sessions(todoId);

      -- Default settings
      INSERT OR IGNORE INTO user_settings (
        id, focusDuration, breakDuration, notifications, soundEffects, 
        metronome, theme, userName, userEmail, onboardingCompleted, 
        syncEnabled, createdAt, updatedAt
      ) VALUES (
        'default_settings', 25, 5, 1, 1, 0, 'system', 'User', '', 
        0, 0, datetime('now'), datetime('now')
      );
    `;
    }

    /**
     * Apply ALTER TABLE migrations safely; ignore if columns already exist.
     */
    private async applyMigrations(): Promise<void> {
        if (!this.db) return;
        try {
            await this.db.execAsync(`ALTER TABLE todos ADD COLUMN reminderAt TEXT;`);
        } catch (_e) {
            // ignore if exists
        }
        try {
            await this.db.execAsync(`ALTER TABLE todos ADD COLUMN subtasks TEXT;`);
        } catch (_e) {
            // ignore if exists
        }
    }

    // ===== TODO OPERATIONS =====

    /**
     * Get cached data if available and not expired
     */
    private getCachedData<T>(key: string): T | null {
        const entry = this.queryCache.get(key);
        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            // Cache expired, remove it
            this.queryCache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Set cached data with TTL
     */
    private setCachedData<T>(key: string, data: T, ttl: number = this.DEFAULT_CACHE_TTL): void {
        this.queryCache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });
    }

    /**
     * Invalidate cache for a specific key or pattern
     */
    private invalidateCache(pattern?: string): void {
        if (!pattern) {
            this.queryCache.clear();
            return;
        }

        // Remove all cache entries matching the pattern
        for (const key of this.queryCache.keys()) {
            if (key.includes(pattern)) {
                this.queryCache.delete(key);
            }
        }
    }

    async getTodos(): Promise<Todo[]> {
        if (!this.db) throw new Error('Database not initialized');

        // Check cache first
        const cacheKey = 'todos:all';
        const cached = this.getCachedData<Todo[]>(cacheKey);
        if (cached) {
            return cached;
        }

        // Track query performance
        performanceMonitor.startMetric('db-query-getTodos');

        // Optimize query to select only needed columns
        const rows = await this.db.getAllAsync(`
      SELECT id, title, description, icon, isCompleted, createdAt, 
             completedAt, category, priority, estimatedMinutes, 
             actualMinutes, reminderAt, subtasks
      FROM todos 
      ORDER BY createdAt DESC
    `);

        performanceMonitor.endMetric('db-query-getTodos');

        // Normalize/parse fields
        const todos = (rows as any[]).map((row) => {
            let parsedSubtasks: Subtask[] | undefined;
            try {
                parsedSubtasks = row.subtasks ? JSON.parse(row.subtasks) : undefined;
            } catch {
                parsedSubtasks = undefined;
            }
            return {
                id: row.id,
                title: row.title,
                description: row.description ?? undefined,
                icon: row.icon ?? undefined,
                isCompleted: !!row.isCompleted,
                createdAt: row.createdAt,
                completedAt: row.completedAt ?? null,
                category: row.category ?? undefined,
                priority: row.priority ?? 0,
                estimatedMinutes: row.estimatedMinutes ?? undefined,
                actualMinutes: row.actualMinutes ?? 0,
                reminderAt: row.reminderAt ?? null,
                subtasks: parsedSubtasks,
            } as Todo;
        });

        // Cache the result
        this.setCachedData(cacheKey, todos);

        return todos;
    }

    async getTodo(id: string): Promise<Todo | null> {
        if (!this.db) throw new Error('Database not initialized');

        const row = await this.db.getFirstAsync(
            `
      SELECT * FROM todos WHERE id = ?
    `,
            [id],
        );

        if (!row) return null;
        let parsedSubtasks: Subtask[] | undefined;
        try {
            parsedSubtasks = (row as any).subtasks ? JSON.parse((row as any).subtasks) : undefined;
        } catch {
            parsedSubtasks = undefined;
        }
        return {
            id: (row as any).id,
            title: (row as any).title,
            description: (row as any).description ?? undefined,
            icon: (row as any).icon ?? undefined,
            isCompleted: !!(row as any).isCompleted,
            createdAt: (row as any).createdAt,
            completedAt: (row as any).completedAt ?? null,
            category: (row as any).category ?? undefined,
            priority: (row as any).priority ?? 0,
            estimatedMinutes: (row as any).estimatedMinutes ?? undefined,
            actualMinutes: (row as any).actualMinutes ?? 0,
            reminderAt: (row as any).reminderAt ?? null,
            subtasks: parsedSubtasks,
        } as Todo;
    }

    async createTodo(todo: Omit<Todo, 'id' | 'createdAt' | 'actualMinutes'>): Promise<string> {
        if (!this.db) throw new Error('Database not initialized');

        performanceMonitor.startMetric('db-query-createTodo');

        const id = generateUUID();
        const now = new Date().toISOString();

        await this.db.runAsync(
            `
      INSERT INTO todos (
        id, title, description, icon, isCompleted, createdAt, 
        completedAt, category, priority, estimatedMinutes, actualMinutes,
        reminderAt, subtasks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
            [
                id,
                todo.title,
                todo.description || null,
                todo.icon || null,
                todo.isCompleted ? 1 : 0,
                now,
                todo.completedAt || null,
                todo.category || null,
                todo.priority || 0,
                todo.estimatedMinutes || null,
                0,
                (todo as any).reminderAt || null,
                JSON.stringify((todo as any).subtasks || []),
            ],
        );

        // Log the change for sync
        await this.logSyncChange('todos', id, 'create');

        // Invalidate todos cache
        this.invalidateCache('todos');

        performanceMonitor.endMetric('db-query-createTodo');

        return id;
    }

    async updateTodo(id: string, updates: Partial<Todo>): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const fields = [];
        const values = [];

        if (updates.title !== undefined) {
            fields.push('title = ?');
            values.push(updates.title);
        }
        if (updates.description !== undefined) {
            fields.push('description = ?');
            values.push(updates.description);
        }
        if (updates.icon !== undefined) {
            fields.push('icon = ?');
            values.push(updates.icon);
        }
        if (updates.isCompleted !== undefined) {
            fields.push('isCompleted = ?');
            values.push(updates.isCompleted ? 1 : 0);
        }
        if (updates.completedAt !== undefined) {
            fields.push('completedAt = ?');
            values.push(updates.completedAt);
        }
        if (updates.category !== undefined) {
            fields.push('category = ?');
            values.push(updates.category);
        }
        if (updates.priority !== undefined) {
            fields.push('priority = ?');
            values.push(updates.priority);
        }
        if (updates.estimatedMinutes !== undefined) {
            fields.push('estimatedMinutes = ?');
            values.push(updates.estimatedMinutes);
        }
        if (updates.actualMinutes !== undefined) {
            fields.push('actualMinutes = ?');
            values.push(updates.actualMinutes);
        }
        if ((updates as any).reminderAt !== undefined) {
            fields.push('reminderAt = ?');
            values.push((updates as any).reminderAt);
        }
        if ((updates as any).subtasks !== undefined) {
            fields.push('subtasks = ?');
            values.push(JSON.stringify((updates as any).subtasks || []));
        }

        if (fields.length === 0) return;

        values.push(id);

        await this.db.runAsync(
            `
      UPDATE todos SET ${fields.join(', ')} WHERE id = ?
    `,
            values,
        );

        // Log the change for sync
        await this.logSyncChange('todos', id, 'update');

        // Invalidate todos cache
        this.invalidateCache('todos');
    }

    async deleteTodo(id: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        await this.db.runAsync('DELETE FROM todos WHERE id = ?', [id]);

        // Log the change for sync
        await this.logSyncChange('todos', id, 'delete');

        // Invalidate todos cache
        this.invalidateCache('todos');
    }

    async getCompletedTodos(): Promise<Todo[]> {
        if (!this.db) throw new Error('Database not initialized');

        const result = await this.db.getAllAsync(`
      SELECT * FROM todos WHERE isCompleted = 1 ORDER BY completedAt DESC
    `);

        return result as Todo[];
    }

    async getActiveTodos(): Promise<Todo[]> {
        if (!this.db) throw new Error('Database not initialized');

        const result = await this.db.getAllAsync(`
      SELECT * FROM todos WHERE isCompleted = 0 ORDER BY createdAt DESC
    `);

        return result as Todo[];
    }

    // ===== SESSION OPERATIONS =====

    async getSessions(): Promise<Session[]> {
        if (!this.db) throw new Error('Database not initialized');

        const result = await this.db.getAllAsync(`
      SELECT * FROM sessions ORDER BY startTime DESC
    `);

        return result as Session[];
    }

    async createSession(session: Omit<Session, 'id'>): Promise<string> {
        if (!this.db) throw new Error('Database not initialized');

        const id = generateUUID();

        await this.db.runAsync(
            `
      INSERT INTO sessions (
        id, todoId, todoTitle, startTime, endTime, duration, 
        type, sessionNumber, isCompleted, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
            [
                id,
                session.todoId || null,
                session.todoTitle || null,
                session.startTime,
                session.endTime || null,
                session.duration,
                session.type,
                session.sessionNumber || null,
                session.isCompleted ? 1 : 0,
                session.notes || null,
            ],
        );

        // Log the change for sync
        await this.logSyncChange('sessions', id, 'create');

        return id;
    }

    async updateSession(id: string, updates: Partial<Session>): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const fields = [];
        const values = [];

        if (updates.todoId !== undefined) {
            fields.push('todoId = ?');
            values.push(updates.todoId);
        }
        if (updates.todoTitle !== undefined) {
            fields.push('todoTitle = ?');
            values.push(updates.todoTitle);
        }
        if (updates.startTime !== undefined) {
            fields.push('startTime = ?');
            values.push(updates.startTime);
        }
        if (updates.endTime !== undefined) {
            fields.push('endTime = ?');
            values.push(updates.endTime);
        }
        if (updates.duration !== undefined) {
            fields.push('duration = ?');
            values.push(updates.duration);
        }
        if (updates.type !== undefined) {
            fields.push('type = ?');
            values.push(updates.type);
        }
        if (updates.sessionNumber !== undefined) {
            fields.push('sessionNumber = ?');
            values.push(updates.sessionNumber);
        }
        if (updates.isCompleted !== undefined) {
            fields.push('isCompleted = ?');
            values.push(updates.isCompleted ? 1 : 0);
        }
        if (updates.notes !== undefined) {
            fields.push('notes = ?');
            values.push(updates.notes);
        }

        if (fields.length === 0) return;

        values.push(id);

        await this.db.runAsync(
            `
      UPDATE sessions SET ${fields.join(', ')} WHERE id = ?
    `,
            values,
        );

        // Log the change for sync
        await this.logSyncChange('sessions', id, 'update');
    }

    async deleteSession(id: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        await this.db.runAsync('DELETE FROM sessions WHERE id = ?', [id]);

        // Log the change for sync
        await this.logSyncChange('sessions', id, 'delete');
    }

    async getSessionsForTodo(todoId: string): Promise<Session[]> {
        if (!this.db) throw new Error('Database not initialized');

        const result = await this.db.getAllAsync(
            `
      SELECT * FROM sessions WHERE todoId = ? ORDER BY startTime DESC
    `,
            [todoId],
        );

        return result as Session[];
    }

    async getTotalTimeForTodo(todoId: string): Promise<number> {
        if (!this.db) throw new Error('Database not initialized');

        const result = await this.db.getFirstAsync(
            `
      SELECT SUM(duration) as total FROM sessions WHERE todoId = ?
    `,
            [todoId],
        );

        return (result as any)?.total || 0;
    }

    // ===== SETTINGS OPERATIONS =====

    async getSettings(): Promise<UserSettings | null> {
        if (!this.db) throw new Error('Database not initialized');

        const result = await this.db.getFirstAsync(`
      SELECT * FROM user_settings WHERE id = 'default_settings'
    `);

        return result as UserSettings | null;
    }

    async updateSettings(updates: Partial<UserSettings>): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const fields = [];
        const values = [];

        if (updates.focusDuration !== undefined) {
            fields.push('focusDuration = ?');
            values.push(updates.focusDuration);
        }
        if (updates.breakDuration !== undefined) {
            fields.push('breakDuration = ?');
            values.push(updates.breakDuration);
        }
        if (updates.notifications !== undefined) {
            fields.push('notifications = ?');
            values.push(updates.notifications ? 1 : 0);
        }
        if (updates.soundEffects !== undefined) {
            fields.push('soundEffects = ?');
            values.push(updates.soundEffects ? 1 : 0);
        }
        if (updates.metronome !== undefined) {
            fields.push('metronome = ?');
            values.push(updates.metronome ? 1 : 0);
        }
        if (updates.theme !== undefined) {
            fields.push('theme = ?');
            values.push(updates.theme);
        }
        if (updates.userName !== undefined) {
            fields.push('userName = ?');
            values.push(updates.userName);
        }
        if (updates.userEmail !== undefined) {
            fields.push('userEmail = ?');
            values.push(updates.userEmail);
        }
        if (updates.onboardingCompleted !== undefined) {
            fields.push('onboardingCompleted = ?');
            values.push(updates.onboardingCompleted ? 1 : 0);
        }
        if (updates.syncEnabled !== undefined) {
            fields.push('syncEnabled = ?');
            values.push(updates.syncEnabled ? 1 : 0);
        }
        if (updates.lastSyncAt !== undefined) {
            fields.push('lastSyncAt = ?');
            values.push(updates.lastSyncAt);
        }

        if (fields.length === 0) return;

        fields.push('updatedAt = ?');
        values.push(new Date().toISOString());
        values.push('default_settings');

        await this.db.runAsync(
            `
      UPDATE user_settings SET ${fields.join(', ')} WHERE id = ?
    `,
            values,
        );
    }

    // ===== SYNC OPERATIONS =====

    /**
     * Log a change to the sync log for tracking
     */
    private async logSyncChange(
        tableName: string,
        recordId: string,
        operation: 'create' | 'update' | 'delete',
    ): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const syncLogId = generateUUID();
        const timestamp = new Date().toISOString();

        await this.db.runAsync(
            `
      INSERT INTO sync_log (id, tableName, recordId, operation, timestamp, synced)
      VALUES (?, ?, ?, ?, ?, 0)
    `,
            [syncLogId, tableName, recordId, operation, timestamp],
        );
    }

    async getUnsyncedChanges(): Promise<SyncLog[]> {
        if (!this.db) throw new Error('Database not initialized');

        const result = await this.db.getAllAsync(`
      SELECT * FROM sync_log WHERE synced = 0 ORDER BY timestamp ASC
    `);

        return result as SyncLog[];
    }

    async markAsSynced(syncLogId: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        await this.db.runAsync(
            `
      UPDATE sync_log SET synced = 1 WHERE id = ?
    `,
            [syncLogId],
        );
    }

    async markSyncError(syncLogId: string, error: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        await this.db.runAsync(
            `
      UPDATE sync_log SET error = ? WHERE id = ?
    `,
            [error, syncLogId],
        );
    }

    // ===== EXPORT/IMPORT =====

    async exportData(): Promise<{
        todos: Todo[];
        sessions: Session[];
        settings: UserSettings | null;
        exportDate: string;
    }> {
        const todos = await this.getTodos();
        const sessions = await this.getSessions();
        const settings = await this.getSettings();

        return {
            todos,
            sessions,
            settings,
            exportDate: new Date().toISOString(),
        };
    }

    async importData(data: {
        todos?: Todo[];
        sessions?: Session[];
        settings?: Partial<UserSettings>;
    }): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        await this.db.withTransactionAsync(async () => {
            // Import todos
            if (data.todos) {
                for (const todo of data.todos) {
                    await this.db!.runAsync(
                        `
            INSERT OR REPLACE INTO todos (
              id, title, description, icon, isCompleted, createdAt, 
              completedAt, category, priority, estimatedMinutes, actualMinutes,
              reminderAt, subtasks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
                        [
                            todo.id,
                            todo.title,
                            todo.description || null,
                            todo.icon || null,
                            todo.isCompleted ? 1 : 0,
                            todo.createdAt,
                            todo.completedAt || null,
                            todo.category || null,
                            todo.priority || 0,
                            todo.estimatedMinutes || null,
                            todo.actualMinutes || 0,
                            (todo as any).reminderAt || null,
                            JSON.stringify((todo as any).subtasks || []),
                        ],
                    );
                }
            }

            // Import sessions
            if (data.sessions) {
                for (const session of data.sessions) {
                    await this.db!.runAsync(
                        `
            INSERT OR REPLACE INTO sessions (
              id, todoId, todoTitle, startTime, endTime, duration, 
              type, sessionNumber, isCompleted, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
                        [
                            session.id,
                            session.todoId || null,
                            session.todoTitle || null,
                            session.startTime,
                            session.endTime || null,
                            session.duration,
                            session.type,
                            session.sessionNumber || null,
                            session.isCompleted ? 1 : 0,
                            session.notes || null,
                        ],
                    );
                }
            }

            // Import settings
            if (data.settings) {
                await this.updateSettings(data.settings);
            }
        });
    }

    // ===== UTILITY =====

    async clearAllData(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        await this.db.withTransactionAsync(async () => {
            await this.db!.runAsync('DELETE FROM todos');
            await this.db!.runAsync('DELETE FROM sessions');
            await this.db!.runAsync('DELETE FROM sync_log');
        });
    }

    async close(): Promise<void> {
        if (this.db) {
            await this.db.closeAsync();
            this.db = null;
            this.isInitialized = false;
        }
    }
}

// Export singleton instance
export const localDatabaseService = new LocalDatabaseService();
