-- Revert Notification Changes
-- Description: Drops the trigger and function created by 20260209_enable_notification_triggers.sql

-- 1. Drop the trigger on the shipments table
DROP TRIGGER IF EXISTS tr_queue_shipment_notification ON public.shipments;

-- 2. Drop the function
DROP FUNCTION IF EXISTS public.queue_shipment_notification();

-- Note: This will disable automatic notification queuing.
