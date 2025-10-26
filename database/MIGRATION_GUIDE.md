# Database Migration Scripts

This directory contains scripts to help manage database migrations.

## 📁 Files Created

- `001_initial_schema.sql` - Complete initial database setup
- `001_initial_schema_rollback.sql` - Rollback script
- `schema.sql` - Current schema reference
- `README.md` - Documentation

## 🚀 Quick Start

1. **Copy content** from `001_initial_schema.sql`
2. **Open Supabase Dashboard** → SQL Editor
3. **Paste and run** the SQL
4. **Verify tables** in Table Editor

## ✅ What Gets Created

- ✅ `todos` table with proper column names
- ✅ `sessions` table for Pomodoro sessions
- ✅ `user_settings` table for user preferences
- ✅ Row Level Security policies
- ✅ Performance indexes
- ✅ Proper foreign key constraints

## 🔄 Future Migrations

When you need to make changes:

1. Create new migration file: `002_description.sql`
2. Create rollback file: `002_description_rollback.sql`
3. Update this README with the new migration
4. Test on development database first

## 📋 Migration Checklist

- [ ] Backup production database
- [ ] Test migration on development
- [ ] Run migration on production
- [ ] Verify all tables and policies
- [ ] Update documentation
- [ ] Commit migration files to Git

---

**Created:** 2024-01-26  
**Author:** Aditya Kumar  
**Purpose:** Focus25 Pomodoro App Database Schema
