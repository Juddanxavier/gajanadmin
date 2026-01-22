-- Enable RLS on tables (good practice, verifies it's on)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (optional, but cleaner for debugging)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_tenants;

-- Create simple read policies for authenticated users
-- This allows any logged-in user to SEE the user list
-- You can refine this later to only allow 'admins' if needed

CREATE POLICY "Enable read access for authenticated users" ON profiles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable read access for authenticated users" ON user_roles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable read access for authenticated users" ON user_tenants
    FOR SELECT
    TO authenticated
    USING (true);

-- Verify policies are created (optional)
SELECT * FROM pg_policies WHERE tablename IN ('profiles', 'user_roles', 'user_tenants');
