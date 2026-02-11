-- Restore Notification Triggers
-- Date: 2026-02-09
-- Description: Re-enables the database triggers to queue notifications on shipment status changes.
-- This ensures that branded emails (Logo + Status) are sent automatically.

-- 1. Create/Update Function to queue notification
CREATE OR REPLACE FUNCTION public.queue_shipment_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_event_type TEXT;
BEGIN
    -- Only trigger if status has changed
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        
        -- Determine Event Type
        IF NEW.status = 'delivered' THEN
            v_event_type := 'shipment_delivered';
        ELSIF NEW.status = 'exception' THEN
            v_event_type := 'shipment_exception';
        ELSE
            -- Generic status update (in_transit, out_for_delivery, etc.)
            v_event_type := 'shipment_status';
        END IF;

        -- Insert into Queue with Payload
        INSERT INTO public.notification_queue (
            reference_id,
            tenant_id, 
            event_type, 
            status,
            payload -- Stores the variables for the email
        )
        VALUES (
            NEW.id,
            NEW.tenant_id, 
            v_event_type, 
            'pending',
            jsonb_build_object(
                'shipment_id', NEW.id,
                'tracking_code', NEW.carrier_tracking_code,
                'white_label_code', NEW.white_label_code,
                'new_status', NEW.status,
                'previous_status', OLD.status,
                'customer_email', NEW.customer_details->>'email',
                'customer_phone', NEW.customer_details->>'phone',
                'customer_name', NEW.customer_details->>'name',
                'amount', NEW.invoice_details->>'amount'
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Re-create Trigger
DROP TRIGGER IF EXISTS tr_queue_shipment_notification ON public.shipments;
CREATE TRIGGER tr_queue_shipment_notification
AFTER UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.queue_shipment_notification();
