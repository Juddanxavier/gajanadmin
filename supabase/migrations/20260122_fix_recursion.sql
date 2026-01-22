-- Fix Infinite Recursion in RLS Policies
-- The issue is that policies on 'user_roles' query 'user_roles' directly, triggering the policy again.
-- Solution: Use SECURITY DEFINER functions to check roles. These functions run with the privileges of the creator (postgres), bypassing RLS.

-- 1. Create secure helper functions
CREATE OR REPLACE FUNCTION public.check_is_global_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = $1 
    AND role = 'admin' 
    AND tenant_id IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.check_is_tenant_admin(user_id uuid, tenant_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = $1 
    AND tenant_id = $2
    AND role = 'admin'
  );
$$;

-- 2. Update user_roles policies to use these functions
DROP POLICY IF EXISTS "user_roles_manage" ON user_roles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_roles;
DROP POLICY IF EXISTS "user_roles_select" ON user_roles;

-- Allow users to read their own roles
CREATE POLICY "user_roles_read_own" ON user_roles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Allow Global Admins to do everything
CREATE POLICY "user_roles_global_admin" ON user_roles
    FOR ALL
    TO authenticated
    USING (check_is_global_admin(auth.uid()));

-- Allow Tenant Admins to manage roles in their tenant
CREATE POLICY "user_roles_tenant_admin" ON user_roles
    FOR ALL
    TO authenticated
    USING (
        tenant_id IS NOT NULL 
        AND check_is_tenant_admin(auth.uid(), tenant_id)
    );

-- 3. Update other tables that were causing recursion (tenants, etc) to be safe
-- Tenants
DROP POLICY IF EXISTS "tenants_select" ON tenants;
CREATE POLICY "tenants_select" ON tenants 
    FOR SELECT 
    USING (
        check_is_global_admin(auth.uid())
        OR id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    );

-- 4. Settings (often joined)
DROP POLICY IF EXISTS "settings_select" ON settings;
CREATE POLICY "settings_select" ON settings 
    FOR SELECT 
    USING (
        check_is_global_admin(auth.uid())
        OR tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "settings_update" ON settings;
CREATE POLICY "settings_update" ON settings 
    FOR UPDATE 
    USING (
        check_is_global_admin(auth.uid())
        OR check_is_tenant_admin(auth.uid(), tenant_id)
    );
