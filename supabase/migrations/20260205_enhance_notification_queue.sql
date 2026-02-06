-- ============================================================================
-- SHIPMENT MODULE: Enhance Notification Queue for WhatsApp
-- Date: 2026-02-05
-- Description: Add WhatsApp support fields to notification queue
-- ============================================================================

-- Add WhatsApp-specific columns to notification_queue
ALTER TABLE public.notification_queue 
  ADD COLUMN IF NOT EXISTS recipient_phone TEXT,
  ADD COLUMN IF NOT EXISTS recipient_name TEXT,
  ADD COLUMN IF NOT EXISTS template_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS provider_message_id TEXT;

-- Add index for phone-based lookups
CREATE INDEX IF NOT EXISTS idx_notification_queue_phone 
  ON public.notification_queue(recipient_phone) 
  WHERE channel = 'whatsapp';

-- Add index for message ID tracking
CREATE INDEX IF NOT EXISTS idx_notification_queue_provider_msg 
  ON public.notification_queue(provider_message_id) 
  WHERE provider_message_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.notification_queue.recipient_phone IS 'Recipient phone number with country code (e.g., 919876543210)';
COMMENT ON COLUMN public.notification_queue.recipient_name IS 'Recipient name for personalization';
COMMENT ON COLUMN public.notification_queue.template_data IS 'Template variables for WhatsApp/Email templates in JSON format';
COMMENT ON COLUMN public.notification_queue.provider_message_id IS 'Message ID from provider (MSG91, Resend, etc) for tracking';
