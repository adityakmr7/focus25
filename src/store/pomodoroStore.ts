import { create } from 'zustand';
import { useSettingsStore } from './settingsStore';
import { useStatisticsStore } from './statisticsStore';
import * as Notifications from 'expo-notifications';

interface TimerState {
    minutes: number;
    seconds: number;
    isRunning: boolean;
    isPaused: boolean;
    totalSeconds: number;
    initialSeconds: number;
    currentSession: number;
    totalSessions: number;
    isBreak: boolean;
}

interface PomodoroState {
    workDuration: number;
    breakDuration: number;
    timer: TimerState;
    setWorkDuration: (duration: number) => void;
    setBreakDuration: (duration: number) => void;
    setTimer: (timer: Partial<TimerState>) => void;
    toggleTimer: () => void;
    resetTimer: () => void;
    stopTimer: () => void;
    handleTimerComplete: () => void;
    updateTimerFromSettings: () => void;
    startBreak: () => void;
    endBreak: () => void;
}

const getInitialTimerState = (duration: number): TimerState => ({
    minutes: duration,
    seconds: 0,
    isRunning: false,
    isPaused: false,
    totalSeconds: duration * 60,
    initialSeconds: duration * 60,
    currentSession: 1,
    totalSessions: 4,
    isBreak: false,
});

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
    workDuration: 1,
    breakDuration: 1,
    timer: getInitialTimerState(25),

    setWorkDuration: (duration) => set((state) => ({
        workDuration: duration,
        timer: {
            ...state.timer,
            minutes: duration,
            seconds: 0,
            totalSeconds: duration * 60,
            initialSeconds: duration * 60,
        }
    })),

    setBreakDuration: (duration) => set({ breakDuration: duration }),

    setTimer: (timerUpdate) => set((state) => ({
        timer: { ...state.timer, ...timerUpdate }
    })),

    toggleTimer: () => {
        const state = get();
        const statistics = useStatisticsStore.getState();
        
        if (!state.timer.isRunning) {
            // Starting a new session
            statistics.incrementFlowStarted();
        } else if (state.timer.isPaused) {
            // Resuming from pause
            statistics.incrementInterruptions();
        }
        
        set((state) => ({
            timer: {
                ...state.timer,
                isRunning: !state.timer.isRunning,
                isPaused: state.timer.isRunning ? !state.timer.isPaused : false,
            }
        }));
    },

    resetTimer: () => set((state) => ({
        timer: {
            ...state.timer,
            minutes: Math.floor(state.timer.initialSeconds / 60),
            seconds: state.timer.initialSeconds % 60,
            isRunning: false,
            isPaused: false,
            totalSeconds: state.timer.initialSeconds,
        }
    })),

    stopTimer: () => set((state) => ({
        timer: {
            ...state.timer,
            isRunning: false,
            isPaused: false,
        }
    })),

    startBreak: () => {
        const settings = useSettingsStore.getState();
        const statistics = useStatisticsStore.getState();
        
        statistics.incrementBreakStarted();
        
        set((state) => ({
            timer: {
                ...state.timer,
                isBreak: true,
                isRunning: false,
                isPaused: false,
                totalSeconds: settings.breakDuration * 60,
                initialSeconds: settings.breakDuration * 60,
                minutes: settings.breakDuration,
                seconds: 0,
            }
        }));
    },

    endBreak: () => {
        const settings = useSettingsStore.getState();
        const statistics = useStatisticsStore.getState();
        
        statistics.incrementBreakCompleted(settings.breakDuration);
        
        set((state) => ({
            timer: {
                ...state.timer,
                isBreak: false,
                isRunning: false,
                isPaused: false,
                totalSeconds: settings.timeDuration * 60,
                initialSeconds: settings.timeDuration * 60,
                minutes: settings.timeDuration,
                seconds: 0,
            }
        }));
    },

    handleTimerComplete: () => {
        const state = get();
        const settings = useSettingsStore.getState();
        const statistics = useStatisticsStore.getState();

        if (!state.timer.isBreak) {
            // Flow session completed
            const minutes = Math.floor(state.timer.initialSeconds / 60);
            statistics.incrementFlowCompleted(minutes);

            // Trigger notification if enabled
            if (settings.notifications) {
                Notifications.scheduleNotificationAsync({
                    content: {
                        title: "Flow Session Complete! 🎉",
                        body: "Time for a break!",
                        sound: true,
                    },
                    trigger: null,
                });
            }

            // Start break if auto break is enabled
            if (settings.autoBreak) {
                get().startBreak();
                return;
            }
        } else {
            // Break completed
            if (settings.notifications) {
                Notifications.scheduleNotificationAsync({
                    content: {
                        title: "Break Complete!",
                        body: "Ready for your next flow session?",
                        sound: true,
                    },
                    trigger: null,
                });
            }
            get().endBreak();
            return;
        }

        // Handle session completion
        if (state.timer.currentSession < state.timer.totalSessions) {
            set((state) => ({
                timer: {
                    ...state.timer,
                    currentSession: state.timer.currentSession + 1,
                    isRunning: false,
                    isPaused: false,
                    totalSeconds: state.timer.initialSeconds,
                    minutes: Math.floor(state.timer.initialSeconds / 60),
                    seconds: state.timer.initialSeconds % 60,
                }
            }));
        } else {
            set((state) => ({
                timer: {
                    ...state.timer,
                    currentSession: 1,
                    isRunning: false,
                    isPaused: false,
                    totalSeconds: state.timer.initialSeconds,
                    minutes: Math.floor(state.timer.initialSeconds / 60),
                    seconds: state.timer.initialSeconds % 60,
                }
            }));
        }
    },

    updateTimerFromSettings: () => {
        const settings = useSettingsStore.getState();
        set((state) => ({
            workDuration: settings.timeDuration,
            breakDuration: settings.breakDuration,
            timer: getInitialTimerState(settings.timeDuration)
        }));
    },
}));
