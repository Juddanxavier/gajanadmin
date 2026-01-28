-- Create Notification Providers Type & Table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') THEN
        CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'push');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.notification_providers (
    id TEXT PRIMARY KEY,
    channel notification_channel NOT NULL,
    display_name TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true
);

-- Seed Providers
INSERT INTO public.notification_providers (id, channel, display_name) VALUES
    ('smtp', 'email', 'SMTP Server'),
    ('resend', 'email', 'Resend'),
    ('zeptomail', 'email', 'ZeptoMail'),
    ('twilio', 'sms', 'Twilio'),
    ('msg91', 'sms', 'MSG91')
ON CONFLICT (id) DO NOTHING;

-- Create Tenant Notification Configs Table
CREATE TABLE IF NOT EXISTS public.tenant_notification_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    channel notification_channel NOT NULL,
    provider_id TEXT REFERENCES public.notification_providers(id) NOT NULL,
    credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active Provider Constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_active_provider 
ON public.tenant_notification_configs (tenant_id, channel) 
WHERE is_active = true;

-- RLS: Secure tenant_notification_configs (Admin Only)
ALTER TABLE public.notification_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_notification_configs ENABLE ROW LEVEL SECURITY;

-- 1. Providers: Read Only for authenticated
DROP POLICY IF EXISTS notification_providers_select ON public.notification_providers;
CREATE POLICY notification_providers_select 
ON public.notification_providers 
FOR SELECT 
TO authenticated 
USING (true);

-- 2. Configs: Admin Only (Strict Security)
DROP POLICY IF EXISTS tenant_notification_configs_select ON public.tenant_notification_configs;
CREATE POLICY tenant_notification_configs_select 
ON public.tenant_notification_configs 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin' 
        AND (tenant_id IS NULL OR tenant_id = tenant_notification_configs.tenant_id)
    )
);

DROP POLICY IF EXISTS tenant_notification_configs_modify ON public.tenant_notification_configs;
CREATE POLICY tenant_notification_configs_modify 
ON public.tenant_notification_configs 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin' 
        AND (tenant_id IS NULL OR tenant_id = tenant_notification_configs.tenant_id)
    )
);
