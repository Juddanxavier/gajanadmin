-- Fix missing foreign key relationship between profiles and user_roles
-- This allows PostgREST to understand the relationship for nested queries

-- Drop constraints if they exist (standard SQL, no PL/pgSQL block needed)
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE user_tenants DROP CONSTRAINT IF EXISTS user_tenants_user_id_fkey;

-- Add foreign key from user_roles.user_id to profiles.id
ALTER TABLE user_roles
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Add foreign key from user_tenants.user_id to profiles.id
ALTER TABLE user_tenants
ADD CONSTRAINT user_tenants_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Verify the relationships
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('user_roles', 'user_tenants');
