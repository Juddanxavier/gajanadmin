-- Part 1: schema change
-- Add 'whatsapp' to notification_channel enum
-- This must be run and committed BEFORE using the value in data.
ALTER TYPE public.notification_channel ADD VALUE IF NOT EXISTS 'whatsapp';
