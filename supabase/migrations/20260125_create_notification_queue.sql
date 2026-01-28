-- Create Notification Logs Table (if not exists)
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'email', 'sms', 'webhook'
    recipient TEXT,
    subject TEXT,
    body TEXT,
    status TEXT NOT NULL, -- 'sent', 'failed'
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

-- RLS for Notification Logs
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notification logs for their tenant" 
ON public.notification_logs FOR SELECT 
USING (tenant_id IN (
    SELECT tenant_id FROM user_roles WHERE user_id = auth.uid()
));

-- Create Notification Queue Table
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    event_type TEXT NOT NULL, -- 'shipment_received', 'shipment_delivered'
    channel TEXT NOT NULL DEFAULT 'email',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for Queue Processing
CREATE INDEX IF NOT EXISTS idx_notification_queue_processing 
ON public.notification_queue(status, scheduled_for) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_notification_queue_shipment 
ON public.notification_queue(shipment_id);

-- RLS for Queue (Secure - mostly backend access)
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Allow Service Role full access
CREATE POLICY "Service role full access on queue"
ON public.notification_queue
TO service_role
USING (true)
WITH CHECK (true);

-- Functions & Triggers

-- 1. Function to queue notification on shipment status change
CREATE OR REPLACE FUNCTION public.queue_shipment_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Event: Shipment Received (Info Received or In Transit)
    IF (OLD.status IS DISTINCT FROM NEW.status) AND 
       (NEW.status IN ('info_received', 'in_transit') AND OLD.status NOT IN ('info_received', 'in_transit', 'out_for_delivery', 'delivered')) THEN
        
        -- Check if already queued/sent for this event to avoid dupes? 
        -- (Application level duplicate check is also good, but let's INSERT)
        INSERT INTO public.notification_queue (shipment_id, tenant_id, event_type, channel)
        VALUES (NEW.id, NEW.tenant_id, 'shipment_received', 'email');
    END IF;

    -- Event: Shipment Delivered
    IF (OLD.status IS DISTINCT FROM NEW.status) AND (NEW.status = 'delivered') THEN
        INSERT INTO public.notification_queue (shipment_id, tenant_id, event_type, channel)
        VALUES (NEW.id, NEW.tenant_id, 'shipment_delivered', 'email');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger on Shipments Table
DROP TRIGGER IF EXISTS tr_queue_shipment_notification ON public.shipments;
CREATE TRIGGER tr_queue_shipment_notification
AFTER UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.queue_shipment_notification();

-- 3. Cleanup old queue items (Optional: can be run via cron)
CREATE OR REPLACE FUNCTION cleanup_notification_queue()
RETURNS void AS $$
BEGIN
    DELETE FROM public.notification_queue
    WHERE status IN ('completed', 'failed') 
    AND updated_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- 4. Schedule Cron Job (Requires pg_cron extension)
-- Uncomment and adjust URL if running in production
/*
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
    'process-notifications-every-minute',
    '* * * * *',
    $$
    SELECT net.http_post(
        url := coalesce(current_setting('app.nextjs_api_url', true), 'http://host.docker.internal:3000') || '/api/cron/process-notifications',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || coalesce(current_setting('app.cron_secret', true), 'your-super-secret-key')
        )
    );
    $$
);
*/

