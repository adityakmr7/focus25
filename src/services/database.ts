import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// Database interface
export interface DatabaseService {
  initializeDatabase(): Promise<void>;
  
  // Goals operations
  saveGoal(goal: any): Promise<void>;
  getGoals(): Promise<any[]>;
  updateGoal(id: string, updates: any): Promise<void>;
  deleteGoal(id: string): Promise<void>;
  
  // Statistics operations
  saveStatistics(stats: any): Promise<void>;
  getStatistics(date?: string): Promise<any>;
  getStatisticsRange(startDate: string, endDate: string): Promise<any[]>;
  
  // Flow metrics operations
  saveFlowMetrics(metrics: any): Promise<void>;
  getFlowMetrics(): Promise<any>;
  
  // Settings operations
  saveSettings(settings: any): Promise<void>;
  getSettings(): Promise<any>;
  
  // Theme operations
  saveTheme(theme: any): Promise<void>;
  getTheme(): Promise<any>;
  
  // Export operations
  exportAllData(): Promise<string>;
  clearAllData(): Promise<void>;
}

class SQLiteService implements DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initializeDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('flowfocus.db');
      await this.createTables();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createTablesSQL = `
      -- Goals table
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        type TEXT NOT NULL,
        target INTEGER NOT NULL,
        current INTEGER DEFAULT 0,
        unit TEXT NOT NULL,
        is_completed BOOLEAN DEFAULT 0,
        created_at TEXT NOT NULL,
        completed_at TEXT,
        deadline TEXT,
        reward TEXT
      );

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
        custom_themes TEXT DEFAULT '{}',
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

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_statistics_date ON statistics(date);
      CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
      CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
      CREATE INDEX IF NOT EXISTS idx_goals_type ON goals(type);
    `;

    await this.db.execAsync(createTablesSQL);
  }

  // Goals operations
  async saveGoal(goal: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      INSERT OR REPLACE INTO goals 
      (id, title, description, category, type, target, current, unit, is_completed, created_at, completed_at, deadline, reward)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.runAsync(sql, [
      goal.id,
      goal.title,
      goal.description || '',
      goal.category,
      goal.type,
      goal.target,
      goal.current || 0,
      goal.unit,
      goal.isCompleted ? 1 : 0,
      goal.createdAt,
      goal.completedAt || null,
      goal.deadline || null,
      goal.reward || null
    ]);
  }

  async getGoals(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync('SELECT * FROM goals ORDER BY created_at DESC');
    
    return result.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      type: row.type,
      target: row.target,
      current: row.current,
      unit: row.unit,
      isCompleted: Boolean(row.is_completed),
      createdAt: row.created_at,
      completedAt: row.completed_at,
      deadline: row.deadline,
      reward: row.reward
    }));
  }

  async updateGoal(id: string, updates: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const setClause = Object.keys(updates).map(key => {
      const dbKey = key === 'isCompleted' ? 'is_completed' : 
                   key === 'createdAt' ? 'created_at' :
                   key === 'completedAt' ? 'completed_at' : key;
      return `${dbKey} = ?`;
    }).join(', ');

    const values = Object.values(updates).map(value => 
      typeof value === 'boolean' ? (value ? 1 : 0) : value
    );

    const sql = `UPDATE goals SET ${setClause} WHERE id = ?`;
    await this.db.runAsync(sql, [...values, id]);
  }

  async deleteGoal(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM goals WHERE id = ?', [id]);
  }

  // Statistics operations
  async saveStatistics(stats: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const sql = `
      INSERT OR REPLACE INTO statistics 
      (id, date, total_flows, started_flows, completed_flows, total_focus_time, total_breaks, total_break_time, interruptions, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.runAsync(sql, [
      stats.date || new Date().toISOString().split('T')[0],
      stats.date || new Date().toISOString().split('T')[0],
      stats.totalCount || 0,
      stats.flows?.started || 0,
      stats.flows?.completed || 0,
      stats.flows?.minutes || 0,
      stats.breaks?.completed || 0,
      stats.breaks?.minutes || 0,
      stats.interruptions || 0,
      now,
      now
    ]);
  }

  async getStatistics(date?: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const targetDate = date || new Date().toISOString().split('T')[0];
    const result = await this.db.getFirstAsync('SELECT * FROM statistics WHERE date = ?', [targetDate]);

    if (!result) {
      return {
        totalCount: 0,
        flows: { started: 0, completed: 0, minutes: 0 },
        breaks: { started: 0, completed: 0, minutes: 0 },
        interruptions: 0
      };
    }

    return {
      totalCount: result.total_flows,
      flows: {
        started: result.started_flows,
        completed: result.completed_flows,
        minutes: result.total_focus_time
      },
      breaks: {
        started: result.total_breaks,
        completed: result.total_breaks,
        minutes: result.total_break_time
      },
      interruptions: result.interruptions
    };
  }

  async getStatisticsRange(startDate: string, endDate: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM statistics WHERE date BETWEEN ? AND ? ORDER BY date',
      [startDate, endDate]
    );

    return result.map((row: any) => ({
      date: row.date,
      totalCount: row.total_flows,
      flows: {
        started: row.started_flows,
        completed: row.completed_flows,
        minutes: row.total_focus_time
      },
      breaks: {
        started: row.total_breaks,
        completed: row.total_breaks,
        minutes: row.total_break_time
      },
      interruptions: row.interruptions
    }));
  }

  // Flow metrics operations
  async saveFlowMetrics(metrics: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const sql = `
      INSERT OR REPLACE INTO flow_metrics 
      (id, consecutive_sessions, current_streak, longest_streak, flow_intensity, distraction_count, 
       session_start_time, total_focus_time, average_session_length, best_flow_duration, 
       last_session_date, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.runAsync(sql, [
      metrics.consecutiveSessions || 0,
      metrics.currentStreak || 0,
      metrics.longestStreak || 0,
      metrics.flowIntensity || 'medium',
      metrics.distractionCount || 0,
      metrics.sessionStartTime || null,
      metrics.totalFocusTime || 0,
      metrics.averageSessionLength || 25.0,
      metrics.bestFlowDuration || 0,
      metrics.lastSessionDate || null,
      now
    ]);
  }

  async getFlowMetrics(): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync('SELECT * FROM flow_metrics WHERE id = 1');

    if (!result) {
      return {
        consecutiveSessions: 0,
        currentStreak: 0,
        longestStreak: 0,
        flowIntensity: 'medium',
        distractionCount: 0,
        sessionStartTime: null,
        totalFocusTime: 0,
        averageSessionLength: 25.0,
        bestFlowDuration: 0,
        lastSessionDate: null
      };
    }

    return {
      consecutiveSessions: result.consecutive_sessions,
      currentStreak: result.current_streak,
      longestStreak: result.longest_streak,
      flowIntensity: result.flow_intensity,
      distractionCount: result.distraction_count,
      sessionStartTime: result.session_start_time,
      totalFocusTime: result.total_focus_time,
      averageSessionLength: result.average_session_length,
      bestFlowDuration: result.best_flow_duration,
      lastSessionDate: result.last_session_date
    };
  }

  // Settings operations
  async saveSettings(settings: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const sql = `
      INSERT OR REPLACE INTO settings 
      (id, time_duration, break_duration, sound_effects, notifications, dark_mode, auto_break, 
       focus_reminders, weekly_reports, data_sync, notification_status, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.runAsync(sql, [
      settings.timeDuration || 25,
      settings.breakDuration || 5,
      settings.soundEffects ? 1 : 0,
      settings.notifications ? 1 : 0,
      settings.darkMode ? 1 : 0,
      settings.autoBreak ? 1 : 0,
      settings.focusReminders ? 1 : 0,
      settings.weeklyReports ? 1 : 0,
      settings.dataSync ? 1 : 0,
      settings.notificationStatus || null,
      now
    ]);
  }

  async getSettings(): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync('SELECT * FROM settings WHERE id = 1');

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
        notificationStatus: null
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
      notificationStatus: result.notification_status
    };
  }

  // Theme operations
  async saveTheme(theme: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const sql = `
      INSERT OR REPLACE INTO theme 
      (id, mode, accent_color, timer_style, custom_themes, active_custom_theme, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.runAsync(sql, [
      theme.mode || 'auto',
      theme.accentColor || 'green',
      theme.timerStyle || 'digital',
      JSON.stringify(theme.customThemes || {}),
      theme.activeCustomTheme || null,
      now
    ]);
  }

  async getTheme(): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync('SELECT * FROM theme WHERE id = 1');

    if (!result) {
      return {
        mode: 'auto',
        accentColor: 'green',
        timerStyle: 'digital',
        customThemes: {},
        activeCustomTheme: null
      };
    }

    return {
      mode: result.mode,
      accentColor: result.accent_color,
      timerStyle: result.timer_style,
      customThemes: JSON.parse(result.custom_themes || '{}'),
      activeCustomTheme: result.active_custom_theme
    };
  }

  // Export operations
  async exportAllData(): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const [goals, statistics, flowMetrics, settings, theme] = await Promise.all([
      this.getGoals(),
      this.db.getAllAsync('SELECT * FROM statistics ORDER BY date'),
      this.getFlowMetrics(),
      this.getSettings(),
      this.getTheme()
    ]);

    const exportData = {
      goals,
      statistics,
      flowMetrics,
      settings,
      theme,
      exportedAt: new Date().toISOString(),
      version: '1.0'
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
class WebStorageService implements DatabaseService {
  private storageKey = 'flowfocus_data';

  async initializeDatabase(): Promise<void> {
    // No initialization needed for localStorage
  }

  private getData(): any {
    if (typeof window === 'undefined') return {};
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : {
      goals: [],
      statistics: {},
      flowMetrics: {},
      settings: {},
      theme: {}
    };
  }

  private saveData(data: any): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  async saveGoal(goal: any): Promise<void> {
    const data = this.getData();
    const existingIndex = data.goals.findIndex((g: any) => g.id === goal.id);
    
    if (existingIndex >= 0) {
      data.goals[existingIndex] = goal;
    } else {
      data.goals.push(goal);
    }
    
    this.saveData(data);
  }

  async getGoals(): Promise<any[]> {
    const data = this.getData();
    return data.goals || [];
  }

  async updateGoal(id: string, updates: any): Promise<void> {
    const data = this.getData();
    const goalIndex = data.goals.findIndex((g: any) => g.id === id);
    
    if (goalIndex >= 0) {
      data.goals[goalIndex] = { ...data.goals[goalIndex], ...updates };
      this.saveData(data);
    }
  }

  async deleteGoal(id: string): Promise<void> {
    const data = this.getData();
    data.goals = data.goals.filter((g: any) => g.id !== id);
    this.saveData(data);
  }

  async saveStatistics(stats: any): Promise<void> {
    const data = this.getData();
    const date = stats.date || new Date().toISOString().split('T')[0];
    data.statistics[date] = stats;
    this.saveData(data);
  }

  async getStatistics(date?: string): Promise<any> {
    const data = this.getData();
    const targetDate = date || new Date().toISOString().split('T')[0];
    return data.statistics[targetDate] || {
      totalCount: 0,
      flows: { started: 0, completed: 0, minutes: 0 },
      breaks: { started: 0, completed: 0, minutes: 0 },
      interruptions: 0
    };
  }

  async getStatisticsRange(startDate: string, endDate: string): Promise<any[]> {
    const data = this.getData();
    const result = [];
    
    for (const [date, stats] of Object.entries(data.statistics)) {
      if (date >= startDate && date <= endDate) {
        result.push({ date, ...stats });
      }
    }
    
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  async saveFlowMetrics(metrics: any): Promise<void> {
    const data = this.getData();
    data.flowMetrics = metrics;
    this.saveData(data);
  }

  async getFlowMetrics(): Promise<any> {
    const data = this.getData();
    return data.flowMetrics || {
      consecutiveSessions: 0,
      currentStreak: 0,
      longestStreak: 0,
      flowIntensity: 'medium',
      distractionCount: 0,
      sessionStartTime: null,
      totalFocusTime: 0,
      averageSessionLength: 25.0,
      bestFlowDuration: 0,
      lastSessionDate: null
    };
  }

  async saveSettings(settings: any): Promise<void> {
    const data = this.getData();
    data.settings = settings;
    this.saveData(data);
  }

  async getSettings(): Promise<any> {
    const data = this.getData();
    return data.settings || {
      timeDuration: 25,
      breakDuration: 5,
      soundEffects: true,
      notifications: true,
      darkMode: false,
      autoBreak: false,
      focusReminders: true,
      weeklyReports: true,
      dataSync: true,
      notificationStatus: null
    };
  }

  async saveTheme(theme: any): Promise<void> {
    const data = this.getData();
    data.theme = theme;
    this.saveData(data);
  }

  async getTheme(): Promise<any> {
    const data = this.getData();
    return data.theme || {
      mode: 'auto',
      accentColor: 'green',
      timerStyle: 'digital',
      customThemes: {},
      activeCustomTheme: null
    };
  }

  async exportAllData(): Promise<string> {
    const data = this.getData();
    return JSON.stringify({
      ...data,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  }

  async clearAllData(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }
}

// Create singleton instance
export const databaseService: DatabaseService = Platform.OS === 'web' 
  ? new WebStorageService() 
  : new SQLiteService();

// Initialize database
export const initializeDatabase = async () => {
  try {
    await databaseService.initializeDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};