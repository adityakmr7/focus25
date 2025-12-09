-- Migration: Supabase Alignment
-- Description: Aligns Supabase schema with local database schema
-- Date: 2024-01-26
-- Purpose: Add missing fields for todos (subtasks), sessions (full details), and settings

-- =============================================
-- TODOS TABLE UPDATES
-- =============================================

-- Add missing columns to todos table
ALTER TABLE todos 
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS actual_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS subtasks JSONB;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_reminder_at ON todos(reminder_at);

-- =============================================
-- SESSIONS TABLE UPDATES
-- =============================================

-- Add missing columns to sessions table
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS todo_id UUID REFERENCES todos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS todo_title TEXT,
  ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS session_number INTEGER,
  ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_sessions_todo_id ON sessions(todo_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_session_number ON sessions(session_number);

-- =============================================
-- USER_SETTINGS TABLE UPDATES
-- =============================================

-- Add missing columns to user_settings table
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS sound_effects BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS metronome BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS user_email TEXT,
  ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing rows to have timestamps (if they don't exist)
UPDATE user_settings 
SET 
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW()),
  sound_effects = COALESCE(sound_effects, TRUE),
  metronome = COALESCE(metronome, FALSE),
  sync_enabled = COALESCE(sync_enabled, FALSE)
WHERE created_at IS NULL OR updated_at IS NULL;

-- =============================================
-- ROW LEVEL SECURITY UPDATES
-- =============================================

-- Ensure RLS policies cover new columns (existing policies should work, but verify)
-- No changes needed if existing policies use SELECT * or cover all columns

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify todos table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'todos' AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- Verify sessions table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'sessions' AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- Verify user_settings table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'user_settings' AND table_schema = 'public'
-- ORDER BY ordinal_position;

