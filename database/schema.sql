-- Schema: schema.sql
-- Description: Current database schema snapshot
-- Date: 2024-01-26
-- Author: Aditya Kumar
-- Purpose: Reference schema for Flowzy Pomodoro app

-- =============================================
-- DATABASE SCHEMA OVERVIEW
-- =============================================
-- This file contains the current database schema
-- Use this as a reference for the current state of the database
-- For changes, use migration files in the migrations/ folder

-- =============================================
-- TABLES
-- =============================================

-- Todos Table
-- Stores user todo items for Pomodoro sessions
CREATE TABLE IF NOT EXISTS todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  "isCompleted" BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "completedAt" TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Sessions Table
-- Stores completed Pomodoro focus and break sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  duration INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('focus', 'break')),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- User Settings Table
-- Stores user preferences and app settings
CREATE TABLE IF NOT EXISTS user_settings (
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
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_completed_at ON sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLICIES
-- =============================================

-- Todos Policies
CREATE POLICY IF NOT EXISTS "Users can view own todos" ON todos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own todos" ON todos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own todos" ON todos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own todos" ON todos FOR DELETE USING (auth.uid() = user_id);

-- Sessions Policies
CREATE POLICY IF NOT EXISTS "Users can view own sessions" ON sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Settings Policies
CREATE POLICY IF NOT EXISTS "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
