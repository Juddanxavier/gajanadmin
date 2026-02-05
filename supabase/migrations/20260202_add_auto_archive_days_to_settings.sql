-- Add missing columns to settings table
ALTER TABLE "settings" 
ADD COLUMN IF NOT EXISTS "auto_archive_days" INTEGER DEFAULT 90,
ADD COLUMN IF NOT EXISTS "data_retention_days" INTEGER DEFAULT 365;

-- Refresh schema cache (optional, but good practice)
NOTIFY pgrst, 'reload config';
