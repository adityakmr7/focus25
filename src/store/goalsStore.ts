import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  
  // Actions
  createGoal: (goal: Omit<Goal, 'id' | 'current' | 'isCompleted' | 'createdAt'>) => void;
  updateGoalProgress: (goalId: string, progress: number) => void;
  completeGoal: (goalId: string) => void;
  deleteGoal: (goalId: string) => void;
  resetGoals: () => void;
  getGoalsByType: (type: GoalType) => Goal[];
  getGoalsByCategory: (category: GoalCategory) => Goal[];
  getCompletedGoals: () => Goal[];
  getActiveGoals: () => Goal[];
  updateGoalsFromStats: (stats: {
    dailySessions: number;
    dailyFocusTime: number;
    currentStreak: number;
    weeklyConsistency: number;
  }) => void;
  exportGoalsToCSV: () => string;
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

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: [],
      isLoading: false,
      error: null,

      createGoal: (goalData) => {
        const newGoal: Goal = {
          ...goalData,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          current: 0,
          isCompleted: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          goals: [...state.goals, newGoal],
        }));
      },

      updateGoalProgress: (goalId, progress) => {
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === goalId
              ? {
                  ...goal,
                  current: Math.min(progress, goal.target),
                  isCompleted: progress >= goal.target,
                  completedAt: progress >= goal.target && !goal.isCompleted 
                    ? new Date().toISOString() 
                    : goal.completedAt,
                }
              : goal
          ),
        }));
      },

      completeGoal: (goalId) => {
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === goalId
              ? {
                  ...goal,
                  current: goal.target,
                  isCompleted: true,
                  completedAt: new Date().toISOString(),
                }
              : goal
          ),
        }));
      },

      deleteGoal: (goalId) => {
        set((state) => ({
          goals: state.goals.filter((goal) => goal.id !== goalId),
        }));
      },

      resetGoals: () => {
        set({ goals: [] });
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

      updateGoalsFromStats: (stats) => {
        const { goals } = get();
        
        goals.forEach((goal) => {
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
            get().updateGoalProgress(goal.id, newProgress);
          }
        });
      },

      exportGoalsToCSV: () => {
        const { goals } = get();
        const headers = ['Title', 'Description', 'Category', 'Type', 'Target', 'Current', 'Unit', 'Completed', 'Created At', 'Completed At'];
        const csvContent = [
          headers.join(','),
          ...goals.map(goal => [
            `"${goal.title}"`,
            `"${goal.description}"`,
            goal.category,
            goal.type,
            goal.target,
            goal.current,
            goal.unit,
            goal.isCompleted,
            goal.createdAt,
            goal.completedAt || ''
          ].join(','))
        ].join('\n');
        
        return csvContent;
      },
    }),
    {
      name: 'goals-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Initialize with default goals if no goals exist
        if (state && state.goals.length === 0) {
          defaultGoals.forEach((goalData) => {
            state.createGoal(goalData);
          });
        }
      },
    }
  )
);