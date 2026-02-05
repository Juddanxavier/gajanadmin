
-- Migration to remove legacy notification triggers
-- These triggers attempted to call non-existent API endpoints

DROP TRIGGER IF EXISTS on_shipment_status_change_email ON public.shipments;
DROP FUNCTION IF EXISTS public.notify_shipment_email;
