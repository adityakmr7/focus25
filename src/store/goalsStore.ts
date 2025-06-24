import { create } from 'zustand';
import { databaseService } from '../services/database';

export type GoalType = 'daily' | 'weekly' | 'monthly';
export type GoalCategory = 'sessions' | 'focus_time' | 'streak' | 'consistency';

export interface Goal {
    id: string;
    title: string;
    description: string;
    category: GoalCategory;
    type: GoalType;
    target: number;
    current: number;
    unit: string; // 'sessions', 'minutes', 'days', '%'
    isCompleted: boolean;
    createdAt: string;
    completedAt?: string;
    deadline?: string;
    reward?: string;
}

interface GoalsState {
    goals: Goal[];
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;

    // Actions
    initializeStore: () => Promise<void>;
    createGoal: (goal: Omit<Goal, 'id' | 'current' | 'isCompleted' | 'createdAt'>) => Promise<void>;
    updateGoalProgress: (goalId: string, progress: number) => Promise<void>;
    completeGoal: (goalId: string) => Promise<void>;
    deleteGoal: (goalId: string) => Promise<void>;
    resetGoals: () => Promise<void>;
    getGoalsByType: (type: GoalType) => Goal[];
    getGoalsByCategory: (category: GoalCategory) => Goal[];
    getCompletedGoals: () => Goal[];
    getActiveGoals: () => Goal[];
    updateGoalsFromStats: (stats: {
        dailySessions: number;
        dailyFocusTime: number;
        currentStreak: number;
        weeklyConsistency: number;
    }) => Promise<void>;
    exportGoalsToCSV: () => string;
    syncWithDatabase: () => Promise<void>;
}

const defaultGoals: Omit<Goal, 'id' | 'current' | 'isCompleted' | 'createdAt'>[] = [
    {
        title: 'Daily Focus Champion',
        description: 'Complete 5 focus sessions today',
        category: 'sessions',
        type: 'daily',
        target: 5,
        unit: 'sessions',
    },
    {
        title: 'Deep Work Master',
        description: 'Focus for 2 hours today',
        category: 'focus_time',
        type: 'daily',
        target: 120,
        unit: 'minutes',
    },
    {
        title: 'Weekly Warrior',
        description: 'Maintain a 7-day streak',
        category: 'streak',
        type: 'weekly',
        target: 7,
        unit: 'days',
    },
    {
        title: 'Consistency King',
        description: 'Complete sessions 5 days this week',
        category: 'consistency',
        type: 'weekly',
        target: 5,
        unit: 'days',
    },
    {
        title: 'Monthly Marathon',
        description: 'Complete 100 sessions this month',
        category: 'sessions',
        type: 'monthly',
        target: 100,
        unit: 'sessions',
    },
];

export const useGoalsStore = create<GoalsState>((set, get) => ({
    goals: [],
    isLoading: false,
    error: null,
    isInitialized: false,

    initializeStore: async () => {
        if (get().isInitialized) return;

        try {
            set({ isLoading: true, error: null });

            const savedGoals = await databaseService.getGoals();

            if (savedGoals.length === 0) {
                // Initialize with default goals
                for (const goalData of defaultGoals) {
                    const newGoal: Goal = {
                        ...goalData,
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        current: 0,
                        isCompleted: false,
                        createdAt: new Date().toISOString(),
                    };
                    await databaseService.saveGoal(newGoal);
                    savedGoals.push(newGoal);
                }
            }

            set({
                goals: savedGoals,
                isInitialized: true,
                isLoading: false,
            });
        } catch (error) {
            console.error('Failed to initialize goals store:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to initialize goals',
                isLoading: false,
            });
        }
    },

    createGoal: async (goalData) => {
        try {
            set({ isLoading: true, error: null });

            const newGoal: Goal = {
                ...goalData,
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                current: 0,
                isCompleted: false,
                createdAt: new Date().toISOString(),
            };

            await databaseService.saveGoal(newGoal);

            set((state) => ({
                goals: [...state.goals, newGoal],
                isLoading: false,
            }));
        } catch (error) {
            console.error('Failed to create goal:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to create goal',
                isLoading: false,
            });
        }
    },

    updateGoalProgress: async (goalId, progress) => {
        try {
            const state = get();
            const goal = state.goals.find((g) => g.id === goalId);
            if (!goal) return;

            const updatedGoal = {
                ...goal,
                current: Math.min(progress, goal.target),
                isCompleted: progress >= goal.target,
                completedAt:
                    progress >= goal.target && !goal.isCompleted
                        ? new Date().toISOString()
                        : goal.completedAt,
            };

            await databaseService.updateGoal(goalId, {
                current: updatedGoal.current,
                isCompleted: updatedGoal.isCompleted,
                completedAt: updatedGoal.completedAt,
            });

            set((state) => ({
                goals: state.goals.map((g) => (g.id === goalId ? updatedGoal : g)),
            }));
        } catch (error) {
            console.error('Failed to update goal progress:', error);
            set({ error: error instanceof Error ? error.message : 'Failed to update goal' });
        }
    },

    completeGoal: async (goalId) => {
        try {
            const state = get();
            const goal = state.goals.find((g) => g.id === goalId);
            if (!goal) return;

            const completedAt = new Date().toISOString();

            await databaseService.updateGoal(goalId, {
                current: goal.target,
                isCompleted: true,
                completedAt,
            });

            set((state) => ({
                goals: state.goals.map((g) =>
                    g.id === goalId
                        ? {
                              ...g,
                              current: g.target,
                              isCompleted: true,
                              completedAt,
                          }
                        : g,
                ),
            }));
        } catch (error) {
            console.error('Failed to complete goal:', error);
            set({ error: error instanceof Error ? error.message : 'Failed to complete goal' });
        }
    },

    deleteGoal: async (goalId) => {
        try {
            await databaseService.deleteGoal(goalId);

            set((state) => ({
                goals: state.goals.filter((goal) => goal.id !== goalId),
            }));
        } catch (error) {
            console.error('Failed to delete goal:', error);
            set({ error: error instanceof Error ? error.message : 'Failed to delete goal' });
        }
    },

    resetGoals: async () => {
        try {
            set({ isLoading: true, error: null });

            // Delete all goals from database
            const currentGoals = get().goals;
            for (const goal of currentGoals) {
                await databaseService.deleteGoal(goal.id);
            }

            set({ goals: [], isLoading: false });
        } catch (error) {
            console.error('Failed to reset goals:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to reset goals',
                isLoading: false,
            });
        }
    },

    getGoalsByType: (type) => {
        return get().goals.filter((goal) => goal.type === type);
    },

    getGoalsByCategory: (category) => {
        return get().goals.filter((goal) => goal.category === category);
    },

    getCompletedGoals: () => {
        return get().goals.filter((goal) => goal.isCompleted);
    },

    getActiveGoals: () => {
        return get().goals.filter((goal) => !goal.isCompleted);
    },

    updateGoalsFromStats: async (stats) => {
        try {
            const { goals } = get();

            for (const goal of goals) {
                let newProgress = goal.current;

                switch (goal.category) {
                    case 'sessions':
                        if (goal.type === 'daily') {
                            newProgress = stats.dailySessions;
                        }
                        break;
                    case 'focus_time':
                        if (goal.type === 'daily') {
                            newProgress = stats.dailyFocusTime;
                        }
                        break;
                    case 'streak':
                        newProgress = stats.currentStreak;
                        break;
                    case 'consistency':
                        if (goal.type === 'weekly') {
                            newProgress = Math.round((stats.weeklyConsistency / 100) * 7);
                        }
                        break;
                }

                if (newProgress !== goal.current) {
                    await get().updateGoalProgress(goal.id, newProgress);
                }
            }
        } catch (error) {
            console.error('Failed to update goals from stats:', error);
            set({ error: error instanceof Error ? error.message : 'Failed to update goals' });
        }
    },

    exportGoalsToCSV: () => {
        const { goals } = get();
        const headers = [
            'Title',
            'Description',
            'Category',
            'Type',
            'Target',
            'Current',
            'Unit',
            'Completed',
            'Created At',
            'Completed At',
        ];
        const csvContent = [
            headers.join(','),
            ...goals.map((goal) =>
                [
                    `"${goal.title}"`,
                    `"${goal.description}"`,
                    goal.category,
                    goal.type,
                    goal.target,
                    goal.current,
                    goal.unit,
                    goal.isCompleted,
                    goal.createdAt,
                    goal.completedAt || '',
                ].join(','),
            ),
        ].join('\n');

        return csvContent;
    },

    syncWithDatabase: async () => {
        try {
            const savedGoals = await databaseService.getGoals();
            set({ goals: savedGoals });
        } catch (error) {
            console.error('Failed to sync with database:', error);
            set({ error: error instanceof Error ? error.message : 'Failed to sync with database' });
        }
    },
}));
