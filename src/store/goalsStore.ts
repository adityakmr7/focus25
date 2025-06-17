import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { appStorage, createMMKVStorage, DataExportService } from '../services/storage';

/**
 * Goal Types and Categories
 * 
 * Defines the structure and classification of user goals
 */
export type GoalType = 'daily' | 'weekly' | 'monthly';
export type GoalCategory = 'sessions' | 'focus_time' | 'streak' | 'consistency';

/**
 * Goal Interface
 * 
 * Represents a single user goal with all its properties
 */
export interface Goal {
  id: string;                    // Unique identifier
  title: string;                 // User-friendly goal name
  description: string;           // Detailed goal description
  category: GoalCategory;        // Type of goal (sessions, time, etc.)
  type: GoalType;               // Duration scope (daily, weekly, monthly)
  target: number;               // Target value to achieve
  current: number;              // Current progress towards target
  unit: string;                 // Unit of measurement (sessions, minutes, days, %)
  isCompleted: boolean;         // Whether goal has been achieved
  createdAt: string;            // ISO date when goal was created
  completedAt?: string;         // ISO date when goal was completed
  deadline?: string;            // Optional deadline for goal completion
  reward?: string;              // Optional reward description
}

/**
 * Goals Store State Interface
 * 
 * Manages all goal-related state and operations
 */
interface GoalsState {
  // Core Data
  goals: Goal[];                                    // Array of all user goals
  isLoading: boolean;                              // Loading state indicator
  error: string | null;                           // Error message if operations fail
  
  // Goal Management Actions
  createGoal: (goal: Omit<Goal, 'id' | 'current' | 'isCompleted' | 'createdAt'>) => void;
  updateGoalProgress: (goalId: string, progress: number) => void;
  completeGoal: (goalId: string) => void;
  deleteGoal: (goalId: string) => void;
  resetGoals: () => void;
  
  // Goal Query Actions
  getGoalsByType: (type: GoalType) => Goal[];
  getGoalsByCategory: (category: GoalCategory) => Goal[];
  getCompletedGoals: () => Goal[];
  getActiveGoals: () => Goal[];
  
  // Integration Actions
  updateGoalsFromStats: (stats: {
    dailySessions: number;
    dailyFocusTime: number;
    currentStreak: number;
    weeklyConsistency: number;
  }) => void;
  
  // Data Management Actions
  exportGoalsToCSV: () => string;
  exportGoalsToJSON: () => string;
  importGoalsFromJSON: (data: string) => boolean;
  getStorageInfo: () => { size: number; goalCount: number };
}

/**
 * Default Goals Configuration
 * 
 * Pre-configured goals to help users get started with the app
 */
const defaultGoals: Omit<Goal, 'id' | 'current' | 'isCompleted' | 'createdAt'>[] = [
  {
    title: 'Daily Focus Champion',
    description: 'Complete 5 focus sessions today to build a strong daily habit',
    category: 'sessions',
    type: 'daily',
    target: 5,
    unit: 'sessions',
  },
  {
    title: 'Deep Work Master',
    description: 'Focus for 2 hours today to achieve deep work state',
    category: 'focus_time',
    type: 'daily',
    target: 120,
    unit: 'minutes',
  },
  {
    title: 'Weekly Warrior',
    description: 'Maintain a 7-day streak to build consistency',
    category: 'streak',
    type: 'weekly',
    target: 7,
    unit: 'days',
  },
  {
    title: 'Consistency King',
    description: 'Complete sessions 5 days this week for steady progress',
    category: 'consistency',
    type: 'weekly',
    target: 5,
    unit: 'days',
  },
  {
    title: 'Monthly Marathon',
    description: 'Complete 100 sessions this month for ultimate dedication',
    category: 'sessions',
    type: 'monthly',
    target: 100,
    unit: 'sessions',
  },
];

/**
 * Utility Functions
 */

/**
 * Generate a unique ID for new goals
 */
const generateGoalId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

/**
 * Validate goal data structure
 */
const validateGoal = (goal: any): boolean => {
  return (
    typeof goal.title === 'string' &&
    typeof goal.description === 'string' &&
    ['sessions', 'focus_time', 'streak', 'consistency'].includes(goal.category) &&
    ['daily', 'weekly', 'monthly'].includes(goal.type) &&
    typeof goal.target === 'number' &&
    goal.target > 0 &&
    typeof goal.unit === 'string'
  );
};

/**
 * Goals Store Implementation
 * 
 * Uses Zustand with MMKV persistence for fast, reliable storage
 */
export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      // Initial State
      goals: [],
      isLoading: false,
      error: null,

      /**
       * Create a New Goal
       * 
       * Validates input and creates a new goal with generated ID and timestamps
       */
      createGoal: (goalData) => {
        try {
          // Validate the goal data
          if (!validateGoal(goalData)) {
            set({ error: 'Invalid goal data provided' });
            return;
          }

          const newGoal: Goal = {
            ...goalData,
            id: generateGoalId(),
            current: 0,
            isCompleted: false,
            createdAt: new Date().toISOString(),
          };

          set((state) => ({
            goals: [...state.goals, newGoal],
            error: null,
          }));

          console.log(`Created new goal: ${newGoal.title}`);
        } catch (error) {
          console.error('Error creating goal:', error);
          set({ error: 'Failed to create goal' });
        }
      },

      /**
       * Update Goal Progress
       * 
       * Updates the current progress and checks for completion
       */
      updateGoalProgress: (goalId, progress) => {
        try {
          set((state) => ({
            goals: state.goals.map((goal) => {
              if (goal.id === goalId) {
                const newCurrent = Math.min(Math.max(0, progress), goal.target);
                const wasCompleted = goal.isCompleted;
                const isNowCompleted = newCurrent >= goal.target;
                
                return {
                  ...goal,
                  current: newCurrent,
                  isCompleted: isNowCompleted,
                  completedAt: isNowCompleted && !wasCompleted 
                    ? new Date().toISOString() 
                    : goal.completedAt,
                };
              }
              return goal;
            }),
            error: null,
          }));
        } catch (error) {
          console.error('Error updating goal progress:', error);
          set({ error: 'Failed to update goal progress' });
        }
      },

      /**
       * Mark Goal as Complete
       * 
       * Manually completes a goal regardless of current progress
       */
      completeGoal: (goalId) => {
        try {
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
            error: null,
          }));

          console.log(`Manually completed goal: ${goalId}`);
        } catch (error) {
          console.error('Error completing goal:', error);
          set({ error: 'Failed to complete goal' });
        }
      },

      /**
       * Delete a Goal
       * 
       * Removes a goal from the store permanently
       */
      deleteGoal: (goalId) => {
        try {
          set((state) => ({
            goals: state.goals.filter((goal) => goal.id !== goalId),
            error: null,
          }));

          console.log(`Deleted goal: ${goalId}`);
        } catch (error) {
          console.error('Error deleting goal:', error);
          set({ error: 'Failed to delete goal' });
        }
      },

      /**
       * Reset All Goals
       * 
       * Clears all goals and reinitializes with defaults
       */
      resetGoals: () => {
        try {
          set({ 
            goals: [],
            error: null 
          });

          // Recreate default goals
          defaultGoals.forEach((goalData) => {
            get().createGoal(goalData);
          });

          console.log('Reset all goals to defaults');
        } catch (error) {
          console.error('Error resetting goals:', error);
          set({ error: 'Failed to reset goals' });
        }
      },

      /**
       * Query Goals by Type
       * 
       * Returns goals filtered by their type (daily, weekly, monthly)
       */
      getGoalsByType: (type) => {
        try {
          return get().goals.filter((goal) => goal.type === type);
        } catch (error) {
          console.error('Error getting goals by type:', error);
          return [];
        }
      },

      /**
       * Query Goals by Category
       * 
       * Returns goals filtered by their category (sessions, focus_time, etc.)
       */
      getGoalsByCategory: (category) => {
        try {
          return get().goals.filter((goal) => goal.category === category);
        } catch (error) {
          console.error('Error getting goals by category:', error);
          return [];
        }
      },

      /**
       * Get Completed Goals
       * 
       * Returns all goals that have been completed
       */
      getCompletedGoals: () => {
        try {
          return get().goals.filter((goal) => goal.isCompleted);
        } catch (error) {
          console.error('Error getting completed goals:', error);
          return [];
        }
      },

      /**
       * Get Active Goals
       * 
       * Returns all goals that are not yet completed
       */
      getActiveGoals: () => {
        try {
          return get().goals.filter((goal) => !goal.isCompleted);
        } catch (error) {
          console.error('Error getting active goals:', error);
          return [];
        }
      },

      /**
       * Update Goals from Statistics
       * 
       * Automatically updates goal progress based on user's actual usage statistics
       */
      updateGoalsFromStats: (stats) => {
        try {
          const { goals } = get();
          
          goals.forEach((goal) => {
            let newProgress = goal.current;
            
            // Map statistics to goal categories
            switch (goal.category) {
              case 'sessions':
                if (goal.type === 'daily') {
                  newProgress = stats.dailySessions;
                }
                // Note: Weekly and monthly session goals would need additional logic
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
                  // Convert percentage to days (assuming 7-day week)
                  newProgress = Math.round((stats.weeklyConsistency / 100) * 7);
                }
                break;
            }
            
            // Update progress if it has changed
            if (newProgress !== goal.current) {
              get().updateGoalProgress(goal.id, newProgress);
            }
          });
        } catch (error) {
          console.error('Error updating goals from stats:', error);
          set({ error: 'Failed to update goals from statistics' });
        }
      },

      /**
       * Export Goals to CSV
       * 
       * Creates a CSV string containing all goal data
       */
      exportGoalsToCSV: () => {
        try {
          const { goals } = get();
          const headers = [
            'Title', 'Description', 'Category', 'Type', 'Target', 
            'Current', 'Unit', 'Completed', 'Created At', 'Completed At'
          ];
          
          const csvContent = [
            headers.join(','),
            ...goals.map(goal => [
              `"${goal.title.replace(/"/g, '""')}"`,
              `"${goal.description.replace(/"/g, '""')}"`,
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
        } catch (error) {
          console.error('Error exporting goals to CSV:', error);
          set({ error: 'Failed to export goals to CSV' });
          return '';
        }
      },

      /**
       * Export Goals to JSON
       * 
       * Creates a JSON string containing all goal data with metadata
       */
      exportGoalsToJSON: () => {
        try {
          const { goals } = get();
          const exportData = {
            goals,
            exportDate: new Date().toISOString(),
            version: '1.0.0',
            totalGoals: goals.length,
            completedGoals: goals.filter(g => g.isCompleted).length,
          };
          
          return JSON.stringify(exportData, null, 2);
        } catch (error) {
          console.error('Error exporting goals to JSON:', error);
          set({ error: 'Failed to export goals to JSON' });
          return '{}';
        }
      },

      /**
       * Import Goals from JSON
       * 
       * Imports goals from a JSON string, validates and merges with existing goals
       */
      importGoalsFromJSON: (data) => {
        try {
          const importedData = JSON.parse(data);
          
          if (!importedData.goals || !Array.isArray(importedData.goals)) {
            throw new Error('Invalid data format: missing or invalid goals array');
          }
          
          // Validate each goal
          const validGoals = importedData.goals.filter((goal: any) => {
            const isValid = validateGoal(goal) && 
                           typeof goal.id === 'string' &&
                           typeof goal.current === 'number' &&
                           typeof goal.isCompleted === 'boolean' &&
                           typeof goal.createdAt === 'string';
            
            if (!isValid) {
              console.warn('Skipping invalid goal:', goal);
            }
            
            return isValid;
          });
          
          if (validGoals.length === 0) {
            throw new Error('No valid goals found in import data');
          }
          
          // Merge with existing goals (avoid duplicates by ID)
          set((state) => {
            const existingIds = new Set(state.goals.map(g => g.id));
            const newGoals = validGoals.filter((goal: Goal) => !existingIds.has(goal.id));
            
            return {
              goals: [...state.goals, ...newGoals],
              error: null,
            };
          });
          
          console.log(`Imported ${validGoals.length} goals successfully`);
          return true;
        } catch (error) {
          console.error('Error importing goals:', error);
          set({ error: 'Failed to import goals from JSON' });
          return false;
        }
      },

      /**
       * Get Storage Information
       * 
       * Returns information about goals storage usage
       */
      getStorageInfo: () => {
        try {
          const { goals } = get();
          return {
            size: appStorage.size,
            goalCount: goals.length,
          };
        } catch (error) {
          console.error('Error getting storage info:', error);
          return { size: 0, goalCount: 0 };
        }
      },
    }),
    {
      name: 'goals-storage',                                    // Storage key name
      storage: createJSONStorage(() => createMMKVStorage(appStorage)), // Use MMKV for persistence
      
      /**
       * Rehydration Handler
       * 
       * Called when the store is loaded from storage on app startup
       */
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log(`Goals rehydrated: ${state.goals.length} goals loaded`);
          
          // Initialize with default goals if no goals exist
          if (state.goals.length === 0) {
            console.log('No existing goals found, creating default goals');
            defaultGoals.forEach((goalData) => {
              state.createGoal(goalData);
            });
          }
          
          // Clear any loading states
          state.isLoading = false;
          state.error = null;
        }
      },
    }
  )
);