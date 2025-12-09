-- Rollback: 001_initial_schema_rollback.sql
-- Description: Rollback initial schema migration
-- Date: 2024-01-26
-- Author: Aditya Kumar
-- Purpose: Remove all tables created in 001_initial_schema.sql

-- =============================================
-- ROLLBACK INSTRUCTIONS
-- =============================================
-- This script removes all tables created in the initial schema migration
-- WARNING: This will delete ALL data in these tables!

-- =============================================
-- DROP TABLES (in reverse order due to foreign keys)
-- =============================================

-- Drop user_settings table
DROP TABLE IF EXISTS user_settings CASCADE;

-- Drop sessions table
DROP TABLE IF EXISTS sessions CASCADE;

-- Drop todos table
DROP TABLE IF EXISTS todos CASCADE;

-- =============================================
-- VERIFICATION
-- =============================================
-- Run this query to verify tables are dropped:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('todos', 'sessions', 'user_settings');
