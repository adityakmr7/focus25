// utils/databaseUtils.ts
import { v4 as uuidv4 } from 'uuid';
import {
    ExportData,
    Goal,
    GoalCategory,
    GoalType,
    Session,
    SessionType,
    Statistics,
} from '../types/database';
import { LocalDataBase } from '../data/local/localDatabase';

/**
 * Database utility functions for common operations
 */
export class DatabaseUtils {
    constructor(private db: LocalDataBase) {}

    /**
     * Create a new goal with validation
     */
    async createGoal(
        goalData: Omit<Goal, 'id' | 'createdAt' | 'current' | 'isCompleted'>,
    ): Promise<Goal> {
        const goal: Goal = {
            id: uuidv4(),
            current: 0,
            isCompleted: false,
            createdAt: new Date().toISOString(),
            ...goalData,
        };

        // Validate goal data
        this.validateGoal(goal);

        await this.db.saveGoal(goal);
        return goal;
    }

    /**
     * Update goal progress and check for completion
     */
    async updateGoalProgress(goalId: string, increment: number): Promise<Goal | null> {
        const goals = await this.db.getGoals();
        const goal = goals.find((g) => g.id === goalId);

        if (!goal) return null;

        const newCurrent = Math.max(0, goal.current + increment);
        const isCompleted = newCurrent >= goal.target;

        const updates: Partial<Goal> = {
            current: newCurrent,
            isCompleted,
            ...(isCompleted && !goal.completedAt ? { completedAt: new Date().toISOString() } : {}),
        };

        await this.db.updateGoal(goalId, updates);

        return { ...goal, ...updates };
    }

    /**
     * Get goals by category
     */
    async getGoalsByCategory(category: GoalCategory): Promise<Goal[]> {
        const goals = await this.db.getGoals();
        return goals.filter((goal) => goal.category === category);
    }

    /**
     * Get goals by type
     */
    async getGoalsByType(type: GoalType): Promise<Goal[]> {
        const goals = await this.db.getGoals();
        return goals.filter((goal) => goal.type === type);
    }

    /**
     * Get active (incomplete) goals
     */
    async getActiveGoals(): Promise<Goal[]> {
        const goals = await this.db.getGoals();
        return goals.filter((goal) => !goal.isCompleted);
    }

    /**
     * Get completed goals
     */
    async getCompletedGoals(): Promise<Goal[]> {
        const goals = await this.db.getGoals();
        return goals.filter((goal) => goal.isCompleted);
    }

    /**
     * Get goals due soon (within specified days)
     */
    async getGoalsDueSoon(days: number = 7): Promise<Goal[]> {
        const goals = await this.db.getGoals();
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + days);

        return goals.filter((goal) => {
            if (!goal.deadline || goal.isCompleted) return false;
            return new Date(goal.deadline) <= targetDate;
        });
    }

    /**
     * Create a new session
     */
    async createSession(sessionData: Omit<Session, 'id' | 'createdAt'>): Promise<Session> {
        const session: Session = {
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            ...sessionData,
        };

        await this.db.saveSession(session);
        return session;
    }

    /**
     * Complete a session and update statistics
     */
    async completeSession(sessionId: string, actualDuration?: number): Promise<Session | null> {
        const session = await this.db.getSessionById(sessionId);
        if (!session) return null;

        const now = new Date().toISOString();
        const duration = actualDuration || session.duration;

        const updates: Partial<Session> = {
            completed: true,
            endTime: now,
            duration: duration,
        };

        await this.db.updateSession(sessionId, updates);

        // Update daily statistics
        await this.updateDailyStatistics(session.type, duration, true);

        return { ...session, ...updates };
    }

    /**
     * Get sessions by type
     */
    async getSessionsByType(
        type: SessionType,
        startDate?: string,
        endDate?: string,
    ): Promise<Session[]> {
        const sessions = await this.db.getSessions(startDate, endDate);
        return sessions.filter((session) => session.type === type);
    }

    /**
     * Get today's sessions
     */
    async getTodaySessions(): Promise<Session[]> {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return this.db.getSessions(today, tomorrow);
    }

    /**
     * Update daily statistics when sessions are completed
     */
    private async updateDailyStatistics(
        sessionType: SessionType,
        duration: number,
        completed: boolean,
    ): Promise<void> {
        const today = new Date().toISOString().split('T')[0];
        const currentStats = await this.db.getStatistics(today);

        const updatedStats: Statistics = { ...currentStats };

        if (sessionType === SessionType.FOCUS) {
            updatedStats.flows.started += 1;
            if (completed) {
                updatedStats.flows.completed += 1;
                updatedStats.flows.minutes += duration;
                updatedStats.totalCount += 1;
            }
        } else if (
            sessionType === SessionType.SHORT_BREAK ||
            sessionType === SessionType.LONG_BREAK
        ) {
            updatedStats.breaks.started += 1;
            if (completed) {
                updatedStats.breaks.completed += 1;
                updatedStats.breaks.minutes += duration;
            }
        }

        await this.db.saveStatistics(updatedStats);
    }

    /**
     * Calculate weekly statistics
     */
    async getWeeklyStatistics(): Promise<{
        totalSessions: number;
        completedSessions: number;
        totalFocusTime: number;
        averageSessionLength: number;
        completionRate: number;
    }> {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];
        const today = new Date().toISOString().split('T')[0];

        const stats = await this.db.getStatisticsRange(oneWeekAgo, today);

        const totals = stats.reduce(
            (acc, stat) => ({
                totalSessions: acc.totalSessions + stat.flows.started,
                completedSessions: acc.completedSessions + stat.flows.completed,
                totalFocusTime: acc.totalFocusTime + stat.flows.minutes,
            }),
            { totalSessions: 0, completedSessions: 0, totalFocusTime: 0 },
        );

        return {
            ...totals,
            averageSessionLength:
                totals.completedSessions > 0 ? totals.totalFocusTime / totals.completedSessions : 0,
            completionRate:
                totals.totalSessions > 0
                    ? (totals.completedSessions / totals.totalSessions) * 100
                    : 0,
        };
    }

    /**
     * Calculate monthly statistics
     */
    async getMonthlyStatistics(): Promise<{
        totalSessions: number;
        completedSessions: number;
        totalFocusTime: number;
        totalBreakTime: number;
        averageSessionLength: number;
        bestDay: { date: string; sessions: number } | null;
        completionRate: number;
    }> {
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];
        const today = new Date().toISOString().split('T')[0];

        const stats = await this.db.getStatisticsRange(oneMonthAgo, today);

        let bestDay: { date: string; sessions: number } | null = null;

        const totals = stats.reduce(
            (acc, stat) => {
                // Track best day
                if (!bestDay || stat.flows.completed > bestDay.sessions) {
                    bestDay = { date: stat.date, sessions: stat.flows.completed };
                }

                return {
                    totalSessions: acc.totalSessions + stat.flows.started,
                    completedSessions: acc.completedSessions + stat.flows.completed,
                    totalFocusTime: acc.totalFocusTime + stat.flows.minutes,
                    totalBreakTime: acc.totalBreakTime + stat.breaks.minutes,
                };
            },
            { totalSessions: 0, completedSessions: 0, totalFocusTime: 0, totalBreakTime: 0 },
        );

        return {
            ...totals,
            averageSessionLength:
                totals.completedSessions > 0 ? totals.totalFocusTime / totals.completedSessions : 0,
            completionRate:
                totals.totalSessions > 0
                    ? (totals.completedSessions / totals.totalSessions) * 100
                    : 0,
            bestDay,
        };
    }

    /**
     * Get productivity insights
     */
    async getProductivityInsights(): Promise<{
        currentStreak: number;
        longestStreak: number;
        averageDailyFocus: number;
        mostProductiveHour: number | null;
        weeklyTrend: 'up' | 'down' | 'stable';
        completionTrend: 'improving' | 'declining' | 'stable';
    }> {
        const flowMetrics = await this.db.getFlowMetrics();
        const weeklyStats = await this.getWeeklyStatistics();
        const sessions = await this.db.getSessions();

        // Calculate most productive hour
        const hourCounts: Record<number, number> = {};
        sessions.forEach((session) => {
            if (session.type === SessionType.FOCUS && session.completed) {
                const hour = new Date(session.startTime).getHours();
                hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            }
        });

        const mostProductiveHour =
            Object.keys(hourCounts).length > 0
                ? parseInt(Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0][0])
                : null;

        // Calculate trends (simplified - you might want more sophisticated analysis)
        const lastWeekStats = await this.getStatisticsRange(
            new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        );

        const thisWeekTotal = weeklyStats.totalFocusTime;
        const lastWeekTotal = lastWeekStats.reduce((acc, stat) => acc + stat.flows.minutes, 0);

        let weeklyTrend: 'up' | 'down' | 'stable' = 'stable';
        if (thisWeekTotal > lastWeekTotal * 1.1) weeklyTrend = 'up';
        else if (thisWeekTotal < lastWeekTotal * 0.9) weeklyTrend = 'down';

        return {
            currentStreak: flowMetrics.currentStreak,
            longestStreak: flowMetrics.longestStreak,
            averageDailyFocus: weeklyStats.totalFocusTime / 7,
            mostProductiveHour,
            weeklyTrend,
            completionTrend: 'stable', // Simplified - implement proper trend analysis
        };
    }

    /**
     * Backup data to JSON string
     */
    async backupData(): Promise<string> {
        return this.db.exportAllData();
    }

    /**
     * Restore data from JSON string
     */
    async restoreData(jsonData: string): Promise<void> {
        try {
            const data: ExportData = JSON.parse(jsonData);

            // Validate data structure
            if (!data.version || !data.exportedAt) {
                throw new Error('Invalid backup data format');
            }

            // Clear existing data
            await this.db.clearAllData();
            await this.db.initializeDatabase();

            // Restore goals
            if (data.goals) {
                for (const goal of data.goals) {
                    await this.db.saveGoal(goal);
                }
            }

            // Restore statistics
            if (data.statistics) {
                for (const stat of data.statistics) {
                    await this.db.saveStatistics(stat);
                }
            }

            // Restore sessions
            if (data.sessions) {
                for (const session of data.sessions) {
                    await this.db.saveSession(session);
                }
            }

            // Restore settings and other data
            if (data.settings) await this.db.saveSettings(data.settings);
            if (data.theme) await this.db.saveTheme(data.theme);
            if (data.flowMetrics) await this.db.saveFlowMetrics(data.flowMetrics);
        } catch (error: any) {
            throw new Error(`Failed to restore data: ${error.message}`);
        }
    }

    /**
     * Get database statistics
     */
    async getDatabaseStats(): Promise<{
        totalGoals: number;
        completedGoals: number;
        totalSessions: number;
        completedSessions: number;
        daysTracked: number;
        totalFocusTime: number;
    }> {
        const [goals, sessions, allStats] = await Promise.all([
            this.db.getGoals(),
            this.db.getSessions(),
            this.db.getStatisticsRange('2020-01-01', new Date().toISOString().split('T')[0]),
        ]);

        const completedGoals = goals.filter((g) => g.isCompleted).length;
        const completedSessions = sessions.filter((s) => s.completed).length;
        const totalFocusTime = allStats.reduce((acc, stat) => acc + stat.flows.minutes, 0);

        return {
            totalGoals: goals.length,
            completedGoals,
            totalSessions: sessions.length,
            completedSessions,
            daysTracked: allStats.length,
            totalFocusTime,
        };
    }

    /**
     * Validate goal data
     */
    private validateGoal(goal: Goal): void {
        if (!goal.title.trim()) {
            throw new Error('Goal title is required');
        }
        if (goal.target <= 0) {
            throw new Error('Goal target must be greater than 0');
        }
        if (goal.current < 0) {
            throw new Error('Goal current progress cannot be negative');
        }
        if (!Object.values(GoalCategory).includes(goal.category)) {
            throw new Error('Invalid goal category');
        }
        if (!Object.values(GoalType).includes(goal.type)) {
            throw new Error('Invalid goal type');
        }
    }

    /**
     * Get date range statistics
     */
    private async getStatisticsRange(startDate: string, endDate: string): Promise<Statistics[]> {
        return this.db.getStatisticsRange(startDate, endDate);
    }

    /**
     * Clean up old data (older than specified days)
     */
    async cleanupOldData(daysToKeep: number = 365): Promise<void> {
        const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
        const cutoffString = cutoffDate.toISOString();

        // Clean up old sessions
        const sessions = await this.db.getSessions();
        const oldSessions = sessions.filter((session) => session.createdAt < cutoffString);

        for (const session of oldSessions) {
            await this.db.deleteSession(session.id);
        }

        console.log(`Cleaned up ${oldSessions.length} old sessions`);
    }
}

/**
 * Date utility functions for database operations
 */
export class DateUtils {
    static getToday(): string {
        return new Date().toISOString().split('T')[0];
    }

    static getYesterday(): string {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return yesterday.toISOString().split('T')[0];
    }

    static getWeekAgo(): string {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return weekAgo.toISOString().split('T')[0];
    }

    static getMonthAgo(): string {
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return monthAgo.toISOString().split('T')[0];
    }

    static formatDuration(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    }

    static isToday(dateString: string): boolean {
        return dateString === this.getToday();
    }

    static isYesterday(dateString: string): boolean {
        return dateString === this.getYesterday();
    }

    static daysBetween(date1: string, date2: string): number {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static isValidDuration(duration: number): boolean {
        return duration > 0 && duration <= 180; // Max 3 hours
    }

    static isValidGoalTarget(target: number): boolean {
        return target > 0 && target <= 10000; // Reasonable upper limit
    }

    static sanitizeInput(input: string): string {
        return input.trim().replace(/[<>]/g, '');
    }
}

// Example usage:
// import { localDatabaseService } from './services/database';
// import { DatabaseUtils, DateUtils } from './utils/databaseUtils';
//
// const dbUtils = new DatabaseUtils(localDatabaseService);
//
// // Create a new goal
// const goal = await dbUtils.createGoal({
//   title: 'Daily Reading',
//   category: GoalCategory.LEARNING,
//   type: GoalType.DAILY,
//   target: 1,
//   unit: 'book'
// });
//
// // Update goal progress
// await dbUtils.updateGoalProgress(goal.id, 1);
//
// // Get weekly stats
// const weeklyStats = await dbUtils.getWeeklyStatistics();
//
// // Format duration
// const formattedTime = DateUtils.formatDuration(125); // "2h 5m"
