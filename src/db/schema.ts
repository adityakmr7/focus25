import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core';

// Goals table
export const goals = sqliteTable('goals', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category', { enum: ['sessions', 'focus_time', 'streak', 'consistency'] }).notNull(),
  type: text('type', { enum: ['daily', 'weekly', 'monthly'] }).notNull(),
  target: integer('target').notNull(),
  current: integer('current').default(0).notNull(),
  unit: text('unit').notNull(),
  isCompleted: integer('is_completed', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  completedAt: text('completed_at'),
  deadline: text('deadline'),
  reward: text('reward'),
});

// Statistics table
export const statistics = sqliteTable('statistics', {
  id: text('id').primaryKey(),
  date: text('date').notNull().unique(),
  totalFlows: integer('total_flows').default(0).notNull(),
  startedFlows: integer('started_flows').default(0).notNull(),
  completedFlows: integer('completed_flows').default(0).notNull(),
  totalFocusTime: integer('total_focus_time').default(0).notNull(),
  totalBreaks: integer('total_breaks').default(0).notNull(),
  totalBreakTime: integer('total_break_time').default(0).notNull(),
  interruptions: integer('interruptions').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Flow metrics table
export const flowMetrics = sqliteTable('flow_metrics', {
  id: integer('id').primaryKey(),
  consecutiveSessions: integer('consecutive_sessions').default(0).notNull(),
  currentStreak: integer('current_streak').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  flowIntensity: text('flow_intensity', { enum: ['low', 'medium', 'high'] }).default('medium').notNull(),
  distractionCount: integer('distraction_count').default(0).notNull(),
  sessionStartTime: integer('session_start_time'),
  totalFocusTime: integer('total_focus_time').default(0).notNull(),
  averageSessionLength: real('average_session_length').default(25.0).notNull(),
  bestFlowDuration: real('best_flow_duration').default(0).notNull(),
  lastSessionDate: text('last_session_date'),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Settings table
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey(),
  timeDuration: integer('time_duration').default(25).notNull(),
  breakDuration: integer('break_duration').default(5).notNull(),
  soundEffects: integer('sound_effects', { mode: 'boolean' }).default(true).notNull(),
  notifications: integer('notifications', { mode: 'boolean' }).default(true).notNull(),
  darkMode: integer('dark_mode', { mode: 'boolean' }).default(false).notNull(),
  autoBreak: integer('auto_break', { mode: 'boolean' }).default(false).notNull(),
  focusReminders: integer('focus_reminders', { mode: 'boolean' }).default(true).notNull(),
  weeklyReports: integer('weekly_reports', { mode: 'boolean' }).default(true).notNull(),
  dataSync: integer('data_sync', { mode: 'boolean' }).default(true).notNull(),
  notificationStatus: text('notification_status'),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Theme table
export const theme = sqliteTable('theme', {
  id: integer('id').primaryKey(),
  mode: text('mode', { enum: ['light', 'dark', 'auto'] }).default('auto').notNull(),
  accentColor: text('accent_color').default('green').notNull(),
  timerStyle: text('timer_style', { enum: ['digital', 'analog', 'minimal'] }).default('digital').notNull(),
  customThemes: text('custom_themes').default('{}').notNull(),
  activeCustomTheme: text('active_custom_theme'),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Sessions table for detailed tracking
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['focus', 'break'] }).notNull(),
  duration: integer('duration').notNull(),
  completed: integer('completed', { mode: 'boolean' }).default(false).notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time'),
  distractions: integer('distractions').default(0).notNull(),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Type exports for TypeScript
export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;

export type Statistic = typeof statistics.$inferSelect;
export type NewStatistic = typeof statistics.$inferInsert;

export type FlowMetric = typeof flowMetrics.$inferSelect;
export type NewFlowMetric = typeof flowMetrics.$inferInsert;

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;

export type Theme = typeof theme.$inferSelect;
export type NewTheme = typeof theme.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;