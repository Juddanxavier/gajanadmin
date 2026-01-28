-- Secure tenant_notification_configs (Admin Only)

-- Drop existing policies
DROP POLICY IF EXISTS tenant_notification_configs_select ON public.tenant_notification_configs;
DROP POLICY IF EXISTS tenant_notification_configs_modify ON public.tenant_notification_configs;

-- 1. SELECT: Only Admins can view configs (contains credentials)
-- Note: Service Role bypasses RLS, so backend still works.
CREATE POLICY tenant_notification_configs_select 
ON public.tenant_notification_configs 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin' 
        AND (tenant_id IS NULL OR tenant_id = tenant_notification_configs.tenant_id)
    )
);

-- 2. MODIFY: Only Admins can insert/update/delete
CREATE POLICY tenant_notification_configs_modify 
ON public.tenant_notification_configs 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin' 
        AND (tenant_id IS NULL OR tenant_id = tenant_notification_configs.tenant_id)
    )
);
