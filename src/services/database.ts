import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { db } from '../db';
import { 
  goals, 
  statistics, 
  flowMetrics, 
  settings, 
  theme, 
  sessions,
  type Goal,
  type NewGoal,
  type Statistic,
  type NewStatistic,
  type FlowMetric,
  type NewFlowMetric,
  type Setting,
  type NewSetting,
  type Theme,
  type NewTheme,
  type Session,
  type NewSession
} from '../db/schema';
import { Platform } from 'react-native';

// Database interface
export interface DatabaseService {
  initializeDatabase(): Promise<void>;
  
  // Goals operations
  saveGoal(goal: NewGoal): Promise<void>;
  getGoals(): Promise<Goal[]>;
  updateGoal(id: string, updates: Partial<Goal>): Promise<void>;
  deleteGoal(id: string): Promise<void>;
  
  // Statistics operations
  saveStatistics(stats: any): Promise<void>;
  getStatistics(date?: string): Promise<any>;
  getStatisticsRange(startDate: string, endDate: string): Promise<any[]>;
  
  // Flow metrics operations
  saveFlowMetrics(metrics: any): Promise<void>;
  getFlowMetrics(): Promise<any>;
  
  // Settings operations
  saveSettings(settingsData: any): Promise<void>;
  getSettings(): Promise<any>;
  
  // Theme operations
  saveTheme(themeData: any): Promise<void>;
  getTheme(): Promise<any>;
  
  // Export operations
  exportAllData(): Promise<string>;
  clearAllData(): Promise<void>;
}

class DrizzleService implements DatabaseService {
  async initializeDatabase(): Promise<void> {
    try {
      // Initialize default settings if they don't exist
      const existingSettings = await db.select().from(settings).limit(1);
      if (existingSettings.length === 0) {
        await db.insert(settings).values({
          id: 1,
          timeDuration: 25,
          breakDuration: 5,
          soundEffects: true,
          notifications: true,
          darkMode: false,
          autoBreak: false,
          focusReminders: true,
          weeklyReports: true,
          dataSync: true,
        });
      }

      // Initialize default flow metrics if they don't exist
      const existingMetrics = await db.select().from(flowMetrics).limit(1);
      if (existingMetrics.length === 0) {
        await db.insert(flowMetrics).values({
          id: 1,
          consecutiveSessions: 0,
          currentStreak: 0,
          longestStreak: 0,
          flowIntensity: 'medium',
          distractionCount: 0,
          totalFocusTime: 0,
          averageSessionLength: 25.0,
          bestFlowDuration: 0,
        });
      }

      // Initialize default theme if it doesn't exist
      const existingTheme = await db.select().from(theme).limit(1);
      if (existingTheme.length === 0) {
        await db.insert(theme).values({
          id: 1,
          mode: 'auto',
          accentColor: 'green',
          timerStyle: 'digital',
          customThemes: '{}',
        });
      }

      console.log('Drizzle database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Drizzle database:', error);
      throw error;
    }
  }

  // Goals operations
  async saveGoal(goal: NewGoal): Promise<void> {
    try {
      await db.insert(goals).values(goal).onConflictDoUpdate({
        target: goals.id,
        set: {
          title: goal.title,
          description: goal.description,
          category: goal.category,
          type: goal.type,
          target: goal.target,
          current: goal.current,
          unit: goal.unit,
          isCompleted: goal.isCompleted,
          completedAt: goal.completedAt,
          deadline: goal.deadline,
          reward: goal.reward,
        },
      });
    } catch (error) {
      console.error('Failed to save goal:', error);
      throw error;
    }
  }

  async getGoals(): Promise<Goal[]> {
    try {
      return await db.select().from(goals).orderBy(desc(goals.createdAt));
    } catch (error) {
      console.error('Failed to get goals:', error);
      throw error;
    }
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<void> {
    try {
      await db.update(goals).set(updates).where(eq(goals.id, id));
    } catch (error) {
      console.error('Failed to update goal:', error);
      throw error;
    }
  }

  async deleteGoal(id: string): Promise<void> {
    try {
      await db.delete(goals).where(eq(goals.id, id));
    } catch (error) {
      console.error('Failed to delete goal:', error);
      throw error;
    }
  }

  // Statistics operations
  async saveStatistics(stats: any): Promise<void> {
    try {
      const date = stats.date || new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();
      
      await db.insert(statistics).values({
        id: date,
        date,
        totalFlows: stats.totalCount || 0,
        startedFlows: stats.flows?.started || 0,
        completedFlows: stats.flows?.completed || 0,
        totalFocusTime: stats.flows?.minutes || 0,
        totalBreaks: stats.breaks?.completed || 0,
        totalBreakTime: stats.breaks?.minutes || 0,
        interruptions: stats.interruptions || 0,
        createdAt: now,
        updatedAt: now,
      }).onConflictDoUpdate({
        target: statistics.date,
        set: {
          totalFlows: stats.totalCount || 0,
          startedFlows: stats.flows?.started || 0,
          completedFlows: stats.flows?.completed || 0,
          totalFocusTime: stats.flows?.minutes || 0,
          totalBreaks: stats.breaks?.completed || 0,
          totalBreakTime: stats.breaks?.minutes || 0,
          interruptions: stats.interruptions || 0,
          updatedAt: now,
        },
      });
    } catch (error) {
      console.error('Failed to save statistics:', error);
      throw error;
    }
  }

  async getStatistics(date?: string): Promise<any> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const result = await db.select().from(statistics).where(eq(statistics.date, targetDate)).limit(1);

      if (result.length === 0) {
        return {
          totalCount: 0,
          flows: { started: 0, completed: 0, minutes: 0 },
          breaks: { started: 0, completed: 0, minutes: 0 },
          interruptions: 0
        };
      }

      const stat = result[0];
      return {
        totalCount: stat.totalFlows,
        flows: {
          started: stat.startedFlows,
          completed: stat.completedFlows,
          minutes: stat.totalFocusTime
        },
        breaks: {
          started: stat.totalBreaks,
          completed: stat.totalBreaks,
          minutes: stat.totalBreakTime
        },
        interruptions: stat.interruptions
      };
    } catch (error) {
      console.error('Failed to get statistics:', error);
      throw error;
    }
  }

  async getStatisticsRange(startDate: string, endDate: string): Promise<any[]> {
    try {
      const result = await db.select()
        .from(statistics)
        .where(and(
          gte(statistics.date, startDate),
          lte(statistics.date, endDate)
        ))
        .orderBy(statistics.date);

      return result.map((row) => ({
        date: row.date,
        totalCount: row.totalFlows,
        flows: {
          started: row.startedFlows,
          completed: row.completedFlows,
          minutes: row.totalFocusTime
        },
        breaks: {
          started: row.totalBreaks,
          completed: row.totalBreaks,
          minutes: row.totalBreakTime
        },
        interruptions: row.interruptions
      }));
    } catch (error) {
      console.error('Failed to get statistics range:', error);
      throw error;
    }
  }

  // Flow metrics operations
  async saveFlowMetrics(metrics: any): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      await db.insert(flowMetrics).values({
        id: 1,
        consecutiveSessions: metrics.consecutiveSessions || 0,
        currentStreak: metrics.currentStreak || 0,
        longestStreak: metrics.longestStreak || 0,
        flowIntensity: metrics.flowIntensity || 'medium',
        distractionCount: metrics.distractionCount || 0,
        sessionStartTime: metrics.sessionStartTime || null,
        totalFocusTime: metrics.totalFocusTime || 0,
        averageSessionLength: metrics.averageSessionLength || 25.0,
        bestFlowDuration: metrics.bestFlowDuration || 0,
        lastSessionDate: metrics.lastSessionDate || null,
        updatedAt: now,
      }).onConflictDoUpdate({
        target: flowMetrics.id,
        set: {
          consecutiveSessions: metrics.consecutiveSessions || 0,
          currentStreak: metrics.currentStreak || 0,
          longestStreak: metrics.longestStreak || 0,
          flowIntensity: metrics.flowIntensity || 'medium',
          distractionCount: metrics.distractionCount || 0,
          sessionStartTime: metrics.sessionStartTime || null,
          totalFocusTime: metrics.totalFocusTime || 0,
          averageSessionLength: metrics.averageSessionLength || 25.0,
          bestFlowDuration: metrics.bestFlowDuration || 0,
          lastSessionDate: metrics.lastSessionDate || null,
          updatedAt: now,
        },
      });
    } catch (error) {
      console.error('Failed to save flow metrics:', error);
      throw error;
    }
  }

  async getFlowMetrics(): Promise<any> {
    try {
      const result = await db.select().from(flowMetrics).where(eq(flowMetrics.id, 1)).limit(1);

      if (result.length === 0) {
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

      const metrics = result[0];
      return {
        consecutiveSessions: metrics.consecutiveSessions,
        currentStreak: metrics.currentStreak,
        longestStreak: metrics.longestStreak,
        flowIntensity: metrics.flowIntensity,
        distractionCount: metrics.distractionCount,
        sessionStartTime: metrics.sessionStartTime,
        totalFocusTime: metrics.totalFocusTime,
        averageSessionLength: metrics.averageSessionLength,
        bestFlowDuration: metrics.bestFlowDuration,
        lastSessionDate: metrics.lastSessionDate
      };
    } catch (error) {
      console.error('Failed to get flow metrics:', error);
      throw error;
    }
  }

  // Settings operations
  async saveSettings(settingsData: any): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      await db.insert(settings).values({
        id: 1,
        timeDuration: settingsData.timeDuration || 25,
        breakDuration: settingsData.breakDuration || 5,
        soundEffects: settingsData.soundEffects ?? true,
        notifications: settingsData.notifications ?? true,
        darkMode: settingsData.darkMode ?? false,
        autoBreak: settingsData.autoBreak ?? false,
        focusReminders: settingsData.focusReminders ?? true,
        weeklyReports: settingsData.weeklyReports ?? true,
        dataSync: settingsData.dataSync ?? true,
        notificationStatus: settingsData.notificationStatus || null,
        updatedAt: now,
      }).onConflictDoUpdate({
        target: settings.id,
        set: {
          timeDuration: settingsData.timeDuration || 25,
          breakDuration: settingsData.breakDuration || 5,
          soundEffects: settingsData.soundEffects ?? true,
          notifications: settingsData.notifications ?? true,
          darkMode: settingsData.darkMode ?? false,
          autoBreak: settingsData.autoBreak ?? false,
          focusReminders: settingsData.focusReminders ?? true,
          weeklyReports: settingsData.weeklyReports ?? true,
          dataSync: settingsData.dataSync ?? true,
          notificationStatus: settingsData.notificationStatus || null,
          updatedAt: now,
        },
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  async getSettings(): Promise<any> {
    try {
      const result = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);

      if (result.length === 0) {
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

      const setting = result[0];
      return {
        timeDuration: setting.timeDuration,
        breakDuration: setting.breakDuration,
        soundEffects: setting.soundEffects,
        notifications: setting.notifications,
        darkMode: setting.darkMode,
        autoBreak: setting.autoBreak,
        focusReminders: setting.focusReminders,
        weeklyReports: setting.weeklyReports,
        dataSync: setting.dataSync,
        notificationStatus: setting.notificationStatus
      };
    } catch (error) {
      console.error('Failed to get settings:', error);
      throw error;
    }
  }

  // Theme operations
  async saveTheme(themeData: any): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      await db.insert(theme).values({
        id: 1,
        mode: themeData.mode || 'auto',
        accentColor: themeData.accentColor || 'green',
        timerStyle: themeData.timerStyle || 'digital',
        customThemes: JSON.stringify(themeData.customThemes || {}),
        activeCustomTheme: themeData.activeCustomTheme || null,
        updatedAt: now,
      }).onConflictDoUpdate({
        target: theme.id,
        set: {
          mode: themeData.mode || 'auto',
          accentColor: themeData.accentColor || 'green',
          timerStyle: themeData.timerStyle || 'digital',
          customThemes: JSON.stringify(themeData.customThemes || {}),
          activeCustomTheme: themeData.activeCustomTheme || null,
          updatedAt: now,
        },
      });
    } catch (error) {
      console.error('Failed to save theme:', error);
      throw error;
    }
  }

  async getTheme(): Promise<any> {
    try {
      const result = await db.select().from(theme).where(eq(theme.id, 1)).limit(1);

      if (result.length === 0) {
        return {
          mode: 'auto',
          accentColor: 'green',
          timerStyle: 'digital',
          customThemes: {},
          activeCustomTheme: null
        };
      }

      const themeData = result[0];
      return {
        mode: themeData.mode,
        accentColor: themeData.accentColor,
        timerStyle: themeData.timerStyle,
        customThemes: JSON.parse(themeData.customThemes || '{}'),
        activeCustomTheme: themeData.activeCustomTheme
      };
    } catch (error) {
      console.error('Failed to get theme:', error);
      throw error;
    }
  }

  // Export operations
  async exportAllData(): Promise<string> {
    try {
      const [goalsData, statisticsData, flowMetricsData, settingsData, themeData] = await Promise.all([
        db.select().from(goals),
        db.select().from(statistics).orderBy(statistics.date),
        db.select().from(flowMetrics),
        db.select().from(settings),
        db.select().from(theme)
      ]);

      const exportData = {
        goals: goalsData,
        statistics: statisticsData,
        flowMetrics: flowMetricsData,
        settings: settingsData,
        theme: themeData,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        db.delete(goals),
        db.delete(statistics),
        db.delete(flowMetrics),
        db.delete(settings),
        db.delete(theme),
        db.delete(sessions)
      ]);
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  }
}

// Web fallback using localStorage (unchanged)
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
      if (date >= startDate && date <= endDate && typeof stats === 'object' && stats !== null) {
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
  : new DrizzleService();

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