import { notificationService } from '@/services/notification-service';
import { localDatabaseService, Session } from '@/services/local-database-service';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { create } from 'zustand';

// Use the Session interface from local database service
export type PomodoroSession = Session;

export type TimerPhase = 'focus' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

interface PomodoroState {
    // Todo selection
    currentTodoId: string | null;
    currentTodoTitle: string | null;

    // Timer state
    timerStatus: TimerStatus;
    timerPhase: TimerPhase;
    timeLeft: number; // seconds remaining
    initialTime: number; // initial time for current phase
    sessionStartTime: Date | null;

    // Session tracking
    currentSession: number; // 1-4
    totalSessions: number; // Always 4

    // History
    sessions: PomodoroSession[];
    sessionsLoaded: boolean;

    // Actions - Todo
    selectTodo: (todoId: string | null, todoTitle: string | null) => void;
    clearSelection: () => void;

    // Actions - Timer
    startTimer: (
        focusDuration: number,
        breakDuration: number,
        notificationsEnabled?: boolean,
    ) => void;
    pauseTimer: () => void;
    resumeTimer: () => void;
    resetTimer: () => void;
    updateTimerDuration: (focusDuration: number, breakDuration: number) => void;
    tick: (
        soundEnabled: boolean,
        focusDuration?: number,
        breakDuration?: number,
        notificationsEnabled?: boolean,
    ) => void; // Decrements timer by 1 second
    completeTimer: (
        soundEnabled: boolean,
        focusDuration?: number,
        breakDuration?: number,
        notificationsEnabled?: boolean,
    ) => void;
    switchPhase: (phase: TimerPhase, focusDuration: number, breakDuration: number) => void;

    // Actions - Session
    skipSession: (focusDuration: number, breakDuration: number) => void;
    nextSession: (focusDuration: number, breakDuration: number) => void;
    resetSession: () => void;
    switchToBreakPhase: (focusDuration: number, breakDuration: number) => void;
    completeBreak: (focusDuration: number, breakDuration: number) => void;
    loadSessions: () => Promise<void>;

    // Getters
    getTotalTimeForTodo: (todoId: string) => Promise<number>;
    getSessions: () => PomodoroSession[];
}

// Helper function to get timer durations from settings
// This will be called with settings values
export const getTimerDuration = (
    phase: TimerPhase,
    focusDuration: number,
    breakDuration: number,
): number => {
    switch (phase) {
        case 'focus':
            return focusDuration * 60; // Convert minutes to seconds
        case 'shortBreak':
            return breakDuration * 60;
        case 'longBreak':
            return breakDuration * 2 * 60; // Long break is 2x short break
    }
};

// Play completion sound
const playCompletionSound = async (soundEnabled: boolean) => {
    if (!soundEnabled) return;

    let player: AudioPlayer | undefined;
    try {
        // Create audio player with the notification sound
        player = await createAudioPlayer(require('@/assets/sounds/notify-alert.mp3'));

        // Play the sound
        await player.play();

        // Clean up after a short delay (sound is ~2 seconds)
        setTimeout(() => {
            if (player) {
                player.remove();
            }
        }, 3000);
    } catch (error) {
        console.error('Error playing completion sound:', error);
        // Clean up on error
        if (player) {
            try {
                player.remove();
            } catch {
                // Ignore cleanup errors
            }
        }
    }
};

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
    // Initial state - Todo
    currentTodoId: null,
    currentTodoTitle: null,

    // Initial state - Timer (using default 25 min for focus)
    timerStatus: 'idle',
    timerPhase: 'focus',
    timeLeft: 25 * 60,
    initialTime: 25 * 60,
    sessionStartTime: null,
    sessions: [],
    sessionsLoaded: false,

    // Initial state - Session tracking
    currentSession: 1,
    totalSessions: 4,

    // ===== Todo Actions =====
    selectTodo: (todoId, todoTitle) => {
        set({
            currentTodoId: todoId,
            currentTodoTitle: todoTitle,
        });
    },

    clearSelection: () => {
        set({
            currentTodoId: null,
            currentTodoTitle: null,
        });
    },

    // ===== Timer Actions =====
    startTimer: async (
        focusDuration: number,
        breakDuration: number,
        notificationsEnabled?: boolean,
    ) => {
        const { timerPhase, currentSession, currentTodoTitle } = get();
        const duration = getTimerDuration(timerPhase, focusDuration, breakDuration);

        set({
            timerStatus: 'running',
            sessionStartTime: new Date(),
            timeLeft: duration,
            initialTime: duration,
        });

        // Schedule background notification if notifications are enabled
        if (notificationsEnabled) {
            try {
                await notificationService.scheduleTimerNotification({
                    timerPhase,
                    timeLeft: duration,
                    sessionNumber: currentSession,
                    todoTitle: currentTodoTitle || undefined,
                });
            } catch (error) {
                console.error('Failed to schedule timer notification:', error);
            }
        }
    },

    pauseTimer: async () => {
        set({ timerStatus: 'paused' });

        // Cancel scheduled notifications when paused
        try {
            await notificationService.cancelTimerNotifications();
        } catch (error) {
            console.error('Failed to cancel timer notifications:', error);
        }
    },

    resumeTimer: () => {
        set({ timerStatus: 'running' });
    },

    resetTimer: async () => {
        const {
            timerStatus,
            sessionStartTime,
            currentTodoId,
            currentTodoTitle,
            timeLeft,
            initialTime,
        } = get();

        // Log session if timer was running
        if (timerStatus === 'running' || timerStatus === 'paused' || timerStatus === 'completed') {
            const timeSpent = initialTime - timeLeft;
            if (timeSpent > 0 && sessionStartTime) {
                const { timerPhase, currentSession } = get();
                const newSession: PomodoroSession = {
                    id: Date.now().toString(),
                    todoId: currentTodoId || null,
                    todoTitle: currentTodoTitle || null,
                    startTime: sessionStartTime.toISOString(),
                    endTime: new Date().toISOString(),
                    duration: timeSpent,
                    type: timerPhase === 'focus' ? 'focus' : 'break',
                    sessionNumber: currentSession,
                    isCompleted: timerStatus === 'completed',
                    notes: null,
                };

                // Save to local database
                try {
                    await localDatabaseService.createSession(newSession);
                } catch (error) {
                    console.error('Failed to save session to database:', error);
                }

                set({
                    sessions: [...get().sessions, newSession],
                });
            }
        }

        // Cancel any scheduled notifications when resetting
        try {
            await notificationService.cancelTimerNotifications();
        } catch (error) {
            console.error('Failed to cancel timer notifications:', error);
        }

        // Reset timer and session - keep current initialTime
        set({
            timerStatus: 'idle',
            timeLeft: get().initialTime,
            sessionStartTime: null,
            currentSession: 1,
        });
    },

    updateTimerDuration: (focusDuration: number, breakDuration: number) => {
        const { timerPhase, timerStatus } = get();

        // Only update if timer is idle (not running or paused)
        if (timerStatus === 'idle') {
            const duration = getTimerDuration(timerPhase, focusDuration, breakDuration);
            set({
                timeLeft: duration,
                initialTime: duration,
            });
        }
    },

    tick: (
        soundEnabled: boolean,
        focusDuration?: number,
        breakDuration?: number,
        notificationsEnabled?: boolean,
    ) => {
        const { timeLeft, timerStatus, timerPhase } = get();

        if (timerStatus !== 'running') return;

        if (timeLeft <= 1) {
            // Handle completion based on current phase
            if (timerPhase === 'focus') {
                get().completeTimer(
                    soundEnabled,
                    focusDuration,
                    breakDuration,
                    notificationsEnabled,
                );
            } else if (timerPhase === 'shortBreak' || timerPhase === 'longBreak') {
                get().completeBreak(focusDuration || 25, breakDuration || 5);
            }
        } else {
            set({ timeLeft: timeLeft - 1 });
        }
    },

    completeTimer: async (
        soundEnabled: boolean,
        focusDuration?: number,
        breakDuration?: number,
        notificationsEnabled?: boolean,
    ) => {
        const {
            sessionStartTime,
            currentTodoId,
            currentTodoTitle,
            initialTime,
            timerPhase,
            currentSession,
        } = get();

        // Play completion sound
        await playCompletionSound(soundEnabled);

        // Send immediate notification for timer completion if enabled
        if (notificationsEnabled) {
            try {
                await notificationService.sendTimerCompletionNotification(
                    timerPhase,
                    currentSession,
                    currentTodoTitle || undefined,
                );
            } catch (error) {
                console.error('Failed to send timer completion notification:', error);
            }
        }

        if (sessionStartTime) {
            const { timerPhase, currentSession } = get();
            const newSession: PomodoroSession = {
                id: Date.now().toString(),
                todoId: currentTodoId || null,
                todoTitle: currentTodoTitle || null,
                startTime: sessionStartTime.toISOString(),
                endTime: new Date().toISOString(),
                duration: initialTime,
                type: timerPhase === 'focus' ? 'focus' : 'break',
                sessionNumber: currentSession,
                isCompleted: true,
                notes: null,
            };

            // Save to local database
            try {
                await localDatabaseService.createSession(newSession);
            } catch (error) {
                console.error('Failed to save session to database:', error);
            }

            set({
                sessions: [...get().sessions, newSession],
            });
        }

        set({
            timerStatus: 'completed',
            timeLeft: 0,
        });

        // Auto-switch to break phase after a short delay if durations are provided
        if (focusDuration && breakDuration) {
            setTimeout(() => {
                get().switchToBreakPhase(focusDuration, breakDuration);
            }, 2000); // 2 second delay to show completion
        }
    },

    switchPhase: (phase: TimerPhase, focusDuration: number, breakDuration: number) => {
        const duration = getTimerDuration(phase, focusDuration, breakDuration);
        set({
            timerPhase: phase,
            timeLeft: duration,
            initialTime: duration,
            timerStatus: 'idle',
            sessionStartTime: null,
        });
    },

    // ===== Session Actions =====
    skipSession: (focusDuration: number, breakDuration: number) => {
        const { currentSession, totalSessions } = get();

        // Move to next session
        const nextSession = currentSession < totalSessions ? currentSession + 1 : 1;

        set({
            currentSession: nextSession,
            timerStatus: 'idle',
            timerPhase: 'focus',
            timeLeft: focusDuration * 60,
            initialTime: focusDuration * 60,
            sessionStartTime: null,
        });
    },

    nextSession: (focusDuration: number, breakDuration: number) => {
        const { currentSession, totalSessions } = get();

        // Move to next session
        const nextSession = currentSession < totalSessions ? currentSession + 1 : 1;

        set({
            currentSession: nextSession,
            timerStatus: 'idle',
            timerPhase: 'focus',
            timeLeft: focusDuration * 60,
            initialTime: focusDuration * 60,
            sessionStartTime: null,
        });
    },

    resetSession: () => {
        set({
            currentSession: 1,
            timerStatus: 'idle',
            timerPhase: 'focus',
            sessionStartTime: null,
        });
    },

    switchToBreakPhase: (focusDuration: number, breakDuration: number) => {
        const { currentSession, totalSessions } = get();

        // Determine break type: long break after session 4, short break otherwise
        const breakType = currentSession === totalSessions ? 'longBreak' : 'shortBreak';
        const breakTime =
            currentSession === totalSessions ? breakDuration * 2 * 60 : breakDuration * 60;

        set({
            timerPhase: breakType,
            timerStatus: 'idle',
            timeLeft: breakTime,
            initialTime: breakTime,
            sessionStartTime: null,
        });
    },

    completeBreak: (focusDuration: number, breakDuration: number) => {
        const { currentSession, totalSessions } = get();

        // Move to next session after break completion
        const nextSession = currentSession < totalSessions ? currentSession + 1 : 1;

        set({
            currentSession: nextSession,
            timerPhase: 'focus',
            timerStatus: 'idle',
            timeLeft: focusDuration * 60,
            initialTime: focusDuration * 60,
            sessionStartTime: null,
        });
    },

    // ===== Session Management =====
    loadSessions: async () => {
        try {
            const sessions = await localDatabaseService.getSessions();
            set({ sessions, sessionsLoaded: true });
        } catch (error) {
            console.error('Failed to load sessions:', error);
        }
    },

    // Getters
    getTotalTimeForTodo: (todoId) => {
        // Return a promise for async operation
        return localDatabaseService.getTotalTimeForTodo(todoId);
    },

    getSessions: () => {
        return get().sessions;
    },
}));
