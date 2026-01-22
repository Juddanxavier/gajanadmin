-- ============================================================================
-- CONSOLIDATED MIGRATION - MASTER (2026-01-20)
-- Shipment Tracking System
-- Includes: Multi-Tenancy, RBAC, Automation, Notifications (Queue + Templates)
-- Security: Comprehensive RLS on ALL tables
-- ============================================================================

-- =============================================================
-- 1. EXTENSIONS
-- =============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- =============================================================
-- 2. CLEANUP
-- =============================================================
DO $$ 
BEGIN 
    PERFORM cron.unschedule('sync-shipments-job');
    PERFORM cron.unschedule('process-notification-queue');
    PERFORM cron.unschedule('lead-maintenance-automation');
    PERFORM cron.unschedule('purge-unread-notifications');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
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
DROP FUNCTION IF EXISTS public.seed_default_email_templates() CASCADE;

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
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL = Super Admin
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

-- Email Templates
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type TEXT NOT NULL, 
    subject_template TEXT NOT NULL,
    heading_template TEXT,
    body_template TEXT, 
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, type)
);

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

-- Helper: Is Admin (Super Admin Support)
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = user_uuid
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Make Super Admin
CREATE OR REPLACE FUNCTION public.make_super_admin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    target_uuid UUID;
BEGIN
    SELECT id INTO target_uuid FROM auth.users WHERE email = user_email;
    IF target_uuid IS NULL THEN
        RETURN 'Error: User ' || user_email || ' not found in auth.users';
    END IF;
    INSERT INTO user_roles (user_id, role, tenant_id)
    VALUES (target_uuid, 'admin', NULL)
    ON CONFLICT (user_id, tenant_id, role) DO NOTHING;
    RETURN 'Success: ' || user_email || ' is now a Super Admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: RBAC Check (The Central Authority)
CREATE OR REPLACE FUNCTION public.user_has_permission(
    user_uuid UUID,
    permission_name_param TEXT,
    tenant_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    -- 1. Check for Super Admin
    IF EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = user_uuid AND role = 'admin' AND tenant_id IS NULL
    ) THEN
        RETURN TRUE;
    END IF;

    -- 2. Check for Tenant Admin
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

-- Logic: Seed Default Email Templates
CREATE OR REPLACE FUNCTION seed_default_email_templates()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO email_templates (tenant_id, type, subject_template, heading_template, body_template)
    VALUES 
    (NEW.id, 'shipment_status', 'Shipment Update: {{status}}', 'Your shipment is {{status}}', 'Your shipment {{tracking_number}} has moved to {{status}}. Check the link below for details.'),
    (NEW.id, 'shipment_delivered', 'Delivered: {{tracking_number}}', 'Package Delivered!', 'Good news! Your package {{tracking_number}} has been delivered.'),
    (NEW.id, 'shipment_exception', 'generated-exception', 'Shipment Exception', 'There is an issue with your shipment {{tracking_number}}. Please contact support.')
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_tenant_created_seed_templates
    AFTER INSERT ON tenants
    FOR EACH ROW
    EXECUTE PROCEDURE seed_default_email_templates();

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

-- Logic: Notify Shipment Email (Legacy Direct)
CREATE OR REPLACE FUNCTION notify_shipment_email()
RETURNS TRIGGER AS $$
DECLARE
  api_url TEXT;
  auth_header TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('delivered', 'info_received', 'exception', 'out_for_delivery') THEN
    api_url := current_setting('app.api_url', true) || '/api/notifications/send-email';
    auth_header := 'Bearer ' || current_setting('app.cron_secret', true);

    IF NEW.customer_details->>'email' IS NOT NULL THEN
        PERFORM net.http_post(
          url := api_url,
          headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', auth_header),
          body := jsonb_build_object(
            'shipment_id', NEW.id,
            'tenant_id', NEW.tenant_id,
            'old_status', OLD.status,
            'new_status', NEW.status,
            'tracking_code', NEW.carrier_tracking_code,
            'reference_code', NEW.white_label_code,
            'customer_email', NEW.customer_details->>'email',
            'customer_name', NEW.customer_details->>'name',
            'invoice_amount', (NEW.invoice_details->>'amount')::NUMERIC,
            'invoice_currency', NEW.invoice_details->>'currency'
          )
        );
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_shipment_status_change_email
  AFTER UPDATE ON shipments
  FOR EACH ROW EXECUTE PROCEDURE notify_shipment_email();

-- =============================================================
-- 7. AUTOMATION (CRON JOBS)
-- =============================================================
SELECT cron.schedule('sync-shipments-job', '* * * * *', $$
  SELECT net.http_get(
    url := current_setting('app.api_url', true) || '/api/cron/sync-shipments',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || current_setting('app.cron_secret', true))
  );
$$);

SELECT cron.schedule('process-notification-queue', '* * * * *', $$
  SELECT net.http_post(
    url := current_setting('app.api_url', true) || '/api/notifications/process-queue',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || current_setting('app.cron_secret', true)),
    body := '{}'::jsonb
  );
$$);

SELECT cron.schedule('lead-maintenance-automation', '0 2 * * *', 'SELECT public.handle_lead_maintenance()');
SELECT cron.schedule('purge-unread-notifications', '0 3 * * *', 'SELECT purge_old_notifications()');

-- =============================================================
-- 8. RLS POLICIES (COMPREHENSIVE)
-- =============================================================

-- A. Enable RLS on ALL Tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_notification_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 1. Tenants
CREATE POLICY tenants_select ON tenants FOR SELECT USING (
    (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND tenant_id IS NULL))
    OR id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

-- 2. User Tenants
CREATE POLICY user_tenants_select ON user_tenants FOR SELECT USING (user_id = auth.uid());

-- 3. Profiles
CREATE POLICY profiles_select ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (id = auth.uid());

-- 4. RBAC (Roles, Permissions)
CREATE POLICY roles_select ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY permissions_select ON permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY role_permissions_select ON role_permissions FOR SELECT TO authenticated USING (true);

-- 5. User Roles
CREATE POLICY user_roles_select ON user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_roles_manage ON user_roles FOR ALL USING (
    (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND tenant_id IS NULL))
    OR 
    (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()) 
     AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND tenant_id = user_roles.tenant_id AND role = 'admin'))
);

-- 6. Shipments
CREATE POLICY shipments_isolation ON shipments FOR ALL USING (
    (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND tenant_id IS NULL))
    OR tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

-- 7. Tracking Events (Linked to Shipments)
CREATE POLICY tracking_events_select ON tracking_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM shipments s WHERE s.id = tracking_events.shipment_id AND (
        (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND tenant_id IS NULL))
        OR s.tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    ))
);

-- 8. Leads
CREATE POLICY leads_isolation ON leads FOR ALL USING (
    (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND tenant_id IS NULL))
    OR tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

-- 9. Settings
CREATE POLICY settings_select ON settings FOR SELECT USING (
    (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND tenant_id IS NULL))
    OR tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);
CREATE POLICY settings_update ON settings FOR UPDATE USING (
    (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND tenant_id IS NULL))
    OR (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()) 
        AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND tenant_id = settings.tenant_id AND role IN ('admin', 'staff')))
);

-- 10. Carriers
CREATE POLICY carriers_select ON carriers FOR SELECT TO authenticated USING (true);
CREATE POLICY carriers_manage ON carriers FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND tenant_id IS NULL)
);

-- 11. Notification Configs
CREATE POLICY tenant_notification_configs_select ON tenant_notification_configs FOR SELECT USING (
    (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND tenant_id IS NULL))
    OR tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);
CREATE POLICY tenant_notification_configs_modify ON tenant_notification_configs FOR ALL USING (
    (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND tenant_id IS NULL))
    OR (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()) 
        AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND tenant_id = tenant_notification_configs.tenant_id AND role = 'admin'))
);

-- 12. Notification Logs
CREATE POLICY notification_logs_isolation ON notification_logs FOR SELECT USING (
    (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND tenant_id IS NULL))
    OR tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

-- 13. Email Templates
CREATE POLICY email_templates_select ON email_templates FOR SELECT USING (
    (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND tenant_id IS NULL))
    OR tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);
CREATE POLICY email_templates_modify ON email_templates FOR ALL USING (
    (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND tenant_id IS NULL))
    OR (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
        AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND tenant_id = email_templates.tenant_id AND role = 'admin'))
);

-- 14. Notifications (Queue) & In-App
CREATE POLICY in_app_notifications_select ON in_app_notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY in_app_notifications_update ON in_app_notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY in_app_notifications_delete ON in_app_notifications FOR DELETE USING (user_id = auth.uid());

CREATE POLICY queue_notifications_isolation ON notifications FOR ALL USING (
     (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND tenant_id IS NULL))
    OR tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

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

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'staff' AND p.name IN ('leads.view', 'leads.create', 'leads.update', 'shipments.view', 'shipments.create', 'shipments.update')
ON CONFLICT DO NOTHING;

-- =============================================================
-- END OF CONSOLIDATED MIGRATION
-- =============================================================
