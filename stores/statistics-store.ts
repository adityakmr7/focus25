import { statisticsService } from '@/services/statistics-service';
import type {
    DailyStats,
    WeeklyStats,
    MonthlyStats,
    TodoStats,
    CategoryStats,
    ProductivityTrend,
} from '@/services/statistics-service';
import { create } from 'zustand';

interface StatisticsState {
    // Data
    dailyStats: DailyStats[];
    weeklyStats: WeeklyStats[];
    monthlyStats: MonthlyStats[];
    todoStats: TodoStats[];
    categoryStats: CategoryStats[];
    overallStats: {
        totalFocusTime: number;
        totalSessions: number;
        totalTodos: number;
        completedTodos: number;
        averageSessionDuration: number;
        longestStreak: number;
    } | null;
    productivityTrend: ProductivityTrend[];

    // Loading states
    isLoading: boolean;
    error: string | null;

    // Actions
    loadDailyStats: (startDate: Date, endDate: Date) => Promise<void>;
    loadWeeklyStats: (weeks?: number) => Promise<void>;
    loadMonthlyStats: (months?: number) => Promise<void>;
    loadTodoStats: (todoId: string) => Promise<TodoStats | null>;
    loadCategoryStats: () => Promise<void>;
    loadOverallStats: () => Promise<void>;
    loadProductivityTrend: (startDate: Date, endDate: Date) => Promise<void>;
    refreshAll: () => Promise<void>;
}

export const useStatisticsStore = create<StatisticsState>((set, get) => ({
    // Initial state
    dailyStats: [],
    weeklyStats: [],
    monthlyStats: [],
    todoStats: [],
    categoryStats: [],
    overallStats: null,
    productivityTrend: [],

    isLoading: false,
    error: null,

    loadDailyStats: async (startDate: Date, endDate: Date) => {
        set({ isLoading: true, error: null });
        try {
            const stats = await statisticsService.getDailyStats(startDate, endDate);
            set({ dailyStats: stats, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load daily statistics',
                isLoading: false,
            });
        }
    },

    loadWeeklyStats: async (weeks: number = 4) => {
        set({ isLoading: true, error: null });
        try {
            const stats = await statisticsService.getWeeklyStats(weeks);
            set({ weeklyStats: stats, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load weekly statistics',
                isLoading: false,
            });
        }
    },

    loadMonthlyStats: async (months: number = 6) => {
        set({ isLoading: true, error: null });
        try {
            const stats = await statisticsService.getMonthlyStats(months);
            set({ monthlyStats: stats, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load monthly statistics',
                isLoading: false,
            });
        }
    },

    loadTodoStats: async (todoId: string) => {
        try {
            const stats = await statisticsService.getTodoStats(todoId);
            if (stats) {
                set((state) => ({
                    todoStats: [...state.todoStats.filter((s) => s.todoId !== todoId), stats],
                }));
            }
            return stats;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load todo statistics',
            });
            return null;
        }
    },

    loadCategoryStats: async () => {
        set({ isLoading: true, error: null });
        try {
            const stats = await statisticsService.getCategoryStats();
            set({ categoryStats: stats, isLoading: false });
        } catch (error) {
            set({
                error:
                    error instanceof Error ? error.message : 'Failed to load category statistics',
                isLoading: false,
            });
        }
    },

    loadOverallStats: async () => {
        set({ isLoading: true, error: null });
        try {
            const stats = await statisticsService.getOverallStats();
            set({ overallStats: stats, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load overall statistics',
                isLoading: false,
            });
        }
    },

    loadProductivityTrend: async (startDate: Date, endDate: Date) => {
        set({ isLoading: true, error: null });
        try {
            const trend = await statisticsService.getProductivityTrend(startDate, endDate);
            set({ productivityTrend: trend, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load productivity trend',
                isLoading: false,
            });
        }
    },

    refreshAll: async () => {
        const promises = [
            get().loadWeeklyStats(4),
            get().loadMonthlyStats(6),
            get().loadCategoryStats(),
            get().loadOverallStats(),
        ];

        // Load last 30 days for daily stats and trend
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        promises.push(get().loadDailyStats(startDate, endDate));
        promises.push(get().loadProductivityTrend(startDate, endDate));

        await Promise.all(promises);
    },
}));
