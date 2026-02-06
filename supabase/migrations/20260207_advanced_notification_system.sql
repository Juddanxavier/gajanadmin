-- Advanced Notification System Migration
-- Date: 2026-02-07
-- Description: Sets up the Queue-Based architecture with Debouncing and Priority.

-- 1. CLEANUP (Ensure fresh start)
DROP TRIGGER IF EXISTS notify_shipment_email_trigger ON public.shipments;
DROP TRIGGER IF EXISTS on_shipment_update ON public.shipments;
DROP TRIGGER IF EXISTS trigger_shipment_webhook ON public.shipments;
DROP TRIGGER IF EXISTS capture_shipment_event_trigger ON public.shipments;

DROP FUNCTION IF EXISTS notify_shipment_email();
DROP FUNCTION IF EXISTS webhook_shipment_event();
DROP FUNCTION IF EXISTS capture_shipment_event();

-- 2. CREATE QUEUE TABLE
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    reference_id UUID NOT NULL, -- The Shipment ID
    event_type TEXT NOT NULL,   -- 'delivered', 'in_transit', etc.
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Status & Tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'partially_failed', 'failed', 'skipped')),
    execution_log JSONB DEFAULT '{}'::jsonb, -- Stores {"email": "success", "whatsapp": "failed"}
    
    -- Reliability Logic
    priority INTEGER DEFAULT 0, -- Higher = More Urgent
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for the processor to find pending items quickly
CREATE INDEX IF NOT EXISTS idx_notification_queue_pending 
ON public.notification_queue (status, scheduled_for, priority DESC);

-- Unique constraint for Debouncing (STRICT: Only ONE pending event per shipment)
-- This ensures that if 'shipment_created' -> 'in_transit' -> 'delivered' happens rapidly,
-- we only keep the LATEST event. The previous ones are overwritten.
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_queue_debounce 
ON public.notification_queue (reference_id) 
WHERE status = 'pending';

-- 3. CREATE CAPTURE TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION capture_shipment_event()
RETURNS TRIGGER AS $$
DECLARE
    is_urgent BOOLEAN;
    delay_interval INTERVAL;
    prio INTEGER;
    formatted_event TEXT;
BEGIN
    -- Only capture if status CHANGED or it's a NEW shipment
    IF (TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status) THEN
        RETURN NEW;
    END IF;

    -- Determine Logic based on Status
    formatted_event := lower(NEW.status); -- e.g. 'delivered'
    
    -- Priority & Delay Logic
    IF formatted_event IN ('delivered', 'exception', 'failed_attempt') THEN
        is_urgent := TRUE;
        prio := 10;
        delay_interval := '30 seconds'; -- Fast for important stuff
    ELSE
        is_urgent := FALSE;
        prio := 0;
        delay_interval := '2 minutes'; -- Slow for 'in_transit' to allow updates to settle
    END IF;

    -- Special Case: 'New' (Insert)
    IF TG_OP = 'INSERT' THEN
        formatted_event := 'shipment_created';
        prio := 5;
        delay_interval := '1 minute';
    END IF;

    -- Insert or Update (Debounce)
    INSERT INTO public.notification_queue (
        tenant_id,
        reference_id,
        event_type,
        payload,
        status,
        priority,
        scheduled_for
    ) VALUES (
        NEW.tenant_id,
        NEW.id,
        formatted_event,
        jsonb_build_object(
            'shipment_id', NEW.id,
            'old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
            'new_status', NEW.status,
            'tracking_code', NEW.carrier_tracking_code,
            'customer_email', NEW.customer_details->>'email',
            'customer_name', NEW.customer_details->>'name'
        ),
        'pending',
        prio,
        NOW() + delay_interval
    )
    ON CONFLICT (reference_id) WHERE status = 'pending'
    DO UPDATE SET
        -- Debounce: Upgrade to the new event logic!
        event_type = EXCLUDED.event_type,
        priority = EXCLUDED.priority,
        scheduled_for = EXCLUDED.scheduled_for, -- Reset clock to new delay
        payload = EXCLUDED.payload,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. ATTACH TRIGGER
CREATE TRIGGER capture_shipment_event_trigger
AFTER INSERT OR UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION capture_shipment_event();

-- 5. RLS (Admin Only)
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notification_queue_all ON public.notification_queue;
CREATE POLICY notification_queue_all ON public.notification_queue
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin' 
        AND (tenant_id IS NULL OR tenant_id = notification_queue.tenant_id)
    )
);

-- 6. RETENTION POLICY (AUTO-CLEANUP)
-- Requires pg_cron extension
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'cleanup_old_notifications',
            '0 0 * * *', -- Every Midnight
            $cmd$ DELETE FROM public.notification_queue 
               WHERE status IN ('completed', 'failed', 'skipped') 
               AND created_at < NOW() - INTERVAL '30 days'; $cmd$
        );
    END IF;
END $$;
