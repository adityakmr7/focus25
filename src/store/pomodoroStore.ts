import { create } from 'zustand';
import { useSettingsStore } from './settingsStore';
import { useStatisticsStore } from './statisticsStore';
import { databaseService } from '../services/database';
import * as Notifications from 'expo-notifications';
import { getCurrentDateString, isNewDay } from '../utils/dateUtils';

// Add new interfaces for flow tracking
interface FlowMetrics {
    consecutiveSessions: number;
    currentStreak: number;
    longestStreak: number;
    flowIntensity: 'low' | 'medium' | 'high';
    distractionCount: number;
    sessionStartTime: number | null;
    totalFocusTime: number; // in minutes
    averageSessionLength: number;
    bestFlowDuration: number;
    lastSessionDate: string | null;
}

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
    adaptedDuration?: number; // For dynamic timer adaptation
}

interface PomodoroState {
    workDuration: number;
    breakDuration: number;
    timer: TimerState;
    flowMetrics: FlowMetrics;
    isInitialized: boolean;

    initializeStore: () => Promise<void>;
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
    // New flow tracking methods
    trackDistraction: () => Promise<void>;
    calculateFlowIntensity: () => void;
    adaptSessionLength: () => number;
    updateFlowMetrics: () => Promise<void>;
    resetDailyMetrics: () => Promise<void>;
    checkAndResetDailyMetrics: () => void;
    syncWithDatabase: () => Promise<void>;
}

// Helper functions
const calculateFlowIntensity = (
    consecutiveSessions: number,
    distractionCount: number,
    averageSessionLength: number,
): 'low' | 'medium' | 'high' => {
    // Calculate distraction ratio
    const distractionRatio = distractionCount / Math.max(consecutiveSessions, 1);

    // Consider session length (longer sessions = better flow)
    const sessionLengthScore = Math.min(averageSessionLength / 25, 2); // Normalized to 25 min base

    // Combine factors
    const flowScore = (1 - distractionRatio) * sessionLengthScore;

    if (flowScore > 1.5) return 'high';
    if (flowScore > 0.8) return 'medium';
    return 'low';
};

const getAdaptiveSessionLength = (
    baseMinutes: number,
    flowIntensity: 'low' | 'medium' | 'high',
    consecutiveSessions: number,
): number => {
    let adaptedLength = baseMinutes;

    // Adjust based on flow intensity
    switch (flowIntensity) {
        case 'high':
            // In deep flow, allow longer sessions but cap at 90 minutes
            adaptedLength = Math.min(baseMinutes + consecutiveSessions * 5, 90);
            break;
        case 'low':
            // Struggling with focus, shorter sessions
            adaptedLength = Math.max(baseMinutes - 5, 15);
            break;
        case 'medium':
        default:
            // Gradual increase for medium flow
            adaptedLength = Math.min(baseMinutes + consecutiveSessions * 2, 60);
            break;
    }

    return adaptedLength;
};

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

const getInitialFlowMetrics = (): FlowMetrics => ({
    consecutiveSessions: 0,
    currentStreak: 0,
    longestStreak: 0,
    flowIntensity: 'medium',
    distractionCount: 0,
    sessionStartTime: null,
    totalFocusTime: 0,
    averageSessionLength: 25,
    bestFlowDuration: 0,
    lastSessionDate: null,
});

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
    workDuration: 1,
    breakDuration: 1,
    timer: getInitialTimerState(25),
    flowMetrics: getInitialFlowMetrics(),
    isInitialized: false,

    initializeStore: async () => {
        if (get().isInitialized) return;

        try {
            const savedMetrics = await databaseService.getFlowMetrics();
            set({
                flowMetrics: savedMetrics,
                isInitialized: true,
            });

            get().checkAndResetDailyMetrics();
        } catch (error) {
            console.error('Failed to initialize pomodoro store:', error);
            set({ isInitialized: true }); // Continue with defaults
        }
    },

    checkAndResetDailyMetrics: () => {
        const state = get();
        if (isNewDay(state.flowMetrics.lastSessionDate)) {
            set((state) => ({
                flowMetrics: {
                    ...state.flowMetrics,
                    consecutiveSessions: 0,
                    distractionCount: 0,
                    sessionStartTime: null,
                    lastSessionDate: getCurrentDateString(),
                },
            }));

            // Save updated metrics to database
            get().syncWithDatabase();
        }
    },

    setWorkDuration: (duration) =>
        set((state) => ({
            workDuration: duration,
            timer: {
                ...state.timer,
                minutes: duration,
                seconds: 0,
                totalSeconds: duration * 60,
                initialSeconds: duration * 60,
            },
        })),

    setBreakDuration: (duration) => set({ breakDuration: duration }),

    setTimer: (timerUpdate) =>
        set((state) => ({
            timer: { ...state.timer, ...timerUpdate },
        })),

    toggleTimer: () => {
        get().checkAndResetDailyMetrics();
        const state = get();
        const statistics = useStatisticsStore.getState();

        if (!state.timer.isRunning) {
            // Starting a new session
            statistics.incrementFlowStarted();
            set((state) => ({
                timer: {
                    ...state.timer,
                    isRunning: true,
                    isPaused: false,
                },
                flowMetrics: {
                    ...state.flowMetrics,
                    sessionStartTime: Date.now(),
                },
            }));
        } else if (state.timer.isPaused) {
            // Resuming from pause - this is a distraction
            get().trackDistraction();
            set((state) => ({
                timer: {
                    ...state.timer,
                    isRunning: true,
                    isPaused: false,
                },
            }));
        } else {
            // Pausing - this is a distraction
            get().trackDistraction();
            set((state) => ({
                timer: {
                    ...state.timer,
                    isRunning: false,
                    isPaused: true,
                },
            }));
        }
    },

    resetTimer: () =>
        set((state) => ({
            timer: {
                ...state.timer,
                minutes: Math.floor(state.timer.initialSeconds / 60),
                seconds: state.timer.initialSeconds % 60,
                isRunning: false,
                isPaused: false,
                totalSeconds: state.timer.initialSeconds,
            },
            flowMetrics: {
                ...state.flowMetrics,
                sessionStartTime: null,
            },
        })),

    stopTimer: () =>
        set((state) => ({
            timer: {
                ...state.timer,
                isRunning: false,
                isPaused: false,
            },
            flowMetrics: {
                ...state.flowMetrics,
                sessionStartTime: null,
            },
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
            },
        }));
    },

    endBreak: () => {
        const settings = useSettingsStore.getState();
        const statistics = useStatisticsStore.getState();

        statistics.incrementBreakCompleted(settings.breakDuration);

        // Get adaptive session length for next work session
        const adaptedLength = get().adaptSessionLength();

        set((state) => ({
            timer: {
                ...state.timer,
                isBreak: false,
                isRunning: false,
                isPaused: false,
                totalSeconds: adaptedLength * 60,
                initialSeconds: adaptedLength * 60,
                minutes: adaptedLength,
                seconds: 0,
                adaptedDuration: adaptedLength,
            },
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
            // Update flow metrics
            get().updateFlowMetrics();
            const updatedState = get();
            const { flowIntensity, consecutiveSessions } = updatedState.flowMetrics;

            // Trigger notification if enabled
            if (settings.notifications) {
                let notificationContent = {
                    title: 'Flow Session Complete! 🎉',
                    body: 'Time for a break!',
                    sound: true,
                };

                // Customize notification based on flow intensity
                if (flowIntensity === 'high' && consecutiveSessions >= 3) {
                    notificationContent = {
                        title: 'Amazing Deep Flow! 🔥',
                        body: `${consecutiveSessions} consecutive sessions! You're unstoppable!`,
                        sound: true,
                    };
                } else if (flowIntensity === 'high') {
                    notificationContent = {
                        title: 'Deep Flow Achieved! 🔥',
                        body: "You're in the zone! Take a well-deserved break.",
                        sound: true,
                    };
                } else if (consecutiveSessions >= 5) {
                    notificationContent = {
                        title: 'Consistency Champion! 🏆',
                        body: `${consecutiveSessions} sessions completed! Keep it up!`,
                        sound: true,
                    };
                }

                Notifications.scheduleNotificationAsync({
                    content: notificationContent,
                    trigger: null,
                });
            }

            // Always start break (user can choose to start it)
            get().startBreak();
        } else {
            // Break completed
            if (settings.notifications) {
                Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'Break Complete!',
                        body: 'Ready for your next flow session?',
                        sound: true,
                    },
                    trigger: null,
                });
            }
            get().endBreak();
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
                },
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
                },
            }));
        }
    },

    updateTimerFromSettings: () => {
        const settings = useSettingsStore.getState();
        set((state) => ({
            workDuration: settings.timeDuration,
            breakDuration: settings.breakDuration,
            timer: getInitialTimerState(settings.timeDuration),
        }));
    },

    // New flow tracking methods
    trackDistraction: async () => {
        try {
            set((state) => ({
                flowMetrics: {
                    ...state.flowMetrics,
                    distractionCount: state.flowMetrics.distractionCount + 1,
                },
            }));

            get().calculateFlowIntensity();
            await get().syncWithDatabase();

            // Also update statistics
            const statistics = useStatisticsStore.getState();
            statistics.incrementInterruptions();
        } catch (error) {
            console.error('Failed to track distraction:', error);
        }
    },

    calculateFlowIntensity: () => {
        const state = get();
        const { consecutiveSessions, distractionCount, averageSessionLength } = state.flowMetrics;

        const intensity = calculateFlowIntensity(
            consecutiveSessions,
            distractionCount,
            averageSessionLength,
        );

        set((state) => ({
            flowMetrics: {
                ...state.flowMetrics,
                flowIntensity: intensity,
            },
        }));
    },

    adaptSessionLength: () => {
        const state = get();
        const settings = useSettingsStore.getState();
        const { flowIntensity, consecutiveSessions } = state.flowMetrics;

        return getAdaptiveSessionLength(settings.timeDuration, flowIntensity, consecutiveSessions);
    },

    updateFlowMetrics: async () => {
        try {
            const state = get();
            const sessionDuration = Math.floor(state.timer.initialSeconds / 60);
            const sessionTime = state.flowMetrics.sessionStartTime
                ? (Date.now() - state.flowMetrics.sessionStartTime) / (1000 * 60)
                : sessionDuration;

            set((state) => ({
                flowMetrics: {
                    ...state.flowMetrics,
                    consecutiveSessions: state.flowMetrics.consecutiveSessions + 1,
                    currentStreak: state.flowMetrics.currentStreak + 1,
                    longestStreak: Math.max(
                        state.flowMetrics.longestStreak,
                        state.flowMetrics.currentStreak + 1,
                    ),
                    totalFocusTime: state.flowMetrics.totalFocusTime + sessionDuration,
                    averageSessionLength:
                        (state.flowMetrics.averageSessionLength + sessionDuration) / 2,
                    bestFlowDuration: Math.max(state.flowMetrics.bestFlowDuration, sessionTime),
                    sessionStartTime: null,
                    distractionCount: 0, // Reset after successful session
                    lastSessionDate: getCurrentDateString(),
                },
            }));

            get().calculateFlowIntensity();
            await get().syncWithDatabase();
        } catch (error) {
            console.error('Failed to update flow metrics:', error);
        }
    },

    resetDailyMetrics: async () => {
        try {
            set((state) => ({
                flowMetrics: {
                    ...state.flowMetrics,
                    consecutiveSessions: 0,
                    distractionCount: 0,
                    sessionStartTime: null,
                    lastSessionDate: getCurrentDateString(),
                },
            }));

            await get().syncWithDatabase();
        } catch (error) {
            console.error('Failed to reset daily metrics:', error);
        }
    },

    syncWithDatabase: async () => {
        try {
            const state = get();
            await databaseService.saveFlowMetrics(state.flowMetrics);
        } catch (error) {
            console.error('Failed to sync flow metrics with database:', error);
        }
    },
}));
