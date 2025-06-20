/*
  # Initial Database Schema

  1. New Tables
    - `goals` - User goals and progress tracking
      - `id` (text, primary key)
      - `title` (text, not null)
      - `description` (text)
      - `category` (enum: sessions, focus_time, streak, consistency)
      - `type` (enum: daily, weekly, monthly)
      - `target` (integer, not null)
      - `current` (integer, default 0)
      - `unit` (text, not null)
      - `isCompleted` (boolean, default false)
      - `createdAt` (timestamp, default now)
      - `completedAt` (timestamp)
      - `deadline` (timestamp)
      - `reward` (text)

    - `statistics` - Daily usage statistics
      - `id` (text, primary key)
      - `date` (text, unique, not null)
      - `totalFlows` (integer, default 0)
      - `startedFlows` (integer, default 0)
      - `completedFlows` (integer, default 0)
      - `totalFocusTime` (integer, default 0)
      - `totalBreaks` (integer, default 0)
      - `totalBreakTime` (integer, default 0)
      - `interruptions` (integer, default 0)
      - `createdAt` (timestamp, default now)
      - `updatedAt` (timestamp, default now)

    - `flowMetrics` - Flow state tracking
      - `id` (integer, primary key)
      - `consecutiveSessions` (integer, default 0)
      - `currentStreak` (integer, default 0)
      - `longestStreak` (integer, default 0)
      - `flowIntensity` (enum: low, medium, high, default medium)
      - `distractionCount` (integer, default 0)
      - `sessionStartTime` (integer)
      - `totalFocusTime` (integer, default 0)
      - `averageSessionLength` (real, default 25.0)
      - `bestFlowDuration` (real, default 0)
      - `lastSessionDate` (text)
      - `updatedAt` (timestamp, default now)

    - `settings` - User preferences
      - `id` (integer, primary key)
      - `timeDuration` (integer, default 25)
      - `breakDuration` (integer, default 5)
      - `soundEffects` (boolean, default true)
      - `notifications` (boolean, default true)
      - `darkMode` (boolean, default false)
      - `autoBreak` (boolean, default false)
      - `focusReminders` (boolean, default true)
      - `weeklyReports` (boolean, default true)
      - `dataSync` (boolean, default true)
      - `notificationStatus` (text)
      - `updatedAt` (timestamp, default now)

    - `theme` - Theme customization
      - `id` (integer, primary key)
      - `mode` (enum: light, dark, auto, default auto)
      - `accentColor` (text, default green)
      - `timerStyle` (enum: digital, analog, minimal, default digital)
      - `customThemes` (text, default '{}')
      - `activeCustomTheme` (text)
      - `updatedAt` (timestamp, default now)

    - `sessions` - Session tracking
      - `id` (text, primary key)
      - `type` (enum: focus, break)
      - `duration` (integer, not null)
      - `completed` (boolean, default false)
      - `startTime` (text, not null)
      - `endTime` (text)
      - `distractions` (integer, default 0)
      - `notes` (text)
      - `createdAt` (timestamp, default now)

  2. Security
    - All tables are created with proper constraints
    - Default values set for better data consistency
*/

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('sessions', 'focus_time', 'streak', 'consistency')),
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly')),
  target INTEGER NOT NULL,
  current INTEGER DEFAULT 0 NOT NULL,
  unit TEXT NOT NULL,
  is_completed INTEGER DEFAULT 0 NOT NULL,
  created_at TEXT DEFAULT (datetime('now')) NOT NULL,
  completed_at TEXT,
  deadline TEXT,
  reward TEXT
);

-- Statistics table
CREATE TABLE IF NOT EXISTS statistics (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  total_flows INTEGER DEFAULT 0 NOT NULL,
  started_flows INTEGER DEFAULT 0 NOT NULL,
  completed_flows INTEGER DEFAULT 0 NOT NULL,
  total_focus_time INTEGER DEFAULT 0 NOT NULL,
  total_breaks INTEGER DEFAULT 0 NOT NULL,
  total_break_time INTEGER DEFAULT 0 NOT NULL,
  interruptions INTEGER DEFAULT 0 NOT NULL,
  created_at TEXT DEFAULT (datetime('now')) NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Flow metrics table
CREATE TABLE IF NOT EXISTS flow_metrics (
  id INTEGER PRIMARY KEY,
  consecutive_sessions INTEGER DEFAULT 0 NOT NULL,
  current_streak INTEGER DEFAULT 0 NOT NULL,
  longest_streak INTEGER DEFAULT 0 NOT NULL,
  flow_intensity TEXT DEFAULT 'medium' NOT NULL CHECK (flow_intensity IN ('low', 'medium', 'high')),
  distraction_count INTEGER DEFAULT 0 NOT NULL,
  session_start_time INTEGER,
  total_focus_time INTEGER DEFAULT 0 NOT NULL,
  average_session_length REAL DEFAULT 25.0 NOT NULL,
  best_flow_duration REAL DEFAULT 0 NOT NULL,
  last_session_date TEXT,
  updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY,
  time_duration INTEGER DEFAULT 25 NOT NULL,
  break_duration INTEGER DEFAULT 5 NOT NULL,
  sound_effects INTEGER DEFAULT 1 NOT NULL,
  notifications INTEGER DEFAULT 1 NOT NULL,
  dark_mode INTEGER DEFAULT 0 NOT NULL,
  auto_break INTEGER DEFAULT 0 NOT NULL,
  focus_reminders INTEGER DEFAULT 1 NOT NULL,
  weekly_reports INTEGER DEFAULT 1 NOT NULL,
  data_sync INTEGER DEFAULT 1 NOT NULL,
  notification_status TEXT,
  updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Theme table
CREATE TABLE IF NOT EXISTS theme (
  id INTEGER PRIMARY KEY,
  mode TEXT DEFAULT 'auto' NOT NULL CHECK (mode IN ('light', 'dark', 'auto')),
  accent_color TEXT DEFAULT 'green' NOT NULL,
  timer_style TEXT DEFAULT 'digital' NOT NULL CHECK (timer_style IN ('digital', 'analog', 'minimal')),
  custom_themes TEXT DEFAULT '{}' NOT NULL,
  active_custom_theme TEXT,
  updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('focus', 'break')),
  duration INTEGER NOT NULL,
  completed INTEGER DEFAULT 0 NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  distractions INTEGER DEFAULT 0 NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_statistics_date ON statistics(date);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
CREATE INDEX IF NOT EXISTS idx_goals_type ON goals(type);
CREATE INDEX IF NOT EXISTS idx_sessions_type ON sessions(type);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);