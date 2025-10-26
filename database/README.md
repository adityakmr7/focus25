# Database Migrations

This directory contains database migration files for the Focus25 Pomodoro app.

## 📁 File Structure

```
database/
├── migrations/
│   ├── 001_initial_schema.sql          # Initial database schema
│   └── 001_initial_schema_rollback.sql # Rollback for initial schema
├── schema.sql                          # Current schema reference
└── README.md                           # This file
```

## 🚀 How to Use

### Running Migrations

1. **Copy the SQL content** from the migration file
2. **Open Supabase Dashboard** → SQL Editor
3. **Paste and run** the migration SQL
4. **Verify** the changes in Table Editor

### Creating New Migrations

1. **Create a new file** with format: `XXX_description.sql`
2. **Include header comments** with:
   - Migration number and name
   - Description of changes
   - Date and author
   - Purpose

3. **Create rollback file** with format: `XXX_description_rollback.sql`

### Migration Naming Convention

```
001_initial_schema.sql
002_add_user_preferences.sql
003_add_notification_settings.sql
```

## 📋 Migration History

| Migration | Description                                        | Date       | Status     |
| --------- | -------------------------------------------------- | ---------- | ---------- |
| 001       | Initial schema with todos, sessions, user_settings | 2024-01-26 | ✅ Applied |

## 🔧 Schema Overview

### Tables

- **`todos`** - User todo items for Pomodoro sessions
- **`sessions`** - Completed Pomodoro focus and break sessions
- **`user_settings`** - User preferences and app settings

### Security

- **Row Level Security (RLS)** enabled on all tables
- **Policies** ensure users only access their own data
- **Foreign key constraints** maintain data integrity

## ⚠️ Important Notes

- **Always backup** your database before running migrations
- **Test migrations** on a development database first
- **Keep rollback files** for every migration
- **Document changes** in commit messages

## 🛠️ Tools

- **Supabase Dashboard** - Run migrations manually
- **Supabase CLI** - Automated migrations (optional)
- **pgAdmin** - Advanced database management (optional)

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
