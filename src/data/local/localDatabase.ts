import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import {
    AccentColor,
    ExportData,
    FlowIntensity,
    FlowMetrics,
    FlowMetricsRow,
    NotificationStatus,
    Session,
    SessionRow,
    SessionType,
    Settings,
    SettingsRow,
    Statistics,
    StatisticsRow,
    Theme,
    ThemeMode,
    ThemeRow,
    TimerStyle,
    Todo,
    TodoRow,
} from '../../types/database';

// Database interface
export interface LocalDataBase {
    initializeDatabase(): Promise<void>;

    // Statistics operations
    saveStatistics(stats: Statistics): Promise<void>;
    getStatistics(date?: string): Promise<Statistics>;
    getStatisticsRange(startDate: string, endDate: string): Promise<Statistics[]>;

    // Flow metrics operations
    saveFlowMetrics(metrics: FlowMetrics): Promise<void>;
    getFlowMetrics(): Promise<FlowMetrics>;

    // Settings operations
    saveSettings(settings: Settings): Promise<void>;
    getSettings(): Promise<Settings>;

    // Theme operations
    saveTheme(theme: Theme): Promise<void>;
    getTheme(): Promise<Theme>;

    // Session operations
    saveSession(session: Session): Promise<void>;
    getSessions(startDate?: string, endDate?: string): Promise<Session[]>;
    getSessionById(id: string): Promise<Session | null>;
    updateSession(id: string, updates: Partial<Session>): Promise<void>;
    deleteSession(id: string): Promise<void>;

    // Todo operations
    initializeTodos(): Promise<void>;
    saveTodo(todo: Todo): Promise<void>;
    getTodos(): Promise<Todo[]>;
    updateTodo(id: string, updates: Partial<Todo>): Promise<void>;
    deleteTodo(id: string): Promise<void>;

    // Export operations
    exportAllData(): Promise<string>;
    clearAllData(): Promise<void>;
}

class SQLiteService implements LocalDataBase {
    private db: SQLite.SQLiteDatabase | null = null;
    private isInitializing = false;
    private initializationPromise: Promise<void> | null = null;

    async initializeDatabase(): Promise<void> {
        // If already initializing, wait for that to complete
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        // If already initialized, return immediately
        if (this.db && !this.isInitializing) {
            return Promise.resolve();
        }

        // Create new initialization promise
        this.initializationPromise = this.performInitialization();
        return this.initializationPromise;
    }

    private async performInitialization(): Promise<void> {
        if (this.isInitializing || this.db) {
            return;
        }

        this.isInitializing = true;
        try {
            console.log('Initializing SQLite database...');
            this.db = await SQLite.openDatabaseAsync('flowfocus.db');

            if (!this.db) {
                throw new Error('Failed to open database - null reference');
            }

            await this.createTables();
            console.log('SQLite database initialized successfully');
        } catch (error) {
            console.error('Failed to initialize database:', error);
            this.db = null;
            throw error;
        } finally {
            this.isInitializing = false;
        }
    }

    private async ensureInitialized(): Promise<void> {
        if (!this.db) {
            await this.initializeDatabase();
        }
        if (!this.db) {
            throw new Error('Database failed to initialize');
        }
    }

    private async createTables(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const createTablesSQL = `
      -- Statistics table
      CREATE TABLE IF NOT EXISTS statistics (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL UNIQUE,
        total_flows INTEGER DEFAULT 0,
        started_flows INTEGER DEFAULT 0,
        completed_flows INTEGER DEFAULT 0,
        total_focus_time INTEGER DEFAULT 0,
        total_breaks INTEGER DEFAULT 0,
        total_break_time INTEGER DEFAULT 0,
        interruptions INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- Flow metrics table
      CREATE TABLE IF NOT EXISTS flow_metrics (
        id INTEGER PRIMARY KEY,
        consecutive_sessions INTEGER DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        flow_intensity TEXT DEFAULT 'medium',
        distraction_count INTEGER DEFAULT 0,
        session_start_time INTEGER,
        total_focus_time INTEGER DEFAULT 0,
        average_session_length REAL DEFAULT 25.0,
        best_flow_duration REAL DEFAULT 0,
        last_session_date TEXT,
        updated_at TEXT NOT NULL
      );

      -- Settings table
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        time_duration INTEGER DEFAULT 25,
        break_duration INTEGER DEFAULT 5,
        sound_effects BOOLEAN DEFAULT 1,
        notifications BOOLEAN DEFAULT 1,
        dark_mode BOOLEAN DEFAULT 0,
        auto_break BOOLEAN DEFAULT 0,
        focus_reminders BOOLEAN DEFAULT 1,
        weekly_reports BOOLEAN DEFAULT 1,
        data_sync BOOLEAN DEFAULT 1,
        notification_status TEXT,
        updated_at TEXT NOT NULL
      );

      -- Theme table
      CREATE TABLE IF NOT EXISTS theme (
        id INTEGER PRIMARY KEY,
        mode TEXT DEFAULT 'auto',
        accent_color TEXT DEFAULT 'green',
        timer_style TEXT DEFAULT 'digital',
        active_custom_theme TEXT,
        updated_at TEXT NOT NULL
      );

      -- Sessions table for detailed tracking
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        duration INTEGER NOT NULL,
        completed BOOLEAN DEFAULT 0,
        start_time TEXT NOT NULL,
        end_time TEXT,
        distractions INTEGER DEFAULT 0,
        notes TEXT,
        created_at TEXT NOT NULL
      );

      -- Todos table
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        is_completed BOOLEAN DEFAULT 0,
        priority TEXT DEFAULT 'medium',
        category TEXT DEFAULT 'personal',
        due_date TEXT,
        created_at TEXT NOT NULL,
        completed_at TEXT,
        tags TEXT,
        notes TEXT
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_statistics_date ON statistics(date);
      CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
      CREATE INDEX IF NOT EXISTS idx_sessions_type ON sessions(type);
      CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(is_completed);
      CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
      CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);
      CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);
      CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
    `;

        await this.db.execAsync(createTablesSQL);
    }

    // Helper method to map SessionRow to Session
    private mapSessionRowToSession(row: SessionRow): Session {
        return {
            id: row.id,
            type: row.type as SessionType,
            duration: row.duration,
            completed: Boolean(row.completed),
            startTime: row.start_time,
            endTime: row.end_time || undefined,
            distractions: row.distractions,
            notes: row.notes || undefined,
            createdAt: row.created_at,
        };
    }

    // Helper method to map TodoRow to Todo
    private mapTodoRowToTodo(row: TodoRow): Todo {
        return {
            id: row.id,
            title: row.title,
            isCompleted: Boolean(row.is_completed),
            createdAt: row.created_at,
            completedAt: row.completed_at || undefined,
        };
    }

    // Statistics operations
    async saveStatistics(stats: Statistics): Promise<void> {
        await this.ensureInitialized();

        const now = new Date().toISOString();
        const sql = `
            INSERT OR REPLACE INTO statistics 
      (id, date, total_flows, started_flows, completed_flows, total_focus_time, total_breaks, total_break_time, interruptions, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await this.db!.runAsync(sql, [
            stats.date,
            stats.date,
            stats.totalCount,
            stats.flows.started,
            stats.flows.completed,
            stats.flows.minutes,
            stats.breaks.started,
            stats.breaks.completed,
            stats.breaks.minutes,
            stats.interruptions,
            now,
            now,
        ]);
    }

    async getStatistics(date?: string): Promise<Statistics> {
        await this.ensureInitialized();

        const targetDate = date || new Date().toISOString().split('T')[0];

        try {
            const result = (await this.db!.getFirstAsync(
                'SELECT * FROM statistics WHERE date = ?',
                [targetDate],
            )) as StatisticsRow | null;

            if (!result) {
                return {
                    date: targetDate,
                    totalCount: 0,
                    flows: { started: 0, completed: 0, minutes: 0 },
                    breaks: { started: 0, completed: 0, minutes: 0 },
                    interruptions: 0,
                };
            }

            return {
                date: result.date,
                totalCount: result.total_flows,
                flows: {
                    started: result.started_flows,
                    completed: result.completed_flows,
                    minutes: result.total_focus_time,
                },
                breaks: {
                    started: result.total_breaks,
                    completed: result.total_breaks,
                    minutes: result.total_break_time,
                },
                interruptions: result.interruptions,
            };
        } catch (error) {
            console.error('Failed to get statistics:', error);
            // Return default statistics on error
            return {
                date: targetDate,
                totalCount: 0,
                flows: { started: 0, completed: 0, minutes: 0 },
                breaks: { started: 0, completed: 0, minutes: 0 },
                interruptions: 0,
            };
        }
    }

    async getStatisticsRange(startDate: string, endDate: string): Promise<Statistics[]> {
        await this.ensureInitialized();

        const result = (await this.db!.getAllAsync(
            'SELECT * FROM statistics WHERE date BETWEEN ? AND ? ORDER BY date',
            [startDate, endDate],
        )) as StatisticsRow[];

        return result.map((row) => ({
            date: row.date,
            totalCount: row.total_flows,
            flows: {
                started: row.started_flows,
                completed: row.completed_flows,
                minutes: row.total_focus_time,
            },
            breaks: {
                started: row.total_breaks,
                completed: row.total_breaks,
                minutes: row.total_break_time,
            },
            interruptions: row.interruptions,
        }));
    }

    // Flow metrics operations
    async saveFlowMetrics(metrics: FlowMetrics): Promise<void> {
        await this.ensureInitialized();

        const now = new Date().toISOString();
        const sql = `
            INSERT OR REPLACE INTO flow_metrics 
      (id, consecutive_sessions, current_streak, longest_streak, flow_intensity, distraction_count, 
      session_start_time, total_focus_time, average_session_length, best_flow_duration, 
      last_session_date, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await this.db!.runAsync(sql, [
            metrics.consecutiveSessions,
            metrics.currentStreak,
            metrics.longestStreak,
            metrics.flowIntensity,
            metrics.distractionCount,
            metrics.sessionStartTime || null,
            metrics.totalFocusTime,
            metrics.averageSessionLength,
            metrics.bestFlowDuration,
            metrics.lastSessionDate || null,
            now,
        ]);
    }

    async getFlowMetrics(): Promise<FlowMetrics> {
        await this.ensureInitialized();

        try {
            const result = (await this.db!.getFirstAsync(
                'SELECT * FROM flow_metrics WHERE id = 1',
            )) as FlowMetricsRow | null;

            if (!result) {
                return {
                    consecutiveSessions: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                    flowIntensity: FlowIntensity.MEDIUM,
                    distractionCount: 0,
                    sessionStartTime: undefined,
                    totalFocusTime: 0,
                    averageSessionLength: 25.0,
                    bestFlowDuration: 0,
                    lastSessionDate: undefined,
                };
            }

            return {
                consecutiveSessions: result.consecutive_sessions,
                currentStreak: result.current_streak,
                longestStreak: result.longest_streak,
                flowIntensity: result.flow_intensity as FlowIntensity,
                distractionCount: result.distraction_count,
                sessionStartTime: result.session_start_time || undefined,
                totalFocusTime: result.total_focus_time,
                averageSessionLength: result.average_session_length,
                bestFlowDuration: result.best_flow_duration,
                lastSessionDate: result.last_session_date || undefined,
            };
        } catch (error) {
            console.error('Failed to get flow metrics:', error);
            // Return default flow metrics on error
            return {
                consecutiveSessions: 0,
                currentStreak: 0,
                longestStreak: 0,
                flowIntensity: FlowIntensity.MEDIUM,
                distractionCount: 0,
                sessionStartTime: undefined,
                totalFocusTime: 0,
                averageSessionLength: 25.0,
                bestFlowDuration: 0,
                lastSessionDate: undefined,
            };
        }
    }

    // Settings operations
    async saveSettings(settings: Settings): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const now = new Date().toISOString();
        const sql = `
            INSERT OR REPLACE INTO settings 
      (id, time_duration, break_duration, sound_effects, notifications, dark_mode, auto_break, 
       focus_reminders, weekly_reports, data_sync, notification_status, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await this.db.runAsync(sql, [
            settings.timeDuration,
            settings.breakDuration,
            settings.soundEffects ? 1 : 0,
            settings.notifications ? 1 : 0,
            settings.darkMode ? 1 : 0,
            settings.autoBreak ? 1 : 0,
            settings.focusReminders ? 1 : 0,
            settings.weeklyReports ? 1 : 0,
            settings.dataSync ? 1 : 0,
            settings.notificationStatus || null,
            now,
        ]);
    }

    async getSettings(): Promise<Settings> {
        if (!this.db) throw new Error('Database not initialized');

        const result = (await this.db.getFirstAsync(
            'SELECT * FROM settings WHERE id = 1',
        )) as SettingsRow | null;

        if (!result) {
            return {
                timeDuration: 25,
                breakDuration: 5,
                soundEffects: true,
                notifications: true,
                darkMode: false,
                autoBreak: false,
                focusReminders: true,
                weeklyReports: true,
                dataSync: true,
                notificationStatus: undefined,
            };
        }

        return {
            timeDuration: result.time_duration,
            breakDuration: result.break_duration,
            soundEffects: Boolean(result.sound_effects),
            notifications: Boolean(result.notifications),
            darkMode: Boolean(result.dark_mode),
            autoBreak: Boolean(result.auto_break),
            focusReminders: Boolean(result.focus_reminders),
            weeklyReports: Boolean(result.weekly_reports),
            dataSync: Boolean(result.data_sync),
            notificationStatus: (result.notification_status as NotificationStatus) || undefined,
        };
    }

    // Theme operations
    async saveTheme(theme: Theme): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const now = new Date().toISOString();
        const sql = `
            INSERT OR REPLACE INTO theme 
      (id, mode, accent_color, timer_style, custom_themes, active_custom_theme, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?)
        `;

        await this.db.runAsync(sql, [
            theme.mode,
            theme.accentColor,
            theme.timerStyle,
            theme.activeCustomTheme || null,
            now,
        ]);
    }

    async getTheme(): Promise<Theme> {
        if (!this.db) throw new Error('Database not initialized');

        const result = (await this.db.getFirstAsync(
            'SELECT * FROM theme WHERE id = 1',
        )) as ThemeRow | null;

        if (!result) {
            return {
                mode: ThemeMode.AUTO,
                accentColor: AccentColor.SAGE,
                timerStyle: TimerStyle.DIGITAL,
                activeCustomTheme: undefined,
            };
        }

        return {
            mode: result.mode as ThemeMode,
            accentColor: result.accent_color as AccentColor,
            timerStyle: result.timer_style as TimerStyle,
        };
    }

    // Session operations
    async saveSession(session: Session): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const sql = `
            INSERT OR REPLACE INTO sessions 
      (id, type, duration, completed, start_time, end_time, distractions, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await this.db.runAsync(sql, [
            session.id,
            session.type,
            session.duration,
            session.completed ? 1 : 0,
            session.startTime,
            session.endTime || null,
            session.distractions,
            session.notes || null,
            session.createdAt,
        ]);
    }

    async getSessions(startDate?: string, endDate?: string): Promise<Session[]> {
        if (!this.db) throw new Error('Database not initialized');

        let sql = 'SELECT * FROM sessions';
        let params: string[] = [];

        if (startDate && endDate) {
            sql += ' WHERE start_time BETWEEN ? AND ? ORDER BY start_time DESC';
            params = [startDate, endDate];
        } else {
            sql += ' ORDER BY start_time DESC';
        }

        const result = (await this.db.getAllAsync(sql, params)) as SessionRow[];
        return result.map((row) => this.mapSessionRowToSession(row));
    }

    async getSessionById(id: string): Promise<Session | null> {
        if (!this.db) throw new Error('Database not initialized');

        const result = (await this.db.getFirstAsync('SELECT * FROM sessions WHERE id = ?', [
            id,
        ])) as SessionRow | null;
        return result ? this.mapSessionRowToSession(result) : null;
    }

    async updateSession(id: string, updates: Partial<Session>): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const setClause = Object.keys(updates)
            .map((key) => {
                const dbKey =
                    key === 'startTime'
                        ? 'start_time'
                        : key === 'endTime'
                          ? 'end_time'
                          : key === 'createdAt'
                            ? 'created_at'
                            : key;
                return `${dbKey} = ?`;
            })
            .join(', ');

        const values = Object.values(updates).map((value) =>
            typeof value === 'boolean' ? (value ? 1 : 0) : value,
        );

        const sql = `UPDATE sessions SET ${setClause} WHERE id = ?`;
        await this.db.runAsync(sql, [...values, id]);
    }

    async deleteSession(id: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        await this.db.runAsync('DELETE FROM sessions WHERE id = ?', [id]);
    }

    // Todo operations
    async initializeTodos(): Promise<void> {
        await this.ensureInitialized();
    }

    async saveTodo(todo: Todo): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const sql = `
            INSERT OR REPLACE INTO todos 
            (id, title, description, is_completed, priority, category, due_date, created_at, completed_at, tags, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await this.db.runAsync(sql, [
            todo.id,
            todo.title,
            todo.isCompleted ? 1 : 0,
            todo.createdAt,
            todo.completedAt || null,
        ]);
    }

    async getTodos(): Promise<Todo[]> {
        if (!this.db) throw new Error('Database not initialized');

        const result = (await this.db.getAllAsync(
            'SELECT * FROM todos ORDER BY created_at DESC',
        )) as TodoRow[];
        return result.map((row) => this.mapTodoRowToTodo(row));
    }

    async updateTodo(id: string, updates: Partial<Todo>): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const setClause = Object.keys(updates)
            .map((key) => {
                const dbKey =
                    key === 'isCompleted'
                        ? 'is_completed'
                        : key === 'createdAt'
                          ? 'created_at'
                          : key === 'completedAt'
                            ? 'completed_at'
                            : key === 'dueDate'
                              ? 'due_date'
                              : key;
                return `${dbKey} = ?`;
            })
            .join(', ');

        const values = Object.entries(updates).map(([key, value]) => {
            if (typeof value === 'boolean') return value ? 1 : 0;
            if (key === 'tags' && Array.isArray(value)) return value.join(',');
            return value;
        });

        const sql = `UPDATE todos SET ${setClause} WHERE id = ?`;
        await this.db.runAsync(sql, [...values, id]);
    }

    async deleteTodo(id: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        await this.db.runAsync('DELETE FROM todos WHERE id = ?', [id]);
    }

    // Export operations
    async exportAllData(): Promise<string> {
        if (!this.db) throw new Error('Database not initialized');

        const [statistics, flowMetrics, settings, theme, sessions] = await Promise.all([
            this.db.getAllAsync('SELECT * FROM statistics ORDER BY date') as Promise<
                StatisticsRow[]
            >,
            this.getFlowMetrics(),
            this.getSettings(),
            this.getTheme(),
            this.getSessions(),
        ]);

        const mappedStatistics = statistics.map((row) => ({
            date: row.date,
            totalCount: row.total_flows,
            flows: {
                started: row.started_flows,
                completed: row.completed_flows,
                minutes: row.total_focus_time,
            },
            breaks: {
                started: row.total_breaks,
                completed: row.total_breaks,
                minutes: row.total_break_time,
            },
            interruptions: row.interruptions,
        }));

        const exportData: ExportData = {
            statistics: mappedStatistics,
            flowMetrics,
            settings,
            theme,
            sessions,
            exportedAt: new Date().toISOString(),
            version: '1.0',
        };

        return JSON.stringify(exportData, null, 2);
    }

    async clearAllData(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const tables = ['goals', 'statistics', 'flow_metrics', 'settings', 'theme', 'sessions'];

        for (const table of tables) {
            await this.db.runAsync(`DELETE FROM ${table}`);
        }
    }
}

// Web fallback using localStorage
class WebStorageService implements LocalDataBase {
    private storageKey = 'flowfocus_data';

    async initializeDatabase(): Promise<void> {
        // No initialization needed for localStorage
    }

    private getData(): any {
        if (typeof window === 'undefined') return this.getDefaultData();
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : this.getDefaultData();
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return this.getDefaultData();
        }
    }

    private getDefaultData() {
        return {
            goals: [],
            statistics: {},
            flowMetrics: {},
            settings: {},
            theme: {},
            sessions: [],
        };
    }

    private saveData(data: any): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    async saveStatistics(stats: Statistics): Promise<void> {
        const data = this.getData();
        data.statistics[stats.date] = stats;
        this.saveData(data);
    }

    async getStatistics(date?: string): Promise<Statistics> {
        const data = this.getData();
        const targetDate = date || new Date().toISOString().split('T')[0];
        return (
            data.statistics[targetDate] || {
                date: targetDate,
                totalCount: 0,
                flows: { started: 0, completed: 0, minutes: 0 },
                breaks: { started: 0, completed: 0, minutes: 0 },
                interruptions: 0,
            }
        );
    }

    async getStatisticsRange(startDate: string, endDate: string): Promise<Statistics[]> {
        const data = this.getData();
        const result: Statistics[] = [];

        for (const [date, stats] of Object.entries(data.statistics)) {
            if (date >= startDate && date <= endDate) {
                // @ts-ignore
                result.push({ date, ...stats } as Statistics);
            }
        }

        return result.sort((a, b) => a.date.localeCompare(b.date));
    }

    async saveFlowMetrics(metrics: FlowMetrics): Promise<void> {
        const data = this.getData();
        data.flowMetrics = metrics;
        this.saveData(data);
    }

    async getFlowMetrics(): Promise<FlowMetrics> {
        const data = this.getData();
        return (
            data.flowMetrics || {
                consecutiveSessions: 0,
                currentStreak: 0,
                longestStreak: 0,
                flowIntensity: FlowIntensity.MEDIUM,
                distractionCount: 0,
                sessionStartTime: undefined,
                totalFocusTime: 0,
                averageSessionLength: 25.0,
                bestFlowDuration: 0,
                lastSessionDate: undefined,
            }
        );
    }

    async saveSettings(settings: Settings): Promise<void> {
        const data = this.getData();
        data.settings = settings;
        this.saveData(data);
    }

    async getSettings(): Promise<Settings> {
        const data = this.getData();
        return (
            data.settings || {
                timeDuration: 25,
                breakDuration: 5,
                soundEffects: true,
                notifications: true,
                darkMode: false,
                autoBreak: false,
                focusReminders: true,
                weeklyReports: true,
                dataSync: true,
                notificationStatus: undefined,
            }
        );
    }

    async saveTheme(theme: Theme): Promise<void> {
        const data = this.getData();
        data.theme = theme;
        this.saveData(data);
    }

    async getTheme(): Promise<Theme> {
        const data = this.getData();
        return (
            data.theme || {
                mode: ThemeMode.AUTO,
                accentColor: AccentColor.SAGE,
                timerStyle: TimerStyle.DIGITAL,
                customThemes: {},
                activeCustomTheme: undefined,
            }
        );
    }

    async saveSession(session: Session): Promise<void> {
        const data = this.getData();
        if (!data.sessions) data.sessions = [];

        const existingIndex = data.sessions.findIndex((s: Session) => s.id === session.id);
        if (existingIndex >= 0) {
            data.sessions[existingIndex] = session;
        } else {
            data.sessions.push(session);
        }

        this.saveData(data);
    }

    async getSessions(startDate?: string, endDate?: string): Promise<Session[]> {
        const data = this.getData();
        let sessions = data.sessions || [];

        if (startDate && endDate) {
            sessions = sessions.filter((session: Session) => {
                return session.startTime >= startDate && session.startTime <= endDate;
            });
        }

        return sessions.sort(
            (a: Session, b: Session) =>
                new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
        );
    }

    async getSessionById(id: string): Promise<Session | null> {
        const data = this.getData();
        const sessions = data.sessions || [];
        return sessions.find((session: Session) => session.id === id) || null;
    }

    async updateSession(id: string, updates: Partial<Session>): Promise<void> {
        const data = this.getData();
        if (!data.sessions) data.sessions = [];

        const sessionIndex = data.sessions.findIndex((s: Session) => s.id === id);
        if (sessionIndex >= 0) {
            data.sessions[sessionIndex] = { ...data.sessions[sessionIndex], ...updates };
            this.saveData(data);
        }
    }

    async deleteSession(id: string): Promise<void> {
        const data = this.getData();
        if (data.sessions) {
            data.sessions = data.sessions.filter((s: Session) => s.id !== id);
            this.saveData(data);
        }
    }

    // Todo operations
    async initializeTodos(): Promise<void> {
        // No initialization needed for web storage
    }

    async saveTodo(todo: Todo): Promise<void> {
        const data = this.getData();
        if (!data.todos) data.todos = [];

        const existingIndex = data.todos.findIndex((t: Todo) => t.id === todo.id);
        if (existingIndex >= 0) {
            data.todos[existingIndex] = todo;
        } else {
            data.todos.push(todo);
        }

        this.saveData(data);
    }

    async getTodos(): Promise<Todo[]> {
        const data = this.getData();
        return data.todos || [];
    }

    async updateTodo(id: string, updates: Partial<Todo>): Promise<void> {
        const data = this.getData();
        if (!data.todos) data.todos = [];

        const todoIndex = data.todos.findIndex((t: Todo) => t.id === id);
        if (todoIndex >= 0) {
            data.todos[todoIndex] = { ...data.todos[todoIndex], ...updates };
            this.saveData(data);
        }
    }

    async deleteTodo(id: string): Promise<void> {
        const data = this.getData();
        if (data.todos) {
            data.todos = data.todos.filter((t: Todo) => t.id !== id);
            this.saveData(data);
        }
    }

    async exportAllData(): Promise<string> {
        const data = this.getData();
        const exportData: ExportData = {
            ...data,
            exportedAt: new Date().toISOString(),
            version: '1.0',
        };
        return JSON.stringify(exportData, null, 2);
    }

    async clearAllData(): Promise<void> {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(this.storageKey);
        }
    }
}

// Create the appropriate service based on platform
export const localDatabaseService: LocalDataBase =
    Platform.OS === 'web' ? new WebStorageService() : new SQLiteService();
