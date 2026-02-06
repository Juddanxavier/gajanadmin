-- Disable/Remove Notification Triggers
-- Date: 2026-02-07
-- Description: Removes the database triggers and functions responsible for sending shipment notifications.
-- This stops the webhook calls (and thus the localhost errors).

-- 1. Drop Triggers on 'shipments' table
DROP TRIGGER IF EXISTS notify_shipment_email_trigger ON public.shipments;
DROP TRIGGER IF EXISTS on_shipment_update ON public.shipments;
DROP TRIGGER IF EXISTS trigger_shipment_webhook ON public.shipments;

-- 2. Drop the Trigger Functions
DROP FUNCTION IF EXISTS notify_shipment_email();
DROP FUNCTION IF EXISTS webhook_shipment_event();

-- 3. (Optional) If you want to clear the queue
-- TRUNCATE TABLE public.notification_queue;
