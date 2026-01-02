-- =====================================================
-- Multi-Tenant RBAC System Migration
-- =====================================================
-- This migration creates a comprehensive system with:
-- - Tenants: India, Sri Lanka
-- - Roles: admin, staff, customer
-- - Permissions for granular access control
-- - Role-permission mappings
-- - User-role and user-tenant assignments
-- - RLS policies for security
-- =====================================================

-- =====================================================
-- TENANTS
-- =====================================================

-- Create tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_tenants mapping table
CREATE TABLE IF NOT EXISTS public.user_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, tenant_id)
);

-- Insert default tenants
INSERT INTO public.tenants (name, code, description) VALUES
    ('India', 'IN', 'India operations'),
    ('Sri Lanka', 'LK', 'Sri Lanka operations')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- ROLES & PERMISSIONS
-- =====================================================

-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL, -- e.g., 'users', 'products', 'orders'
    action VARCHAR(50) NOT NULL,   -- e.g., 'create', 'read', 'update', 'delete'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(resource, action)
);

-- Create role_permissions mapping table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, role_id)
);

-- =====================================================
-- Insert default roles
-- =====================================================
INSERT INTO public.roles (name, description) VALUES
    ('admin', 'Full system access with all permissions'),
    ('staff', 'Staff member with limited administrative access'),
    ('customer', 'Regular customer with basic access')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- Insert default permissions
-- =====================================================
INSERT INTO public.permissions (name, resource, action, description) VALUES
    -- User management permissions
    ('users.create', 'users', 'create', 'Create new users'),
    ('users.read', 'users', 'read', 'View user information'),
    ('users.update', 'users', 'update', 'Update user information'),
    ('users.delete', 'users', 'delete', 'Delete users'),
    
    -- Role management permissions
    ('roles.create', 'roles', 'create', 'Create new roles'),
    ('roles.read', 'roles', 'read', 'View roles'),
    ('roles.update', 'roles', 'update', 'Update roles'),
    ('roles.delete', 'roles', 'delete', 'Delete roles'),
    
    -- Permission management
    ('permissions.manage', 'permissions', 'manage', 'Manage permissions'),
    
    -- Product management permissions
    ('products.create', 'products', 'create', 'Create new products'),
    ('products.read', 'products', 'read', 'View products'),
    ('products.update', 'products', 'update', 'Update products'),
    ('products.delete', 'products', 'delete', 'Delete products'),
    
    -- Order management permissions
    ('orders.create', 'orders', 'create', 'Create new orders'),
    ('orders.read', 'orders', 'read', 'View orders'),
    ('orders.update', 'orders', 'update', 'Update orders'),
    ('orders.delete', 'orders', 'delete', 'Delete orders'),
    ('orders.read_own', 'orders', 'read_own', 'View own orders only'),
    
    -- Dashboard access
    ('dashboard.access', 'dashboard', 'access', 'Access admin dashboard'),
    ('dashboard.analytics', 'dashboard', 'analytics', 'View analytics'),
    
    -- Settings permissions
    ('settings.read', 'settings', 'read', 'View settings'),
    ('settings.update', 'settings', 'update', 'Update settings')
ON CONFLICT (resource, action) DO NOTHING;

-- =====================================================
-- Assign permissions to roles
-- =====================================================

-- Admin gets all permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    r.id,
    p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Staff permissions (limited admin access)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    r.id,
    p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'staff'
AND p.name IN (
    'users.read',
    'products.create',
    'products.read',
    'products.update',
    'orders.create',
    'orders.read',
    'orders.update',
    'dashboard.access',
    'dashboard.analytics',
    'settings.read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Customer permissions (basic access)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    r.id,
    p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'customer'
AND p.name IN (
    'products.read',
    'orders.create',
    'orders.read_own'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(user_uuid UUID)
RETURNS TABLE (role_name VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT r.name
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.user_has_role(user_uuid UUID, role_name_param VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = user_uuid
        AND r.name = role_name_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(user_uuid UUID, permission_name_param VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = user_uuid
        AND p.name = permission_name_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_uuid UUID)
RETURNS TABLE (permission_name VARCHAR, resource VARCHAR, action VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.name, p.resource, p.action
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.user_has_role(user_uuid, 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Tenant Helper Functions
-- =====================================================

-- Function to get user tenants
CREATE OR REPLACE FUNCTION public.get_user_tenants(user_uuid UUID)
RETURNS TABLE (tenant_id UUID, tenant_name VARCHAR, tenant_code VARCHAR, is_default BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.name, t.code, ut.is_default
    FROM public.user_tenants ut
    JOIN public.tenants t ON ut.tenant_id = t.id
    WHERE ut.user_id = user_uuid
    AND t.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to tenant
CREATE OR REPLACE FUNCTION public.user_has_tenant_access(user_uuid UUID, tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_tenants ut
        JOIN public.tenants t ON ut.tenant_id = t.id
        WHERE ut.user_id = user_uuid
        AND ut.tenant_id = tenant_uuid
        AND t.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's default tenant
CREATE OR REPLACE FUNCTION public.get_user_default_tenant(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
    default_tenant_id UUID;
BEGIN
    SELECT tenant_id INTO default_tenant_id
    FROM public.user_tenants
    WHERE user_id = user_uuid
    AND is_default = true
    LIMIT 1;
    
    -- If no default tenant, return first tenant
    IF default_tenant_id IS NULL THEN
        SELECT tenant_id INTO default_tenant_id
        FROM public.user_tenants
        WHERE user_id = user_uuid
        LIMIT 1;
    END IF;
    
    RETURN default_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set user's default tenant
CREATE OR REPLACE FUNCTION public.set_user_default_tenant(user_uuid UUID, tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- First, unset all defaults for this user
    UPDATE public.user_tenants
    SET is_default = false
    WHERE user_id = user_uuid;
    
    -- Then set the new default
    UPDATE public.user_tenants
    SET is_default = true
    WHERE user_id = user_uuid
    AND tenant_id = tenant_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Tenant Policies
-- =====================================================

-- Tenants table policies
CREATE POLICY "Admins can manage tenants"
    ON public.tenants
    FOR ALL
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Everyone can view active tenants"
    ON public.tenants
    FOR SELECT
    USING (is_active = true);

-- User tenants table policies
CREATE POLICY "Admins can manage user tenants"
    ON public.user_tenants
    FOR ALL
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own tenant assignments"
    ON public.user_tenants
    FOR SELECT
    USING (auth.uid() = user_id);

-- =====================================================
-- Role & Permission Policies
-- =====================================================


-- Roles table policies
CREATE POLICY "Admins can manage roles"
    ON public.roles
    FOR ALL
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Everyone can view roles"
    ON public.roles
    FOR SELECT
    USING (true);

-- Permissions table policies
CREATE POLICY "Admins can manage permissions"
    ON public.permissions
    FOR ALL
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Everyone can view permissions"
    ON public.permissions
    FOR SELECT
    USING (true);

-- Role permissions table policies
CREATE POLICY "Admins can manage role permissions"
    ON public.role_permissions
    FOR ALL
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Everyone can view role permissions"
    ON public.role_permissions
    FOR SELECT
    USING (true);

-- User roles table policies
CREATE POLICY "Admins can manage user roles"
    ON public.user_roles
    FOR ALL
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own roles"
    ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id);

-- =====================================================
-- Indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON public.user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id ON public.user_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_default ON public.user_tenants(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON public.permissions(resource, action);


-- =====================================================
-- Updated_at trigger
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();


-- =====================================================
-- Grant permissions
-- =====================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.tenants TO anon, authenticated;
GRANT SELECT ON public.user_tenants TO authenticated;
GRANT SELECT ON public.roles TO anon, authenticated;
GRANT SELECT ON public.permissions TO anon, authenticated;
GRANT SELECT ON public.role_permissions TO anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_user_roles(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_role(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenants(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_tenant_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_default_tenant(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_default_tenant(UUID, UUID) TO authenticated;


-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE public.tenants IS 'Stores tenant information (India, Sri Lanka)';
COMMENT ON TABLE public.user_tenants IS 'Maps users to their accessible tenants';
COMMENT ON TABLE public.roles IS 'Stores system roles (admin, staff, customer)';
COMMENT ON TABLE public.permissions IS 'Stores granular permissions for resources and actions';
COMMENT ON TABLE public.role_permissions IS 'Maps roles to their permissions';
COMMENT ON TABLE public.user_roles IS 'Assigns roles to users';

COMMENT ON FUNCTION public.get_user_tenants(UUID) IS 'Returns all tenants accessible to a user';
COMMENT ON FUNCTION public.user_has_tenant_access(UUID, UUID) IS 'Checks if a user has access to a specific tenant';
COMMENT ON FUNCTION public.get_user_default_tenant(UUID) IS 'Returns the default tenant ID for a user';
COMMENT ON FUNCTION public.set_user_default_tenant(UUID, UUID) IS 'Sets the default tenant for a user';
COMMENT ON FUNCTION public.get_user_roles(UUID) IS 'Returns all role names for a given user';
COMMENT ON FUNCTION public.user_has_role(UUID, VARCHAR) IS 'Checks if a user has a specific role';
COMMENT ON FUNCTION public.user_has_permission(UUID, VARCHAR) IS 'Checks if a user has a specific permission';
COMMENT ON FUNCTION public.get_user_permissions(UUID) IS 'Returns all permissions for a given user';
COMMENT ON FUNCTION public.is_admin(UUID) IS 'Checks if a user has the admin role';

