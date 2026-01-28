
-- 🧹 Cleanup Notification System Tables
-- Run this in your Supabase SQL Editor

DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "notification_logs" CASCADE;
DROP TABLE IF EXISTS "tenant_notification_configs" CASCADE;

-- Verify deletion (Optional)
-- SELECT * FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';
