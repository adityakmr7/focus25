import { create } from 'zustand';
import { databaseService } from '../data/database';

interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
  }[];
}

interface Flow {
  started: number;
  completed: number;
  minutes: number;
}

interface Break {
  started: number;
  completed: number;
  minutes: number;
}

interface Statistics {
  totalFlows: number;
  startedFlows: number;
  completedFlows: number;
  currentDate: Date;
  selectedPeriod: 'day' | 'week' | 'month';
  chartData: ChartData;
  totalCount: number;
  flows: Flow;
  breaks: Break;
  interruptions: number;
}

interface StatisticsState extends Statistics {
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  initializeStore: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  setSelectedPeriod: (period: 'day' | 'week' | 'month') => void;
  setCurrentDate: (date: Date) => void;
  incrementFlowStarted: () => Promise<void>;
  incrementFlowCompleted: (minutes: number) => Promise<void>;
  incrementBreakStarted: () => Promise<void>;
  incrementBreakCompleted: (minutes: number) => Promise<void>;
  incrementInterruptions: () => Promise<void>;
  syncWithDatabase: () => Promise<void>;
  exportStatistics: () => Promise<string>;
}

const initialStatistics: Statistics = {
  totalFlows: 0,
  startedFlows: 0,
  completedFlows: 0,
  currentDate: new Date(),
  selectedPeriod: 'day',
  chartData: {
    labels: [],
    datasets: [{ data: [] }],
  },
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

export const useStatisticsStore = create<StatisticsState>((set, get) => ({
  ...initialStatistics,
  isLoading: false,
  error: null,
  isInitialized: false,

  initializeStore: async () => {
    if (get().isInitialized) return;

    try {
      set({ isLoading: true, error: null });
      await get().loadStatistics();
      set({ isInitialized: true, isLoading: false });
    } catch (error) {
      console.error('Failed to initialize statistics store:', error);
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to initialize statistics',
        isLoading: false,
      });
    }
  },

  loadStatistics: async () => {
    try {
      set({ isLoading: true, error: null });

      const today = new Date().toISOString().split('T')[0];
      const stats = await databaseService.getStatistics(today);
      set(state => ({
        ...state,
        totalCount: stats.totalCount,
        flows: stats.flows,
        breaks: stats.breaks,
        interruptions: stats.interruptions,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to load statistics:', error);
      set({
        error:
          error instanceof Error ? error.message : 'Failed to load statistics',
        isLoading: false,
      });
    }
  },

  incrementFlowStarted: async () => {
    try {
      const state = get();
      const newFlows = {
        ...state.flows,
        started: state.flows.started + 1,
      };

      const newStats = {
        ...state,
        flows: newFlows,
        totalCount: state.totalCount + 1,
        date: new Date().toISOString().split('T')[0],
      };

      await databaseService.saveStatistics(newStats);

      set(state => ({
        flows: newFlows,
        totalCount: state.totalCount + 1,
      }));
    } catch (error) {
      console.error('Failed to increment flow started:', error);
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update statistics',
      });
    }
  },

  incrementFlowCompleted: async (minutes: number) => {
    try {
      const state = get();
      const newFlows = {
        ...state.flows,
        completed: state.flows.completed + 1,
        minutes: state.flows.minutes + minutes,
      };

      const newStats = {
        ...state,
        flows: newFlows,
        date: new Date().toISOString().split('T')[0],
      };

      await databaseService.saveStatistics(newStats);

      set({ flows: newFlows });
    } catch (error) {
      console.error('Failed to increment flow completed:', error);
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update statistics',
      });
    }
  },

  incrementBreakStarted: async () => {
    try {
      const state = get();
      const newBreaks = {
        ...state.breaks,
        started: state.breaks.started + 1,
      };

      const newStats = {
        ...state,
        breaks: newBreaks,
        date: new Date().toISOString().split('T')[0],
      };

      await databaseService.saveStatistics(newStats);

      set({ breaks: newBreaks });
    } catch (error) {
      console.error('Failed to increment break started:', error);
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update statistics',
      });
    }
  },

  incrementBreakCompleted: async (minutes: number) => {
    try {
      const state = get();
      const newBreaks = {
        ...state.breaks,
        completed: state.breaks.completed + 1,
        minutes: state.breaks.minutes + minutes,
      };

      const newStats = {
        ...state,
        breaks: newBreaks,
        date: new Date().toISOString().split('T')[0],
      };

      await databaseService.saveStatistics(newStats);

      set({ breaks: newBreaks });
    } catch (error) {
      console.error('Failed to increment break completed:', error);
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update statistics',
      });
    }
  },

  incrementInterruptions: async () => {
    try {
      const state = get();
      const newInterruptions = state.interruptions + 1;

      const newStats = {
        ...state,
        interruptions: newInterruptions,
        date: new Date().toISOString().split('T')[0],
      };

      await databaseService.saveStatistics(newStats);

      set({ interruptions: newInterruptions });
    } catch (error) {
      console.error('Failed to increment interruptions:', error);
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update statistics',
      });
    }
  },

  setSelectedPeriod: (period: 'day' | 'week' | 'month') => {
    set({ selectedPeriod: period });
  },

  setCurrentDate: (date: Date) => {
    set({ currentDate: date });
  },

  syncWithDatabase: async () => {
    try {
      await get().loadStatistics();
    } catch (error) {
      console.error('Failed to sync with database:', error);
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to sync with database',
      });
    }
  },

  exportStatistics: async () => {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12); // Last 12 months
      const endDate = new Date();

      const statisticsRange = await databaseService.getStatisticsRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      return JSON.stringify(
        {
          statistics: statisticsRange,
          exportedAt: new Date().toISOString(),
          version: '1.0',
        },
        null,
        2
      );
    } catch (error) {
      console.error('Failed to export statistics:', error);
      throw error;
    }
  },
}));
