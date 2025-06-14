import { create } from 'zustand';

interface ChartData {
    hour: number;
    value: number;
}

interface StatisticsState {
    selectedPeriod: string;
    currentDate: Date;
    chartData: ChartData[];
    totalFlows: number;
    startedFlows: number;
    completedFlows: number;
    setSelectedPeriod: (period: string) => void;
    setCurrentDate: (date: Date) => void;
    updateChartData: (data: ChartData[]) => void;
    updateFlowCounts: (started: number, completed: number) => void;
    navigateDate: (direction: number) => void;
}

export const useStatisticsStore = create<StatisticsState>((set) => ({
    selectedPeriod: 'D',
    currentDate: new Date(),
    chartData: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        value: Math.random() * 60 + 10,
    })),
    totalFlows: 0,
    startedFlows: 2,
    completedFlows: 0,

    setSelectedPeriod: (period) => set({ selectedPeriod: period }),
    
    setCurrentDate: (date) => set({ currentDate: date }),
    
    updateChartData: (data) => set({ chartData: data }),
    
    updateFlowCounts: (started, completed) => set({
        startedFlows: started,
        completedFlows: completed,
        totalFlows: started + completed,
    }),

    navigateDate: (direction) => set((state) => {
        const newDate = new Date(state.currentDate);
        if (state.selectedPeriod === 'D') {
            newDate.setDate(newDate.getDate() + direction);
        } else if (state.selectedPeriod === 'W') {
            newDate.setDate(newDate.getDate() + (direction * 7));
        } else if (state.selectedPeriod === 'M') {
            newDate.setMonth(newDate.getMonth() + direction);
        } else if (state.selectedPeriod === 'Y') {
            newDate.setFullYear(newDate.getFullYear() + direction);
        }
        return { currentDate: newDate };
    }),
})); 