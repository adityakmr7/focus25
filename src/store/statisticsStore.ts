import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { statisticsStorage, createMMKVStorage, DataExportService } from '../services/storage';

/**
 * Chart Data Interface
 * 
 * Structure for chart visualization data
 */
interface ChartData {
  labels: string[];                 // X-axis labels (time periods)
  datasets: {
    data: number[];                // Y-axis data points
  }[];
}

/**
 * Flow Statistics Interface
 * 
 * Tracks focus session statistics
 */
interface Flow {
  started: number;                  // Number of sessions started
  completed: number;                // Number of sessions completed
  minutes: number;                  // Total minutes focused
}

/**
 * Break Statistics Interface
 * 
 * Tracks break session statistics
 */
interface Break {
  started: number;                  // Number of breaks started
  completed: number;                // Number of breaks completed
  minutes: number;                  // Total minutes on break
}

/**
 * Core Statistics Interface
 * 
 * Main statistics data structure
 */
interface Statistics {
  // Legacy fields (maintained for compatibility)
  totalFlows: number;               // Total flow sessions ever
  startedFlows: number;             // Total started sessions
  completedFlows: number;           // Total completed sessions
  
  // Current view settings
  currentDate: Date;                // Currently selected date
  selectedPeriod: 'day' | 'week' | 'month'; // Current time period view
  chartData: ChartData;             // Chart visualization data
  
  // Current period statistics
  totalCount: number;               // Total events in current period
  flows: Flow;                      // Flow session stats
  breaks: Break;                    // Break session stats
  interruptions: number;            // Number of interruptions/distractions
}

/**
 * Statistics Store State Interface
 * 
 * Manages all statistics-related state and operations
 */
interface StatisticsState extends Statistics {
  // Loading and Error States
  isLoading: boolean;               // Indicates if data is being loaded
  error: string | null;             // Error message if operations fail
  
  // View Control Actions
  setSelectedPeriod: (period: 'day' | 'week' | 'month') => void; // Change time period
  setCurrentDate: (date: Date) => void;                          // Change selected date
  
  // Statistics Update Actions
  incrementFlowStarted: () => void;                              // Record flow session start
  incrementFlowCompleted: (minutes: number) => void;            // Record flow completion
  incrementBreakStarted: () => void;                            // Record break start
  incrementBreakCompleted: (minutes: number) => void;           // Record break completion
  incrementInterruptions: () => void;                           // Record interruption
  
  // Data Management Actions
  resetStatistics: () => void;                                  // Clear all statistics
  exportStatistics: () => string;                              // Export as JSON
  exportStatisticsCSV: () => string;                           // Export as CSV
  importStatistics: (data: string) => boolean;                 // Import from JSON
  getStorageInfo: () => { size: number; totalSessions: number }; // Get storage info
  
  // Analytics Actions
  getProductivityScore: () => number;                           // Calculate productivity score
  getWeeklyTrend: () => 'up' | 'down' | 'stable';             // Get weekly trend
  getBestPerformanceDay: () => string;                         // Get best day of week
}

/**
 * Initial Statistics State
 * 
 * Default values when app is first installed
 */
const initialStatistics: Statistics = {
  // Legacy compatibility
  totalFlows: 0,
  startedFlows: 0,
  completedFlows: 0,
  
  // View settings
  currentDate: new Date(),
  selectedPeriod: 'day',
  chartData: {
    labels: [],
    datasets: [{ data: [] }],
  },
  
  // Current period stats
  totalCount: 0,
  flows: {
    started: 0,
    completed: 0,
    minutes: 0,
  },
  breaks: {
    started: 0,
    completed: 0,
    minutes: 0,
  },
  interruptions: 0,
};

/**
 * Utility Functions
 */

/**
 * Calculate productivity score based on completion rate and focus time
 */
const calculateProductivityScore = (flows: Flow, interruptions: number): number => {
  try {
    if (flows.started === 0) return 0;
    
    // Base score from completion rate (0-70 points)
    const completionRate = flows.completed / flows.started;
    const completionScore = completionRate * 70;
    
    // Bonus points for focus time (0-20 points)
    const focusTimeScore = Math.min(flows.minutes / 120, 1) * 20; // Max at 2 hours
    
    // Penalty for interruptions (0-10 points deducted)
    const interruptionPenalty = Math.min(interruptions * 2, 10);
    
    const totalScore = Math.max(0, completionScore + focusTimeScore - interruptionPenalty);
    return Math.round(totalScore);
  } catch (error) {
    console.error('Error calculating productivity score:', error);
    return 0;
  }
};

/**
 * Generate mock chart data for visualization
 * In a real app, this would come from historical data
 */
const generateChartData = (period: 'day' | 'week' | 'month', flows: Flow): ChartData => {
  try {
    switch (period) {
      case 'day':
        // Hourly data for the day
        return {
          labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'],
          datasets: [{ data: [2, 5, 8, 6, 4, 1] }], // Mock hourly distribution
        };
        
      case 'week':
        // Daily data for the week
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{ data: [12, 18, 15, 22, 19, 8, 5] }], // Mock daily sessions
        };
        
      case 'month':
        // Weekly data for the month
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [{ data: [45, 52, 38, 61] }], // Mock weekly totals
        };
        
      default:
        return { labels: [], datasets: [{ data: [] }] };
    }
  } catch (error) {
    console.error('Error generating chart data:', error);
    return { labels: [], datasets: [{ data: [] }] };
  }
};

/**
 * Statistics Store Implementation
 * 
 * Uses Zustand with MMKV persistence for fast data access
 */
export const useStatisticsStore = create<StatisticsState>()(
  persist(
    (set, get) => ({
      // Initialize with default statistics
      ...initialStatistics,
      isLoading: false,
      error: null,

      /**
       * Increment Flow Started
       * 
       * Records when a user starts a focus session
       */
      incrementFlowStarted: () => {
        try {
          set((state) => ({
            flows: {
              ...state.flows,
              started: state.flows.started + 1
            },
            totalCount: state.totalCount + 1,
            startedFlows: state.startedFlows + 1, // Legacy compatibility
            error: null,
          }));
          console.log('Flow session started recorded');
        } catch (error) {
          console.error('Error incrementing flow started:', error);
          set({ error: 'Failed to record session start' });
        }
      },

      /**
       * Increment Flow Completed
       * 
       * Records when a user completes a focus session
       */
      incrementFlowCompleted: (minutes: number) => {
        try {
          set((state) => {
            const newState = {
              flows: {
                ...state.flows,
                completed: state.flows.completed + 1,
                minutes: state.flows.minutes + minutes
              },
              completedFlows: state.completedFlows + 1, // Legacy compatibility
              totalFlows: state.totalFlows + 1,         // Legacy compatibility
              error: null,
            };
            
            // Update chart data based on new statistics
            newState.chartData = generateChartData(state.selectedPeriod, newState.flows);
            
            return newState;
          });
          console.log(`Flow session completed: ${minutes} minutes`);
        } catch (error) {
          console.error('Error incrementing flow completed:', error);
          set({ error: 'Failed to record session completion' });
        }
      },

      /**
       * Increment Break Started
       * 
       * Records when a user starts a break
       */
      incrementBreakStarted: () => {
        try {
          set((state) => ({
            breaks: {
              ...state.breaks,
              started: state.breaks.started + 1
            },
            error: null,
          }));
          console.log('Break started recorded');
        } catch (error) {
          console.error('Error incrementing break started:', error);
          set({ error: 'Failed to record break start' });
        }
      },

      /**
       * Increment Break Completed
       * 
       * Records when a user completes a break
       */
      incrementBreakCompleted: (minutes: number) => {
        try {
          set((state) => ({
            breaks: {
              ...state.breaks,
              completed: state.breaks.completed + 1,
              minutes: state.breaks.minutes + minutes
            },
            error: null,
          }));
          console.log(`Break completed: ${minutes} minutes`);
        } catch (error) {
          console.error('Error incrementing break completed:', error);
          set({ error: 'Failed to record break completion' });
        }
      },

      /**
       * Increment Interruptions
       * 
       * Records when a user is interrupted or distracted
       */
      incrementInterruptions: () => {
        try {
          set((state) => ({
            interruptions: state.interruptions + 1,
            error: null,
          }));
          console.log('Interruption recorded');
        } catch (error) {
          console.error('Error incrementing interruptions:', error);
          set({ error: 'Failed to record interruption' });
        }
      },

      /**
       * Set Selected Period
       * 
       * Changes the time period for statistics view
       */
      setSelectedPeriod: (period: 'day' | 'week' | 'month') => {
        try {
          set((state) => ({
            selectedPeriod: period,
            chartData: generateChartData(period, state.flows),
            error: null,
          }));
          console.log(`Statistics period changed to: ${period}`);
        } catch (error) {
          console.error('Error setting selected period:', error);
          set({ error: 'Failed to change time period' });
        }
      },

      /**
       * Set Current Date
       * 
       * Changes the selected date for statistics view
       */
      setCurrentDate: (date: Date) => {
        try {
          set({ 
            currentDate: date,
            error: null,
          });
          console.log(`Statistics date changed to: ${date.toDateString()}`);
        } catch (error) {
          console.error('Error setting current date:', error);
          set({ error: 'Failed to change date' });
        }
      },

      /**
       * Reset Statistics
       * 
       * Clears all statistics data
       */
      resetStatistics: () => {
        try {
          set({
            ...initialStatistics,
            currentDate: new Date(), // Keep current date
            error: null,
          });
          console.log('All statistics reset');
        } catch (error) {
          console.error('Error resetting statistics:', error);
          set({ error: 'Failed to reset statistics' });
        }
      },

      /**
       * Export Statistics
       * 
       * Creates a JSON export of all statistics data
       */
      exportStatistics: () => {
        try {
          const state = get();
          const exportData = {
            statistics: {
              flows: state.flows,
              breaks: state.breaks,
              interruptions: state.interruptions,
              totalFlows: state.totalFlows,
              completedFlows: state.completedFlows,
              startedFlows: state.startedFlows,
            },
            metadata: {
              exportDate: new Date().toISOString(),
              selectedPeriod: state.selectedPeriod,
              currentDate: state.currentDate.toISOString(),
              version: '1.0.0',
            },
          };
          
          return JSON.stringify(exportData, null, 2);
        } catch (error) {
          console.error('Error exporting statistics:', error);
          set({ error: 'Failed to export statistics' });
          return '{}';
        }
      },

      /**
       * Export Statistics as CSV
       * 
       * Creates a CSV export of statistics data
       */
      exportStatisticsCSV: () => {
        try {
          const state = get();
          const csvRows = [
            'Metric,Value,Unit',
            `Flow Sessions Started,${state.flows.started},sessions`,
            `Flow Sessions Completed,${state.flows.completed},sessions`,
            `Total Focus Time,${state.flows.minutes},minutes`,
            `Breaks Started,${state.breaks.started},breaks`,
            `Breaks Completed,${state.breaks.completed},breaks`,
            `Total Break Time,${state.breaks.minutes},minutes`,
            `Interruptions,${state.interruptions},count`,
            `Productivity Score,${get().getProductivityScore()},score`,
          ];
          
          return csvRows.join('\n');
        } catch (error) {
          console.error('Error exporting statistics as CSV:', error);
          set({ error: 'Failed to export statistics as CSV' });
          return '';
        }
      },

      /**
       * Import Statistics
       * 
       * Imports statistics from a JSON string
       */
      importStatistics: (data: string) => {
        try {
          const importedData = JSON.parse(data);
          
          if (!importedData.statistics) {
            throw new Error('Invalid data format: missing statistics');
          }
          
          const stats = importedData.statistics;
          
          // Validate and import statistics
          const updates: Partial<Statistics> = {};
          
          if (stats.flows && typeof stats.flows === 'object') {
            updates.flows = {
              started: Number(stats.flows.started) || 0,
              completed: Number(stats.flows.completed) || 0,
              minutes: Number(stats.flows.minutes) || 0,
            };
          }
          
          if (stats.breaks && typeof stats.breaks === 'object') {
            updates.breaks = {
              started: Number(stats.breaks.started) || 0,
              completed: Number(stats.breaks.completed) || 0,
              minutes: Number(stats.breaks.minutes) || 0,
            };
          }
          
          if (typeof stats.interruptions === 'number') {
            updates.interruptions = stats.interruptions;
          }
          
          // Apply updates
          set((state) => ({
            ...state,
            ...updates,
            error: null,
          }));
          
          console.log('Statistics imported successfully');
          return true;
        } catch (error) {
          console.error('Error importing statistics:', error);
          set({ error: 'Failed to import statistics' });
          return false;
        }
      },

      /**
       * Get Storage Information
       * 
       * Returns information about statistics storage usage
       */
      getStorageInfo: () => {
        try {
          const state = get();
          return {
            size: statisticsStorage.size,
            totalSessions: state.flows.completed + state.breaks.completed,
          };
        } catch (error) {
          console.error('Error getting storage info:', error);
          return { size: 0, totalSessions: 0 };
        }
      },

      /**
       * Get Productivity Score
       * 
       * Calculates a productivity score based on current statistics
       */
      getProductivityScore: () => {
        try {
          const state = get();
          return calculateProductivityScore(state.flows, state.interruptions);
        } catch (error) {
          console.error('Error calculating productivity score:', error);
          return 0;
        }
      },

      /**
       * Get Weekly Trend
       * 
       * Analyzes weekly performance trend (mock implementation)
       */
      getWeeklyTrend: () => {
        try {
          const state = get();
          // Mock trend calculation based on completion rate
          const completionRate = state.flows.started > 0 ? state.flows.completed / state.flows.started : 0;
          
          if (completionRate > 0.8) return 'up';
          if (completionRate < 0.5) return 'down';
          return 'stable';
        } catch (error) {
          console.error('Error calculating weekly trend:', error);
          return 'stable';
        }
      },

      /**
       * Get Best Performance Day
       * 
       * Returns the day of week with best performance (mock implementation)
       */
      getBestPerformanceDay: () => {
        try {
          // Mock implementation - in real app, this would analyze historical data
          const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          const randomIndex = Math.floor(Math.random() * days.length);
          return days[randomIndex];
        } catch (error) {
          console.error('Error getting best performance day:', error);
          return 'Monday';
        }
      },
    }),
    {
      name: 'statistics-storage',                               // Storage key name
      storage: createJSONStorage(() => createMMKVStorage(statisticsStorage)), // Use MMKV for persistence
      
      /**
       * Rehydration Handler
       * 
       * Called when the store is loaded from storage on app startup
       */
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('Statistics store rehydrated successfully');
          
          // Update chart data based on current period and flows
          state.chartData = generateChartData(state.selectedPeriod, state.flows);
          
          // Clear any loading states
          state.isLoading = false;
          state.error = null;
          
          console.log(`Loaded statistics: ${state.flows.completed} completed sessions, ${state.flows.minutes} minutes focused`);
        }
      },
    }
  )
);