-- ============================================================================
-- CONSOLIDATED MIGRATION - MASTER
-- Shipment Tracking System with Multi-Tenancy, RBAC, Automation, and Notifications
-- Generated: 2026-01-15
-- This file replaces all previous migrations.
-- ============================================================================

-- =============================================================
-- 1. EXTENSIONS
-- =============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- =============================================================
-- 2. CLEANUP (Drop generic objects to ensure clean state)
-- =============================================================
DO $$ 
BEGIN 
    -- Unschedule cron jobs first to prevent errors
    PERFORM cron.unschedule('sync-shipments-job');
    PERFORM cron.unschedule('process-notification-queue');
    PERFORM cron.unschedule('lead-maintenance-automation');
    PERFORM cron.unschedule('purge-unread-notifications');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DROP TABLE IF EXISTS notifications CASCADE; -- New Queue Table
DROP TABLE IF EXISTS tracking_events CASCADE;
DROP TABLE IF EXISTS in_app_notifications CASCADE;
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS tenant_notification_configs CASCADE;
DROP TABLE IF EXISTS notification_providers CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS carriers CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS user_tenants CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

DROP TYPE IF EXISTS notification_channel CASCADE;

-- Drop Functions
DROP FUNCTION IF EXISTS public.get_user_tenants(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.make_super_admin(text) CASCADE;
DROP FUNCTION IF EXISTS public.user_has_role(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.user_has_permission(uuid, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.notify_admins_of_new_lead() CASCADE;
DROP FUNCTION IF EXISTS public.notify_shipment_email() CASCADE;
DROP FUNCTION IF EXISTS public.handle_lead_maintenance() CASCADE;
DROP FUNCTION IF EXISTS public.purge_old_notifications() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- =============================================================
-- 3. CORE TABLES
-- =============================================================

-- Tenants
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    country_code TEXT DEFAULT 'IN',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (Synced with Auth)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RBAC
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_tenants (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, tenant_id)
);

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- Tenant-scoped role. NULL = Super Admin
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, tenant_id, role)
);

-- =============================================================
-- 4. BUSINESS DOMAIN TABLES
-- =============================================================

-- Carriers
CREATE TABLE carriers (
    code TEXT PRIMARY KEY,
    name_en TEXT,
    name_cn TEXT,
    homepage TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipments
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    white_label_code TEXT UNIQUE NOT NULL,
    carrier_tracking_code TEXT NOT NULL,
    carrier_id TEXT REFERENCES carriers(code),
    provider TEXT DEFAULT 'track123',
    status TEXT DEFAULT 'pending',
    estimated_delivery TIMESTAMPTZ,
    latest_location TEXT,
    origin_country TEXT,
    destination_country TEXT,
    customer_details JSONB DEFAULT '{}'::jsonb,
    invoice_details JSONB DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    last_synced_at TIMESTAMPTZ,
    raw_response JSONB,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shipments_tenant ON shipments(tenant_id);
CREATE INDEX idx_shipments_tracking ON shipments(carrier_tracking_code);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE UNIQUE INDEX idx_shipments_provider_tracking ON shipments(provider, carrier_tracking_code) WHERE deleted_at IS NULL;

-- Tracking Events
CREATE TABLE tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    location TEXT,
    description TEXT,
    occurred_at TIMESTAMPTZ NOT NULL,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (shipment_id, occurred_at, status)
);

-- Leads
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    status TEXT DEFAULT 'new',
    source TEXT,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    origin_country TEXT,
    destination_country TEXT,
    weight NUMERIC DEFAULT 0,
    value NUMERIC DEFAULT 0,
    goods_type TEXT DEFAULT 'General Cargo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_tenant ON leads(tenant_id);

-- Settings
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    company_name TEXT,
    company_logo_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    date_format TEXT DEFAULT 'MM/DD/YYYY',
    currency TEXT DEFAULT 'USD',
    email_notifications_enabled BOOLEAN DEFAULT true,
    sms_notifications_enabled BOOLEAN DEFAULT false,
    notification_triggers JSONB DEFAULT '["delivered", "exception", "out_for_delivery"]'::jsonb,
    smtp_host TEXT,
    smtp_port INTEGER,
    smtp_username TEXT,
    smtp_password TEXT,
    smtp_from_email TEXT,
    smtp_from_name TEXT,
    default_provider TEXT DEFAULT 'track123',
    track123_api_key TEXT,
    auto_sync_enabled BOOLEAN DEFAULT true,
    auto_sync_frequency TEXT DEFAULT '6h',
    sync_retry_attempts INTEGER DEFAULT 3,
    webhook_url TEXT,
    default_user_role TEXT DEFAULT 'customer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_tenant_settings UNIQUE (tenant_id)
);

-- =============================================================
-- 5. NOTIFICATION SYSTEM
-- =============================================================
CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'push');

CREATE TABLE notification_providers (
    id TEXT PRIMARY KEY,
    channel notification_channel NOT NULL,
    display_name TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true
);

INSERT INTO notification_providers (id, channel, display_name) VALUES
    ('smtp', 'email', 'SMTP Server'),
    ('resend', 'email', 'Resend'),
    ('zeptomail', 'email', 'ZeptoMail'),
    ('twilio', 'sms', 'Twilio'),
    ('msg91', 'sms', 'MSG91')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE tenant_notification_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    channel notification_channel NOT NULL,
    provider_id TEXT REFERENCES notification_providers(id) NOT NULL,
    credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_tenant_active_provider ON tenant_notification_configs (tenant_id, channel) WHERE is_active = true;

-- Notification Queue (Advanced Debouncing)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    recipient_email TEXT,
    recipient_phone TEXT,
    type TEXT NOT NULL,
    data JSONB NOT NULL,
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    retry_count INTEGER DEFAULT 0,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for) WHERE sent_at IS NULL;
CREATE INDEX idx_notifications_shipment_not_sent ON notifications(shipment_id) WHERE sent_at IS NULL;

-- In-App Notifications
CREATE TABLE in_app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime for In-App Notifications
ALTER TABLE in_app_notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
         CREATE PUBLICATION supabase_realtime;
    END IF;
    ALTER PUBLICATION supabase_realtime ADD TABLE in_app_notifications;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Historical Logs
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    recipient TEXT NOT NULL,
    subject TEXT,
    body TEXT,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    provider_id TEXT,
    cost DECIMAL(10, 4),
    metadata JSONB,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 6. FUNCTIONS & LOGIC
-- =============================================================

-- Timestamp updater
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sync Auth to Profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, full_name, avatar_url, phone)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.phone
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = EXCLUDED.display_name,
        full_name = EXCLUDED.full_name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Helper: Get User Tenants
CREATE OR REPLACE FUNCTION public.get_user_tenants(user_uuid UUID)
RETURNS TABLE (tenant_id UUID, tenant_name TEXT, tenant_slug TEXT, country_code TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.name, t.slug, t.country_code
    FROM tenants t
    INNER JOIN user_tenants ut ON t.id = ut.tenant_id
    WHERE ut.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Is Admin (Super Admin Support including NULL tenant)
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = user_uuid
        AND role = 'admin'
        -- Admin role implies admin privileges.
        -- Super Admin is specifically when tenant_id IS NULL, OR broadly creates logic here.
        -- This logic keeps it simple: ANY 'admin' role (tenant specific or global) returns true.
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Make Super Admin (Convenience)
CREATE OR REPLACE FUNCTION public.make_super_admin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    target_uuid UUID;
BEGIN
    SELECT id INTO target_uuid FROM auth.users WHERE email = user_email;
    
    IF target_uuid IS NULL THEN
        RETURN 'Error: User ' || user_email || ' not found in auth.users';
    END IF;

    -- Add Global Admin Role (tenant_id is NULL)
    INSERT INTO user_roles (user_id, role, tenant_id)
    VALUES (target_uuid, 'admin', NULL)
    ON CONFLICT (user_id, tenant_id, role) DO NOTHING;
    
    RETURN 'Success: ' || user_email || ' is now a Super Admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: RBAC Check
CREATE OR REPLACE FUNCTION public.user_has_permission(
    user_uuid UUID,
    permission_name_param TEXT,
    tenant_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    -- 1. Check for Super Admin (Admin role with NULL tenant)
    IF EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = user_uuid AND role = 'admin' AND tenant_id IS NULL
    ) THEN
        RETURN TRUE;
    END IF;

    -- 2. Check for Tenant Admin (if tenant_uuid provided)
    IF tenant_uuid IS NOT NULL AND EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = user_uuid AND tenant_id = tenant_uuid AND role = 'admin'
    ) THEN
        RETURN TRUE;
    END IF;

    -- 3. Check Granular Permissions
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON ur.role = r.name
        JOIN role_permissions rp ON rp.role_id = r.id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = user_uuid
        AND (tenant_uuid IS NULL OR ur.tenant_id = tenant_uuid)
        AND p.name = permission_name_param
    ) INTO has_perm;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Logic: Notify Admins of New Lead
CREATE OR REPLACE FUNCTION notify_admins_of_new_lead()
RETURNS TRIGGER AS $$
DECLARE
    admin_record RECORD;
BEGIN
    FOR admin_record IN 
        SELECT ur.user_id 
        FROM user_roles ur
        WHERE (ur.tenant_id = NEW.tenant_id OR ur.tenant_id IS NULL)
        AND ur.role IN ('admin', 'staff')
    LOOP
        INSERT INTO in_app_notifications (
            user_id, tenant_id, title, message, type, link, metadata
        ) VALUES (
            admin_record.user_id, NEW.tenant_id, 'New Lead Created',
            'A new lead has been submitted: ' || NEW.name, 'info',
            '/admin/leads/' || NEW.id, jsonb_build_object('lead_id', NEW.id)
        );
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_lead_created_notify
    AFTER INSERT ON leads
    FOR EACH ROW EXECUTE PROCEDURE notify_admins_of_new_lead();

-- =============================================================
-- 7. AUTOMATION (CRON JOBS)
-- =============================================================

-- 7.A Shipment Sync (Every Minute)
SELECT cron.schedule(
  'sync-shipments-job',
  '* * * * *',
  $$
  SELECT net.http_get(
    url := current_setting('app.api_url', true) || '/api/cron/sync-shipments',
    headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.cron_secret', true)
    )
  );
  $$
);

-- 7.B Notification Queue Processor (Every Minute)
SELECT cron.schedule(
  'process-notification-queue',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.api_url', true) || '/api/notifications/process-queue',
    headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.cron_secret', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 7.C Lead Maintenance (Daily)
CREATE OR REPLACE FUNCTION public.handle_lead_maintenance()
RETURNS void AS $$
BEGIN
    DELETE FROM leads WHERE status IN ('failed', 'deleted') AND updated_at < NOW() - INTERVAL '60 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT cron.schedule('lead-maintenance-automation', '0 2 * * *', 'SELECT public.handle_lead_maintenance()');

-- 7.D Purge Notifications (Daily)
CREATE OR REPLACE FUNCTION purge_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM in_app_notifications WHERE is_read = false AND created_at < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT cron.schedule('purge-unread-notifications', '0 3 * * *', 'SELECT purge_old_notifications()');

-- =============================================================
-- 8. RLS POLICIES
-- =============================================================
-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Tenants: Users view their own tenants OR Super Admin
CREATE POLICY tenants_select ON tenants FOR SELECT USING (
    (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND tenant_id IS NULL))
    OR
    id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

-- User Tenants: View own
CREATE POLICY user_tenants_select ON user_tenants FOR SELECT USING (user_id = auth.uid());

-- Shipments: Tenant Isolation + Super Admin Access
CREATE POLICY shipments_isolation ON shipments FOR ALL USING (
    (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND tenant_id IS NULL))
    OR
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

-- Leads: Tenant Isolation + Super Admin Access
CREATE POLICY leads_isolation ON leads FOR ALL USING (
    (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND tenant_id IS NULL))
    OR
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

-- Settings: Tenant Isolation + Super Admin Access
CREATE POLICY settings_select ON settings FOR SELECT USING (
    (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND tenant_id IS NULL))
    OR
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);
CREATE POLICY settings_update ON settings FOR UPDATE USING (
    (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND tenant_id IS NULL))
    OR
    (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()) 
     AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND tenant_id = settings.tenant_id AND role IN ('admin', 'staff')))
);

-- Notifications: User Isolation
CREATE POLICY notifications_select ON in_app_notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notifications_update ON in_app_notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY notifications_delete ON in_app_notifications FOR DELETE USING (user_id = auth.uid());

-- =============================================================
-- 9. SEED DATA
-- =============================================================
INSERT INTO roles (name, description) VALUES
    ('admin', 'Full system access'),
    ('staff', 'Staff member with limited access'),
    ('customer', 'Customer with view-only access')
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (name, resource, action) VALUES
    ('leads.view', 'leads', 'view'),
    ('leads.create', 'leads', 'create'),
    ('leads.update', 'leads', 'update'),
    ('leads.delete', 'leads', 'delete'),
    ('shipments.view', 'shipments', 'view'),
    ('shipments.create', 'shipments', 'create'),
    ('shipments.update', 'shipments', 'update'),
    ('shipments.delete', 'shipments', 'delete'),
    ('settings.manage', 'settings', 'manage'),
    ('users.update', 'users', 'update')
ON CONFLICT (name) DO NOTHING;

-- Grant all to admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Grant limited to staff
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'staff' AND p.name IN ('leads.view', 'leads.create', 'leads.update', 'shipments.view', 'shipments.create', 'shipments.update')
ON CONFLICT DO NOTHING;
