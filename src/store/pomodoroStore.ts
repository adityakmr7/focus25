import { create } from 'zustand';
import { useSettingsStore } from './settingsStore';

interface TimerState {
    minutes: number;
    seconds: number;
    isRunning: boolean;
    isPaused: boolean;
    totalSeconds: number;
    initialSeconds: number;
    currentSession: number;
    totalSessions: number;
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
});

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
    workDuration: 25,
    breakDuration: 5,
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
    
    toggleTimer: () => set((state) => ({
        timer: {
            ...state.timer,
            isRunning: !state.timer.isRunning,
            isPaused: state.timer.isRunning ? !state.timer.isPaused : false,
        }
    })),
    
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
    
    handleTimerComplete: () => {
        const state = get();
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
        const settings = useSettingsStore.getState().settings;
        set((state) => ({
            workDuration: settings.timeDuration,
            timer: getInitialTimerState(settings.timeDuration)
        }));
    },
})); 