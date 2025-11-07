/**
 * Statistics Service
 * Calculates and aggregates statistics from sessions and todos
 */

import { localDatabaseService, Session, Todo } from './local-database-service';

export interface DailyStats {
    date: string; // ISO date string (YYYY-MM-DD)
    focusSessions: number;
    breakSessions: number;
    totalFocusTime: number; // in seconds
    totalBreakTime: number; // in seconds
    completedTodos: number;
}

export interface WeeklyStats {
    weekStart: string; // ISO date string
    weekEnd: string; // ISO date string
    totalFocusTime: number;
    totalBreakTime: number;
    totalSessions: number;
    completedTodos: number;
    averageSessionDuration: number; // in seconds
}

export interface MonthlyStats {
    month: string; // YYYY-MM format
    totalFocusTime: number;
    totalBreakTime: number;
    totalSessions: number;
    completedTodos: number;
    averageSessionDuration: number;
    mostProductiveDay: string | null;
}

export interface TodoStats {
    todoId: string;
    todoTitle: string;
    totalTimeSpent: number; // in seconds
    sessionCount: number;
    averageSessionDuration: number;
    completionRate: number; // percentage of completed sessions
}

export interface CategoryStats {
    category: string;
    totalTimeSpent: number;
    todoCount: number;
    completedCount: number;
    averageTimePerTodo: number;
}

export interface ProductivityTrend {
    date: string;
    focusTime: number;
    sessions: number;
    todosCompleted: number;
}

class StatisticsService {
    /**
     * Get all sessions from database
     */
    private async getSessions(): Promise<Session[]> {
        await localDatabaseService.waitForInitialization();
        return await localDatabaseService.getSessions();
    }

    /**
     * Get all todos from database
     */
    private async getTodos(): Promise<Todo[]> {
        await localDatabaseService.waitForInitialization();
        return await localDatabaseService.getTodos();
    }

    /**
     * Get daily statistics for a date range
     */
    async getDailyStats(startDate: Date, endDate: Date): Promise<DailyStats[]> {
        const sessions = await this.getSessions();
        const todos = await this.getTodos();

        const statsMap = new Map<string, DailyStats>();

        // Initialize all dates in range
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split('T')[0];
            statsMap.set(dateKey, {
                date: dateKey,
                focusSessions: 0,
                breakSessions: 0,
                totalFocusTime: 0,
                totalBreakTime: 0,
                completedTodos: 0,
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Aggregate session data
        sessions.forEach((session) => {
            const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
            const stats = statsMap.get(sessionDate);

            if (stats && session.isCompleted) {
                if (session.type === 'focus') {
                    stats.focusSessions++;
                    stats.totalFocusTime += session.duration;
                } else {
                    stats.breakSessions++;
                    stats.totalBreakTime += session.duration;
                }
            }
        });

        // Aggregate completed todos
        todos.forEach((todo) => {
            if (todo.isCompleted && todo.completedAt) {
                const completedDate = new Date(todo.completedAt).toISOString().split('T')[0];
                const stats = statsMap.get(completedDate);
                if (stats) {
                    stats.completedTodos++;
                }
            }
        });

        return Array.from(statsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }

    /**
     * Get weekly statistics
     */
    async getWeeklyStats(weeks: number = 4): Promise<WeeklyStats[]> {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - weeks * 7);

        const dailyStats = await this.getDailyStats(startDate, endDate);
        const weeklyStatsMap = new Map<string, WeeklyStats>();

        dailyStats.forEach((day) => {
            const date = new Date(day.date);
            const weekStart = this.getWeekStart(date);
            const weekKey = weekStart.toISOString().split('T')[0];

            if (!weeklyStatsMap.has(weekKey)) {
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);

                weeklyStatsMap.set(weekKey, {
                    weekStart: weekKey,
                    weekEnd: weekEnd.toISOString().split('T')[0],
                    totalFocusTime: 0,
                    totalBreakTime: 0,
                    totalSessions: 0,
                    completedTodos: 0,
                    averageSessionDuration: 0,
                });
            }

            const weekStats = weeklyStatsMap.get(weekKey)!;
            weekStats.totalFocusTime += day.totalFocusTime;
            weekStats.totalBreakTime += day.totalBreakTime;
            weekStats.totalSessions += day.focusSessions + day.breakSessions;
            weekStats.completedTodos += day.completedTodos;
        });

        // Calculate averages
        weeklyStatsMap.forEach((stats) => {
            if (stats.totalSessions > 0) {
                stats.averageSessionDuration =
                    (stats.totalFocusTime + stats.totalBreakTime) / stats.totalSessions;
            }
        });

        return Array.from(weeklyStatsMap.values()).sort((a, b) =>
            a.weekStart.localeCompare(b.weekStart),
        );
    }

    /**
     * Get monthly statistics
     */
    async getMonthlyStats(months: number = 6): Promise<MonthlyStats[]> {
        const sessions = await this.getSessions();
        const todos = await this.getTodos();
        const monthlyStatsMap = new Map<string, MonthlyStats>();

        // Aggregate sessions by month
        sessions.forEach((session) => {
            if (!session.isCompleted) return;

            const date = new Date(session.startTime);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyStatsMap.has(monthKey)) {
                monthlyStatsMap.set(monthKey, {
                    month: monthKey,
                    totalFocusTime: 0,
                    totalBreakTime: 0,
                    totalSessions: 0,
                    completedTodos: 0,
                    averageSessionDuration: 0,
                    mostProductiveDay: null,
                });
            }

            const stats = monthlyStatsMap.get(monthKey)!;
            if (session.type === 'focus') {
                stats.totalFocusTime += session.duration;
            } else {
                stats.totalBreakTime += session.duration;
            }
            stats.totalSessions++;
        });

        // Aggregate completed todos by month
        todos.forEach((todo) => {
            if (todo.isCompleted && todo.completedAt) {
                const date = new Date(todo.completedAt);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const stats = monthlyStatsMap.get(monthKey);
                if (stats) {
                    stats.completedTodos++;
                }
            }
        });

        // Calculate averages and find most productive day
        for (const [monthKey, stats] of monthlyStatsMap.entries()) {
            if (stats.totalSessions > 0) {
                stats.averageSessionDuration =
                    (stats.totalFocusTime + stats.totalBreakTime) / stats.totalSessions;
            }

            // Find most productive day in the month
            const monthStart = new Date(`${stats.month}-01`);
            const monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            monthEnd.setDate(0); // Last day of month

            const dailyStats = await this.getDailyStats(monthStart, monthEnd);
            let maxFocusTime = 0;
            let mostProductive = null;

            dailyStats.forEach((day) => {
                if (day.totalFocusTime > maxFocusTime) {
                    maxFocusTime = day.totalFocusTime;
                    mostProductive = day.date;
                }
            });

            stats.mostProductiveDay = mostProductive;
        }

        const sorted = Array.from(monthlyStatsMap.values()).sort((a, b) =>
            a.month.localeCompare(b.month),
        );

        // Return last N months
        return sorted.slice(-months);
    }

    /**
     * Get statistics for a specific todo
     */
    async getTodoStats(todoId: string): Promise<TodoStats | null> {
        const sessions = await localDatabaseService.getSessionsForTodo(todoId);
        const todo = await localDatabaseService.getTodo(todoId);

        if (!todo || sessions.length === 0) {
            return null;
        }

        const completedSessions = sessions.filter((s) => s.isCompleted);
        const totalTime = completedSessions.reduce((sum, s) => sum + s.duration, 0);

        return {
            todoId: todo.id,
            todoTitle: todo.title,
            totalTimeSpent: totalTime,
            sessionCount: completedSessions.length,
            averageSessionDuration:
                completedSessions.length > 0 ? totalTime / completedSessions.length : 0,
            completionRate:
                sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0,
        };
    }

    /**
     * Get statistics by category
     */
    async getCategoryStats(): Promise<CategoryStats[]> {
        const todos = await this.getTodos();
        const sessions = await this.getSessions();
        const categoryMap = new Map<string, CategoryStats>();

        todos.forEach((todo) => {
            const category = todo.category || 'Uncategorized';

            if (!categoryMap.has(category)) {
                categoryMap.set(category, {
                    category,
                    totalTimeSpent: 0,
                    todoCount: 0,
                    completedCount: 0,
                    averageTimePerTodo: 0,
                });
            }

            const stats = categoryMap.get(category)!;
            stats.todoCount++;
            if (todo.isCompleted) {
                stats.completedCount++;
            }
        });

        // Calculate time spent per category
        for (const [category, stats] of categoryMap.entries()) {
            const categoryTodos = todos.filter((t) => (t.category || 'Uncategorized') === category);
            let totalTime = 0;

            for (const todo of categoryTodos) {
                const todoSessions = sessions.filter(
                    (s) => s.todoId === todo.id && s.isCompleted && s.type === 'focus',
                );
                totalTime += todoSessions.reduce((sum, s) => sum + s.duration, 0);
            }

            stats.totalTimeSpent = totalTime;
            stats.averageTimePerTodo = stats.todoCount > 0 ? totalTime / stats.todoCount : 0;
        }

        return Array.from(categoryMap.values());
    }

    /**
     * Get overall statistics
     */
    async getOverallStats(): Promise<{
        totalFocusTime: number;
        totalSessions: number;
        totalTodos: number;
        completedTodos: number;
        averageSessionDuration: number;
        longestStreak: number; // days
    }> {
        const sessions = await this.getSessions();
        const todos = await this.getTodos();

        const completedSessions = sessions.filter((s) => s.isCompleted && s.type === 'focus');
        const totalFocusTime = completedSessions.reduce((sum, s) => sum + s.duration, 0);
        const completedTodos = todos.filter((t) => t.isCompleted);

        // Calculate longest streak
        const dailyStats = await this.getDailyStats(
            new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
            new Date(),
        );

        let longestStreak = 0;
        let currentStreak = 0;

        dailyStats.forEach((day) => {
            if (day.focusSessions > 0) {
                currentStreak++;
                longestStreak = Math.max(longestStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        });

        return {
            totalFocusTime,
            totalSessions: completedSessions.length,
            totalTodos: todos.length,
            completedTodos: completedTodos.length,
            averageSessionDuration:
                completedSessions.length > 0 ? totalFocusTime / completedSessions.length : 0,
            longestStreak,
        };
    }

    /**
     * Get productivity trends for a date range
     */
    async getProductivityTrend(startDate: Date, endDate: Date): Promise<ProductivityTrend[]> {
        const dailyStats = await this.getDailyStats(startDate, endDate);
        return dailyStats.map((day) => ({
            date: day.date,
            focusTime: day.totalFocusTime,
            sessions: day.focusSessions,
            todosCompleted: day.completedTodos,
        }));
    }

    /**
     * Get week start date (Monday)
     */
    private getWeekStart(date: Date): Date {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(date.setDate(diff));
    }

    /**
     * Format seconds to human-readable string
     */
    formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    /**
     * Format duration to hours and minutes
     */
    formatDurationDetailed(seconds: number): { hours: number; minutes: number } {
        return {
            hours: Math.floor(seconds / 3600),
            minutes: Math.floor((seconds % 3600) / 60),
        };
    }
}

// Export singleton instance
export const statisticsService = new StatisticsService();
