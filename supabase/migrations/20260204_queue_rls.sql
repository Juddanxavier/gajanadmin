
-- Allow authenticated users to insert into notification queue for their tenant
-- This is required for manual shipment updates to trigger notifications

CREATE POLICY "Users can insert queue items" 
ON public.notification_queue 
FOR INSERT 
WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM user_roles WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT user_id FROM user_tenants WHERE tenant_id = notification_queue.tenant_id)
);

-- Ensure service role still has access (redundant if 'service role full access' exists, but safe)
-- Grant usage if not already
GRANT ALL ON public.notification_queue TO service_role;
GRANT ALL ON public.notification_queue TO authenticated;
