-- SQLite Database Schema for Focus25 Local-First App
-- This replaces the Supabase schema with local SQLite tables

-- =============================================
-- TODOS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  isCompleted BOOLEAN DEFAULT 0,
  createdAt TEXT NOT NULL,
  completedAt TEXT,
  category TEXT,
  priority INTEGER DEFAULT 0,
  estimatedMinutes INTEGER,
  actualMinutes INTEGER DEFAULT 0
);

-- =============================================
-- SESSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  todoId TEXT,
  todoTitle TEXT,
  startTime TEXT NOT NULL,
  endTime TEXT,
  duration INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('focus', 'break')),
  sessionNumber INTEGER,
  isCompleted BOOLEAN DEFAULT 0,
  notes TEXT,
  FOREIGN KEY (todoId) REFERENCES todos(id) ON DELETE SET NULL
);

-- =============================================
-- USER SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  focusDuration INTEGER DEFAULT 25,
  breakDuration INTEGER DEFAULT 5,
  notifications BOOLEAN DEFAULT 1,
  soundEffects BOOLEAN DEFAULT 1,
  metronome BOOLEAN DEFAULT 0,
  theme TEXT DEFAULT 'system',
  userName TEXT,
  userEmail TEXT,
  onboardingCompleted BOOLEAN DEFAULT 0,
  syncEnabled BOOLEAN DEFAULT 0,
  lastSyncAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- =============================================
-- SYNC LOG TABLE (for optional cloud sync)
-- =============================================
CREATE TABLE IF NOT EXISTS sync_log (
  id TEXT PRIMARY KEY,
  tableName TEXT NOT NULL,
  recordId TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
  timestamp TEXT NOT NULL,
  synced BOOLEAN DEFAULT 0,
  error TEXT
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(createdAt);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(isCompleted);
CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);

CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(startTime);
CREATE INDEX IF NOT EXISTS idx_sessions_todo_id ON sessions(todoId);
CREATE INDEX IF NOT EXISTS idx_sessions_type ON sessions(type);

CREATE INDEX IF NOT EXISTS idx_sync_log_table_record ON sync_log(tableName, recordId);
CREATE INDEX IF NOT EXISTS idx_sync_log_synced ON sync_log(synced);

-- =============================================
-- TRIGGERS FOR SYNC LOGGING
-- =============================================

-- Trigger for todos table changes
CREATE TRIGGER IF NOT EXISTS todos_sync_log_insert
  AFTER INSERT ON todos
BEGIN
  INSERT INTO sync_log (id, tableName, recordId, operation, timestamp)
  VALUES (lower(hex(randomblob(16))), 'todos', NEW.id, 'create', datetime('now'));
END;

CREATE TRIGGER IF NOT EXISTS todos_sync_log_update
  AFTER UPDATE ON todos
BEGIN
  INSERT INTO sync_log (id, tableName, recordId, operation, timestamp)
  VALUES (lower(hex(randomblob(16))), 'todos', NEW.id, 'update', datetime('now'));
END;

CREATE TRIGGER IF NOT EXISTS todos_sync_log_delete
  AFTER DELETE ON todos
BEGIN
  INSERT INTO sync_log (id, tableName, recordId, operation, timestamp)
  VALUES (lower(hex(randomblob(16))), 'todos', OLD.id, 'delete', datetime('now'));
END;

-- Trigger for sessions table changes
CREATE TRIGGER IF NOT EXISTS sessions_sync_log_insert
  AFTER INSERT ON sessions
BEGIN
  INSERT INTO sync_log (id, tableName, recordId, operation, timestamp)
  VALUES (lower(hex(randomblob(16))), 'sessions', NEW.id, 'create', datetime('now'));
END;

CREATE TRIGGER IF NOT EXISTS sessions_sync_log_update
  AFTER UPDATE ON sessions
BEGIN
  INSERT INTO sync_log (id, tableName, recordId, operation, timestamp)
  VALUES (lower(hex(randomblob(16))), 'sessions', NEW.id, 'update', datetime('now'));
END;

CREATE TRIGGER IF NOT EXISTS sessions_sync_log_delete
  AFTER DELETE ON sessions
BEGIN
  INSERT INTO sync_log (id, tableName, recordId, operation, timestamp)
  VALUES (lower(hex(randomblob(16))), 'sessions', OLD.id, 'delete', datetime('now'));
END;

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert default settings if none exist
INSERT OR IGNORE INTO user_settings (
  id, 
  focusDuration, 
  breakDuration, 
  notifications, 
  soundEffects, 
  metronome, 
  theme, 
  userName, 
  userEmail, 
  onboardingCompleted, 
  syncEnabled, 
  createdAt, 
  updatedAt
) VALUES (
  'default_settings',
  25,
  5,
  1,
  1,
  0,
  'system',
  'User',
  '',
  0,
  0,
  datetime('now'),
  datetime('now')
);
