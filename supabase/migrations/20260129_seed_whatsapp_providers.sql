-- Part 2: Data Seeding
-- Run this AFTER 20260129_add_whatsapp_channel.sql is committed.

-- Seed WhatsApp Providers
INSERT INTO public.notification_providers (id, channel, display_name, is_enabled) VALUES
    ('msg91', 'whatsapp', 'MSG91 (WhatsApp)', true),
    ('generic_whatsapp', 'whatsapp', 'Generic WhatsApp (Placeholder)', true)
ON CONFLICT (id) DO UPDATE 
SET channel = EXCLUDED.channel, 
    display_name = EXCLUDED.display_name;

-- Ensure SMS providers are still there but optional
UPDATE public.notification_providers 
SET is_enabled = false 
WHERE channel = 'sms';
