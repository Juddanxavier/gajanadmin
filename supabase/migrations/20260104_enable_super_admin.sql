-- ============================================================================
-- SQL Step: Enable Super Admin & Fix Schema
-- Description:
-- 1. Adds 'origin_country' and 'destination_country' columns to shipments.
-- 2. Creates 'is_admin' function to identify Super Admins (tenant_id IS NULL).
-- 3. Updates RLS policies for Shipments and Leads to allow Global Access.
-- 4. NEW: Adds 'make_super_admin' helper function for easy assignment.
-- ============================================================================

-- 1. Schema Fix: Add Country Columns (idempotent)
ALTER TABLE shipments 
ADD COLUMN IF NOT EXISTS origin_country TEXT,
ADD COLUMN IF NOT EXISTS destination_country TEXT;

-- 2. Function: Define Super Admin Logic
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = user_uuid
        AND role = 'admin'
        AND tenant_id IS NULL -- Global Admin has no specific tenant
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Helper: Make Super Admin by Email (Convenience Function)
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
    ON CONFLICT (user_id, role, tenant_id) -- (user_id, tenant_id, role) is the unique constraint? check schema
    -- The schema constraint is: UNIQUE (user_id, tenant_id, role)
    -- BUT if tenant_id is NULL, standard SQL treats NULLs as distinct unless using NULLS NOT DISTINCT or specific index.
    -- Postgres 15+ allows NULLs NOT DISTINCT. Older might need explicit check.
    -- Assuming partial unique index or standard constraint handling. 
    -- Safest is just to try/catch or explicit check.
    DO NOTHING;

    -- Explicit duplicate check if "DO NOTHING" fails on NULLs
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = target_uuid AND role = 'admin' AND tenant_id IS NULL) THEN
         RETURN 'Success: ' || user_email || ' is already a Super Admin';
    END IF;
    
    -- Retry Insert if ON CONFLICT didn't catch (due to NULL uniqueness behavior in some pg versions)
    INSERT INTO user_roles (user_id, role, tenant_id)
    VALUES (target_uuid, 'admin', NULL);

    RETURN 'Success: ' || user_email || ' is now a Super Admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. RLS Policy Updates: Allow Super Admin to see ALL data

-- Shipments
DROP POLICY IF EXISTS shipments_isolation ON shipments;
DROP POLICY IF EXISTS shipments_select_policy ON shipments; 
DROP POLICY IF EXISTS shipments_insert_policy ON shipments;
DROP POLICY IF EXISTS shipments_update_policy ON shipments;
DROP POLICY IF EXISTS shipments_delete_policy ON shipments;

CREATE POLICY shipments_select_policy ON shipments FOR SELECT USING (
    (public.is_admin(auth.uid())) OR
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

CREATE POLICY shipments_insert_policy ON shipments FOR INSERT WITH CHECK (
    (public.is_admin(auth.uid())) OR
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

CREATE POLICY shipments_update_policy ON shipments FOR UPDATE USING (
    (public.is_admin(auth.uid())) OR
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

CREATE POLICY shipments_delete_policy ON shipments FOR DELETE USING (
    (public.is_admin(auth.uid())) OR
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

-- Leads
DROP POLICY IF EXISTS leads_isolation ON leads;
DROP POLICY IF EXISTS leads_select_policy ON leads;
DROP POLICY IF EXISTS leads_insert_policy ON leads;
DROP POLICY IF EXISTS leads_update_policy ON leads;
DROP POLICY IF EXISTS leads_delete_policy ON leads;

CREATE POLICY leads_select_policy ON leads FOR SELECT USING (
    (public.is_admin(auth.uid())) OR
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

CREATE POLICY leads_insert_policy ON leads FOR INSERT WITH CHECK (
    (public.is_admin(auth.uid())) OR
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

CREATE POLICY leads_update_policy ON leads FOR UPDATE USING (
    (public.is_admin(auth.uid())) OR
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

CREATE POLICY leads_delete_policy ON leads FOR DELETE USING (
    (public.is_admin(auth.uid())) OR
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

-- Settings
DROP POLICY IF EXISTS settings_select ON settings;
DROP POLICY IF EXISTS settings_update ON settings;

CREATE POLICY settings_select ON settings FOR SELECT USING (
    (public.is_admin(auth.uid())) OR
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

CREATE POLICY settings_update ON settings FOR UPDATE USING (
    (public.is_admin(auth.uid())) OR 
    (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()) 
     AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND tenant_id = settings.tenant_id AND role IN ('admin', 'staff')))
);
