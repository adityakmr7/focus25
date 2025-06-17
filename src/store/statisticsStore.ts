import { create } from 'zustand';
import { statisticsService, sessionService } from '../services/database';
import { Database } from '../types/database.types';

type Tables = Database['public']['Tables'];

interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
  }[];
}
interface Flow  {
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
  // Statics data
  totalCount: number,
  flows:Flow
  breaks: Break
  interruptions: number,
}

interface StatisticsState extends Statistics {
  isLoading: boolean;
  error: string | null;
  loadStatistics: (userId: string) => Promise<void>;
  updateStatistics: (userId: string, sessionType: 'focus' | 'break') => Promise<void>;
  setSelectedPeriod: (period: 'day' | 'week' | 'month') => void;
  setCurrentDate: (date: Date) => void;
  incrementFlowStarted: () => void;
  incrementFlowCompleted: (minutes: number) => void;
  incrementBreakStarted: () => void;
  incrementBreakCompleted: (minutes: number) => void;
  incrementInterruptions: () => void;
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
  // Initial state
  ...initialStatistics,
  isLoading: false,
  error: null,
  
  incrementFlowStarted: () => set((state) => ({
    flows: {
      ...state.flows,
      started: state.flows.started + 1
    },
    totalCount: state.totalCount + 1
  })),

  incrementFlowCompleted: (minutes: number) => set((state) => ({
    flows: {
      ...state.flows,
      completed: state.flows.completed + 1,
      minutes: state.flows.minutes + minutes
    }
  })),

  incrementBreakStarted: () => set((state) => ({
    breaks: {
      ...state.breaks,
      started: state.breaks.started + 1
    }
  })),

  incrementBreakCompleted: (minutes: number) => set((state) => ({
    breaks: {
      ...state.breaks,
      completed: state.breaks.completed + 1,
      minutes: state.breaks.minutes + minutes
    }
  })),

  incrementInterruptions: () => set((state) => ({
    interruptions: state.interruptions + 1
  })),

  // Actions
  loadStatistics: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const { currentDate, selectedPeriod } = get();

      // Calculate date range based on selected period
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);
      
      switch (selectedPeriod) {
        case 'day':
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - startDate.getDay());
          endDate.setDate(startDate.getDate() + 6);
          break;
        case 'month':
          startDate.setDate(1);
          endDate.setMonth(endDate.getMonth() + 1);
          endDate.setDate(0);
          break;
      }

      // Get statistics for the date range
      const statistics = await statisticsService.getStatistics(
        userId,
        startDate.toISOString().split('T')[0]
      );

      // Get sessions for the date range
      const sessions = await sessionService.getSessions(
        userId,
        startDate.toISOString(),
        endDate.toISOString()
      );

      // Calculate totals
      const totals = sessions.reduce(
        (acc, session) => {
          if (session.session_type === 'focus') {
            acc.totalFlows++;
            if (session.completed_at) {
              acc.completedFlows++;
            } else {
              acc.startedFlows++;
            }
          }
          return acc;
        },
        { totalFlows: 0, startedFlows: 0, completedFlows: 0 }
      );

      // Prepare chart data
      const chartData: ChartData = {
        labels: [],
        datasets: [{ data: [] }],
      };

      if (selectedPeriod === 'day') {
        // Group by hour
        const hourlyData = new Array(24).fill(0);
        sessions.forEach((session) => {
          if (session.session_type === 'focus') {
            const hour = new Date(session.completed_at).getHours();
            hourlyData[hour]++;
          }
        });
        chartData.labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        chartData.datasets[0].data = hourlyData;
      } else {
        // Group by day
        const dailyData = new Map<string, number>();
        sessions.forEach((session) => {
          if (session.session_type === 'focus') {
            const date = new Date(session.completed_at).toISOString().split('T')[0];
            dailyData.set(date, (dailyData.get(date) || 0) + 1);
          }
        });
        chartData.labels = Array.from(dailyData.keys());
        chartData.datasets[0].data = Array.from(dailyData.values());
      }

      set({
        ...totals,
        chartData,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load statistics' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateStatistics: async (userId: string, sessionType: 'focus' | 'break') => {
    try {
      set({ isLoading: true, error: null });
      const { currentDate } = get();

      // Create new session
      await sessionService.createSession({
        user_id: userId,
        duration: 25 * 60, // 25 minutes in seconds
        session_type: sessionType,
        completed_at: new Date().toISOString(),
      });

      // Update statistics
      const date = currentDate.toISOString().split('T')[0];
      const currentStats = await statisticsService.getStatistics(userId, date);

      const updates: Partial<Tables['statistics']['Update']> = {
        total_focus_time: (currentStats?.total_focus_time || 0) + 25 * 60,
        total_sessions: (currentStats?.total_sessions || 0) + 1,
        total_breaks: currentStats?.total_breaks || 0,
      };

      if (sessionType === 'break') {
        updates.total_breaks = (currentStats?.total_breaks || 0) + 1;
      }

      await statisticsService.updateStatistics(userId, date, updates);

      // Reload statistics to update the UI
      await get().loadStatistics(userId);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update statistics' });
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedPeriod: (period: 'day' | 'week' | 'month') => {
    set({ selectedPeriod: period });
  },

  setCurrentDate: (date: Date) => {
    set({ currentDate: date });
  },
})); 