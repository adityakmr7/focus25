-- Migration: 001_initial_schema.sql
-- Description: Create initial tables for todos, sessions, and user settings
-- Date: 2024-01-26
-- Author: Aditya Kumar
-- Purpose: Initial database schema for Flowzy Pomodoro app

-- =============================================
-- TODOS TABLE
-- =============================================
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  "isCompleted" BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "completedAt" TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- =============================================
-- SESSIONS TABLE
-- =============================================
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  duration INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('focus', 'break')),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- =============================================
-- USER SETTINGS TABLE
-- =============================================
CREATE TABLE user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  focus_duration INTEGER DEFAULT 25,
  break_duration INTEGER DEFAULT 5,
  notifications BOOLEAN DEFAULT TRUE,
  theme TEXT DEFAULT 'system',
  user_name TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY POLICIES - TODOS
-- =============================================
CREATE POLICY "Users can view own todos" ON todos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own todos" ON todos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own todos" ON todos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own todos" ON todos FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- SECURITY POLICIES - SESSIONS
-- =============================================
CREATE POLICY "Users can view own sessions" ON sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- SECURITY POLICIES - USER SETTINGS
-- =============================================
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_created_at ON todos(created_at);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_completed_at ON sessions(completed_at);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================
COMMENT ON TABLE todos IS 'User todo items for Pomodoro sessions';
COMMENT ON TABLE sessions IS 'Completed Pomodoro focus and break sessions';
COMMENT ON TABLE user_settings IS 'User preferences and app settings';

COMMENT ON COLUMN todos.title IS 'Todo item title';
COMMENT ON COLUMN todos.description IS 'Optional todo description';
COMMENT ON COLUMN todos.icon IS 'Icon identifier for todo item';
COMMENT ON COLUMN todos."isCompleted" IS 'Whether the todo is completed';
COMMENT ON COLUMN todos.created_at IS 'When the todo was created';
COMMENT ON COLUMN todos."completedAt" IS 'When the todo was completed';

COMMENT ON COLUMN sessions.duration IS 'Session duration in minutes';
COMMENT ON COLUMN sessions.type IS 'Type of session: focus or break';
COMMENT ON COLUMN sessions.completed_at IS 'When the session was completed';

COMMENT ON COLUMN user_settings.focus_duration IS 'Default focus session duration in minutes';
COMMENT ON COLUMN user_settings.break_duration IS 'Default break session duration in minutes';
COMMENT ON COLUMN user_settings.notifications IS 'Whether notifications are enabled';
COMMENT ON COLUMN user_settings.theme IS 'User theme preference';
COMMENT ON COLUMN user_settings.user_name IS 'User display name';
COMMENT ON COLUMN user_settings.onboarding_completed IS 'Whether user completed onboarding';
