import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';
import { useSettingsStore } from "./settingsStore";
import { useStatisticsStore } from "./statisticsStore";
import { appStorage, createMMKVStorage } from '../services/storage';
import * as Notifications from "expo-notifications";
import { isNewDay, getCurrentDateString } from "../utils/dateUtils";

/**
 * Flow Metrics Interface
 * 
 * Tracks user's focus patterns and flow state analytics
 */
interface FlowMetrics {
  consecutiveSessions: number;      // Number of sessions completed in a row today
  currentStreak: number;            // Current daily streak count
  longestStreak: number;           // Best streak ever achieved
  flowIntensity: "low" | "medium" | "high"; // Current flow state assessment
  distractionCount: number;         // Number of interruptions today
  sessionStartTime: number | null;  // Timestamp when current session started
  totalFocusTime: number;          // Total minutes focused (all time)
  averageSessionLength: number;     // Average session duration in minutes
  bestFlowDuration: number;        // Longest single session in minutes
  lastSessionDate: string | null;   // ISO date of last completed session
}

/**
 * Timer State Interface
 * 
 * Manages the current timer state and session information
 */
interface TimerState {
  minutes: number;                  // Current minutes remaining
  seconds: number;                  // Current seconds remaining
  isRunning: boolean;              // Whether timer is actively counting down
  isPaused: boolean;               // Whether timer is paused
  totalSeconds: number;            // Current total seconds remaining
  initialSeconds: number;          // Original session length in seconds
  currentSession: number;          // Current session number (1-4 in Pomodoro)
  totalSessions: number;           // Total sessions in current cycle
  isBreak: boolean;               // Whether currently in break mode
  adaptedDuration?: number;        // AI-adapted session length in minutes
}

/**
 * Pomodoro Store State Interface
 * 
 * Main store for timer functionality and flow tracking
 */
interface PomodoroState {
  // Core Timer Settings
  workDuration: number;             // Default work session duration
  breakDuration: number;            // Default break duration
  
  // Current State
  timer: TimerState;               // Current timer state
  flowMetrics: FlowMetrics;        // Flow tracking metrics
  
  // Timer Control Actions
  setWorkDuration: (duration: number) => void;        // Set work session length
  setBreakDuration: (duration: number) => void;       // Set break length
  setTimer: (timer: Partial<TimerState>) => void;     // Update timer state
  toggleTimer: () => void;                             // Start/pause/resume timer
  resetTimer: () => void;                              // Reset current timer
  stopTimer: () => void;                               // Stop and reset timer
  handleTimerComplete: () => void;                     // Handle session completion
  updateTimerFromSettings: () => void;                 // Sync with settings store
  
  // Break Management
  startBreak: () => void;                              // Start break session
  endBreak: () => void;                                // End break and return to work
  
  // Flow Tracking Actions
  trackDistraction: () => void;                        // Record a distraction event
  calculateFlowIntensity: () => void;                  // Recalculate flow state
  adaptSessionLength: () => number;                    // Get AI-adapted session length
  updateFlowMetrics: () => void;                       // Update metrics after session
  resetDailyMetrics: () => void;                       // Reset daily counters
  checkAndResetDailyMetrics: () => void;              // Check if new day and reset
  
  // Data Management
  exportFlowData: () => string;                        // Export flow metrics as JSON
  getStorageInfo: () => { size: number; sessions: number }; // Get storage information
}

/**
 * Flow Intensity Calculation
 * 
 * Determines user's current flow state based on multiple factors
 */
const calculateFlowIntensity = (
  consecutiveSessions: number,
  distractionCount: number,
  averageSessionLength: number
): "low" | "medium" | "high" => {
  try {
    // Calculate distraction ratio (lower is better)
    const distractionRatio = distractionCount / Math.max(consecutiveSessions, 1);

    // Consider session length (longer sessions indicate better focus)
    // Normalize to 25-minute base (Pomodoro standard)
    const sessionLengthScore = Math.min(averageSessionLength / 25, 2);

    // Combine factors into overall flow score
    const flowScore = (1 - distractionRatio) * sessionLengthScore;

    // Classify flow intensity
    if (flowScore > 1.5) return "high";    // Deep flow state
    if (flowScore > 0.8) return "medium";  // Good focus
    return "low";                          // Struggling with focus
  } catch (error) {
    console.error('Error calculating flow intensity:', error);
    return "medium"; // Safe default
  }
};

/**
 * Adaptive Session Length Algorithm
 * 
 * Adjusts session length based on user's flow state and performance
 */
const getAdaptiveSessionLength = (
  baseMinutes: number,
  flowIntensity: "low" | "medium" | "high",
  consecutiveSessions: number
): number => {
  try {
    let adaptedLength = baseMinutes;

    // Adjust based on current flow intensity
    switch (flowIntensity) {
      case "high":
        // In deep flow - allow longer sessions but cap at 90 minutes
        adaptedLength = Math.min(baseMinutes + consecutiveSessions * 5, 90);
        break;
        
      case "low":
        // Struggling with focus - use shorter sessions to build momentum
        adaptedLength = Math.max(baseMinutes - 5, 15);
        break;
        
      case "medium":
      default:
        // Gradual increase for medium flow
        adaptedLength = Math.min(baseMinutes + consecutiveSessions * 2, 60);
        break;
    }

    return adaptedLength;
  } catch (error) {
    console.error('Error calculating adaptive session length:', error);
    return baseMinutes; // Return original length on error
  }
};

/**
 * Timer State Factory
 * 
 * Creates initial timer state with given duration
 */
const getInitialTimerState = (duration: number): TimerState => ({
  minutes: duration,
  seconds: 0,
  isRunning: false,
  isPaused: false,
  totalSeconds: duration * 60,
  initialSeconds: duration * 60,
  currentSession: 1,
  totalSessions: 4,              // Standard Pomodoro cycle
  isBreak: false,
});

/**
 * Flow Metrics Factory
 * 
 * Creates initial flow metrics state
 */
const getInitialFlowMetrics = (): FlowMetrics => ({
  consecutiveSessions: 0,
  currentStreak: 0,
  longestStreak: 0,
  flowIntensity: "medium",       // Start with neutral assessment
  distractionCount: 0,
  sessionStartTime: null,
  totalFocusTime: 0,
  averageSessionLength: 25,      // Standard Pomodoro length
  bestFlowDuration: 0,
  lastSessionDate: null,
});

/**
 * Pomodoro Store Implementation
 * 
 * Main store using Zustand with MMKV persistence for performance
 */
export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      // Initial State
      workDuration: 1,                           // Default to 1 minute for testing
      breakDuration: 1,                          // Default to 1 minute for testing
      timer: getInitialTimerState(25),           // Standard 25-minute Pomodoro
      flowMetrics: getInitialFlowMetrics(),

      /**
       * Check and Reset Daily Metrics
       * 
       * Resets daily counters if it's a new day
       */
      checkAndResetDailyMetrics: () => {
        try {
          const state = get();
          if (isNewDay(state.flowMetrics.lastSessionDate)) {
            console.log('New day detected, resetting daily metrics');
            set((state) => ({
              flowMetrics: {
                ...state.flowMetrics,
                consecutiveSessions: 0,
                distractionCount: 0,
                sessionStartTime: null,
                lastSessionDate: getCurrentDateString(),
              },
            }));
          }
        } catch (error) {
          console.error('Error checking/resetting daily metrics:', error);
        }
      },

      /**
       * Set Work Duration
       * 
       * Updates the default work session duration
       */
      setWorkDuration: (duration) => {
        try {
          set((state) => ({
            workDuration: duration,
            timer: {
              ...state.timer,
              minutes: duration,
              seconds: 0,
              totalSeconds: duration * 60,
              initialSeconds: duration * 60,
            },
          }));
          console.log(`Work duration set to ${duration} minutes`);
        } catch (error) {
          console.error('Error setting work duration:', error);
        }
      },

      /**
       * Set Break Duration
       * 
       * Updates the default break duration
       */
      setBreakDuration: (duration) => {
        try {
          set({ breakDuration: duration });
          console.log(`Break duration set to ${duration} minutes`);
        } catch (error) {
          console.error('Error setting break duration:', error);
        }
      },

      /**
       * Set Timer State
       * 
       * Updates specific timer properties
       */
      setTimer: (timerUpdate) => {
        try {
          set((state) => ({
            timer: { ...state.timer, ...timerUpdate },
          }));
        } catch (error) {
          console.error('Error setting timer state:', error);
        }
      },

      /**
       * Toggle Timer
       * 
       * Starts, pauses, or resumes the timer with flow tracking
       */
      toggleTimer: () => {
        try {
          // Check for new day before any timer operations
          get().checkAndResetDailyMetrics();
          
          const state = get();
          const statistics = useStatisticsStore.getState();

          if (!state.timer.isRunning) {
            // Starting a new session
            console.log('Starting new focus session');
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
            // Resuming from pause - this counts as a distraction
            console.log('Resuming from pause (distraction recorded)');
            get().trackDistraction();
            
            set((state) => ({
              timer: {
                ...state.timer,
                isRunning: true,
                isPaused: false,
              },
            }));
          } else {
            // Pausing - this counts as a distraction
            console.log('Pausing session (distraction recorded)');
            get().trackDistraction();
            
            set((state) => ({
              timer: {
                ...state.timer,
                isRunning: false,
                isPaused: true,
              },
            }));
          }
        } catch (error) {
          console.error('Error toggling timer:', error);
        }
      },

      /**
       * Reset Timer
       * 
       * Resets the current timer to its initial state
       */
      resetTimer: () => {
        try {
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
          }));
          console.log('Timer reset to initial state');
        } catch (error) {
          console.error('Error resetting timer:', error);
        }
      },

      /**
       * Stop Timer
       * 
       * Stops the timer and clears session tracking
       */
      stopTimer: () => {
        try {
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
          }));
          console.log('Timer stopped');
        } catch (error) {
          console.error('Error stopping timer:', error);
        }
      },

      /**
       * Start Break
       * 
       * Initiates a break session with appropriate duration
       */
      startBreak: () => {
        try {
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

          console.log(`Break started: ${settings.breakDuration} minutes`);
        } catch (error) {
          console.error('Error starting break:', error);
        }
      },

      /**
       * End Break
       * 
       * Ends break and prepares for next work session with adaptive duration
       */
      endBreak: () => {
        try {
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

          console.log(`Break ended, next session: ${adaptedLength} minutes`);
        } catch (error) {
          console.error('Error ending break:', error);
        }
      },

      /**
       * Handle Timer Complete
       * 
       * Processes session completion with notifications and flow updates
       */
      handleTimerComplete: () => {
        try {
          const state = get();
          const settings = useSettingsStore.getState();
          const statistics = useStatisticsStore.getState();

          if (!state.timer.isBreak) {
            // Focus session completed
            const minutes = Math.floor(state.timer.initialSeconds / 60);
            statistics.incrementFlowCompleted(minutes);
            
            // Update flow metrics
            get().updateFlowMetrics();
            const updatedState = get();
            const { flowIntensity, consecutiveSessions } = updatedState.flowMetrics;

            // Send contextual notification
            if (settings.notifications) {
              let notificationContent = {
                title: "Flow Session Complete! 🎉",
                body: "Time for a break!",
                sound: true,
              };

              // Customize notification based on performance
              if (flowIntensity === "high" && consecutiveSessions >= 3) {
                notificationContent = {
                  title: "Amazing Deep Flow! 🔥",
                  body: `${consecutiveSessions} consecutive sessions! You're unstoppable!`,
                  sound: true,
                };
              } else if (flowIntensity === "high") {
                notificationContent = {
                  title: "Deep Flow Achieved! 🔥",
                  body: "You're in the zone! Take a well-deserved break.",
                  sound: true,
                };
              } else if (consecutiveSessions >= 5) {
                notificationContent = {
                  title: "Consistency Champion! 🏆",
                  body: `${consecutiveSessions} sessions completed! Keep it up!`,
                  sound: true,
                };
              }

              Notifications.scheduleNotificationAsync({
                content: notificationContent,
                trigger: null,
              });
            }

            // Always prepare break (user can choose to start it)
            get().startBreak();
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
          }

          // Handle session progression
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
            // Cycle complete - reset to first session
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

          console.log('Timer completion handled successfully');
        } catch (error) {
          console.error('Error handling timer completion:', error);
        }
      },

      /**
       * Update Timer from Settings
       * 
       * Syncs timer with current settings store values
       */
      updateTimerFromSettings: () => {
        try {
          const settings = useSettingsStore.getState();
          set((state) => ({
            workDuration: settings.timeDuration,
            breakDuration: settings.breakDuration,
            timer: getInitialTimerState(settings.timeDuration),
          }));
          console.log('Timer updated from settings');
        } catch (error) {
          console.error('Error updating timer from settings:', error);
        }
      },

      /**
       * Track Distraction
       * 
       * Records a distraction event and recalculates flow intensity
       */
      trackDistraction: () => {
        try {
          set((state) => ({
            flowMetrics: {
              ...state.flowMetrics,
              distractionCount: state.flowMetrics.distractionCount + 1,
            },
          }));

          get().calculateFlowIntensity();
          console.log('Distraction tracked and flow intensity recalculated');
        } catch (error) {
          console.error('Error tracking distraction:', error);
        }
      },

      /**
       * Calculate Flow Intensity
       * 
       * Analyzes current metrics to determine flow state
       */
      calculateFlowIntensity: () => {
        try {
          const state = get();
          const { consecutiveSessions, distractionCount, averageSessionLength } = state.flowMetrics;

          const intensity = calculateFlowIntensity(
            consecutiveSessions,
            distractionCount,
            averageSessionLength
          );

          set((state) => ({
            flowMetrics: {
              ...state.flowMetrics,
              flowIntensity: intensity,
            },
          }));

          console.log(`Flow intensity calculated: ${intensity}`);
        } catch (error) {
          console.error('Error calculating flow intensity:', error);
        }
      },

      /**
       * Adapt Session Length
       * 
       * Returns AI-adapted session length based on current flow state
       */
      adaptSessionLength: () => {
        try {
          const state = get();
          const settings = useSettingsStore.getState();
          const { flowIntensity, consecutiveSessions } = state.flowMetrics;

          const adaptedLength = getAdaptiveSessionLength(
            settings.timeDuration,
            flowIntensity,
            consecutiveSessions
          );

          console.log(`Adapted session length: ${adaptedLength} minutes (from ${settings.timeDuration})`);
          return adaptedLength;
        } catch (error) {
          console.error('Error adapting session length:', error);
          return useSettingsStore.getState().timeDuration; // Fallback to settings
        }
      },

      /**
       * Update Flow Metrics
       * 
       * Updates metrics after a successful session completion
       */
      updateFlowMetrics: () => {
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
                state.flowMetrics.currentStreak + 1
              ),
              totalFocusTime: state.flowMetrics.totalFocusTime + sessionDuration,
              averageSessionLength: (state.flowMetrics.averageSessionLength + sessionDuration) / 2,
              bestFlowDuration: Math.max(state.flowMetrics.bestFlowDuration, sessionTime),
              sessionStartTime: null,
              distractionCount: 0, // Reset after successful session
              lastSessionDate: getCurrentDateString(),
            },
          }));

          get().calculateFlowIntensity();
          console.log('Flow metrics updated after session completion');
        } catch (error) {
          console.error('Error updating flow metrics:', error);
        }
      },

      /**
       * Reset Daily Metrics
       * 
       * Manually resets daily counters (used for new day detection)
       */
      resetDailyMetrics: () => {
        try {
          set((state) => ({
            flowMetrics: {
              ...state.flowMetrics,
              consecutiveSessions: 0,
              distractionCount: 0,
              sessionStartTime: null,
            },
          }));
          console.log('Daily metrics reset');
        } catch (error) {
          console.error('Error resetting daily metrics:', error);
        }
      },

      /**
       * Export Flow Data
       * 
       * Creates a JSON export of all flow metrics and timer data
       */
      exportFlowData: () => {
        try {
          const state = get();
          const exportData = {
            flowMetrics: state.flowMetrics,
            timerSettings: {
              workDuration: state.workDuration,
              breakDuration: state.breakDuration,
            },
            exportDate: new Date().toISOString(),
            version: '1.0.0',
          };
          
          return JSON.stringify(exportData, null, 2);
        } catch (error) {
          console.error('Error exporting flow data:', error);
          return '{}';
        }
      },

      /**
       * Get Storage Information
       * 
       * Returns information about storage usage
       */
      getStorageInfo: () => {
        try {
          const state = get();
          return {
            size: appStorage.size,
            sessions: state.flowMetrics.consecutiveSessions,
          };
        } catch (error) {
          console.error('Error getting storage info:', error);
          return { size: 0, sessions: 0 };
        }
      },
    }),
    {
      name: 'pomodoro-storage',                                 // Storage key name
      storage: createJSONStorage(() => createMMKVStorage(appStorage)), // Use MMKV for persistence
      
      /**
       * Rehydration Handler
       * 
       * Called when the store is loaded from storage on app startup
       */
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('Pomodoro store rehydrated successfully');
          
          // Check for new day and reset metrics if needed
          state.checkAndResetDailyMetrics();
          
          // Ensure timer is not running after app restart
          if (state.timer.isRunning) {
            console.log('Stopping timer after app restart');
            state.timer.isRunning = false;
            state.timer.isPaused = false;
            state.flowMetrics.sessionStartTime = null;
          }
        }
      },
    }
  )
);