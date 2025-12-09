-- Migration: Add Premium Status to User Settings
-- Description: Adds has_pro_access column to track premium subscription status in Supabase
-- Date: 2024-01-26
-- Purpose: Store premium subscription status in Supabase for cross-device sync

-- =============================================
-- USER_SETTINGS TABLE UPDATE
-- =============================================

-- Add has_pro_access column to user_settings table
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS has_pro_access BOOLEAN DEFAULT FALSE;

-- Update existing rows to have default value
UPDATE user_settings 
SET has_pro_access = COALESCE(has_pro_access, FALSE)
WHERE has_pro_access IS NULL;

-- Create index for premium status queries (optional, useful for analytics)
CREATE INDEX IF NOT EXISTS idx_user_settings_has_pro_access ON user_settings(has_pro_access);

-- =============================================
-- VERIFICATION
-- =============================================

-- Verify column was added
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'user_settings' 
--   AND column_name = 'has_pro_access'
--   AND table_schema = 'public';

