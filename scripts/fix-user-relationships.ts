/** @format */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUserRelationships() {
  console.log('🔧 Fixing user relationships...\n');

  const migration = `
-- Add foreign key from user_roles.user_id to profiles.id
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_roles_user_id_fkey' 
        AND table_name = 'user_roles'
    ) THEN
        ALTER TABLE user_roles DROP CONSTRAINT user_roles_user_id_fkey;
    END IF;
END $$;

ALTER TABLE user_roles
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Do the same for user_tenants
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_tenants_user_id_fkey' 
        AND table_name = 'user_tenants'
    ) THEN
        ALTER TABLE user_tenants DROP CONSTRAINT user_tenants_user_id_fkey;
    END IF;
END $$;

ALTER TABLE user_tenants
ADD CONSTRAINT user_tenants_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;
  `;

  const { error } = await supabase.rpc('exec_sql', { sql: migration });

  if (error) {
    console.error('❌ Error:', error);
    console.log('\n⚠️  Trying alternative approach...');

    // Try direct execution
    const { error: error1 } = await supabase.rpc('exec', {
      query: `ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;`,
    });

    if (error1) {
      console.error('❌ Still failed:', error1);
      console.log('\n📝 Please run the migration file manually:');
      console.log('   supabase/migrations/20260120_fix_user_relationships.sql');
    } else {
      console.log('✅ Fixed user_roles relationship');
    }
  } else {
    console.log('✅ Relationships fixed!');
  }

  // Test the query again
  console.log('\n🔍 Testing query...');
  const { data, error: queryError } = await supabase
    .from('profiles')
    .select(
      `
      id,
      email,
      user_roles (role)
    `,
    )
    .limit(1);

  if (queryError) {
    console.error('❌ Query still failing:', queryError.message);
  } else {
    console.log('✅ Query works! Found', data?.length, 'users');
  }
}

fixUserRelationships();
