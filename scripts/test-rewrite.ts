/** @format */

import { getUsers } from '../app/(dashboard)/users/actions';
import { createAdminClient } from '../lib/supabase/admin';

// Mock permissions for the test context if needed,
// but since we are running as a script, we might need to mock the `permissions.ts` or just rely on the fact
// that `isAdmin` checks `auth.getUser()`.
// In a script context, `auth.getUser()` usually returns null unless we sign in.

// Use a trick: We can't easily mock `isAdmin` without dependency injection or complex mocking.
// However, we can test the `createAdminClient` part directly or try to call `getUsers` and expect an error or empty result (if not admin).

// Better approach: Test the raw query logic if possible.
// Or just verify the file compiles and imports correctly by running it.

async function testRewrite() {
  console.log('🧪 Testing User Management Rewrite...');

  try {
    // 1. Validate createAdminClient works
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('profiles')
      .select('id, email')
      .limit(1);

    if (error) {
      console.error('❌ Admin Client failed:', error);
      return;
    }
    console.log(`✅ Admin Client working. Found ${data.length} profiles.`);

    // 2. Validate getUsers (will likely return empty due to no auth context, but shouldn't crash)
    console.log('   Invoking getUsers()...');
    // Note: This might fail if headers/cookies are missing in script environment for `createClient`
    // We expect it to handle the failure of "getting permission" gracefully (e.g. return empty or error context).

    // Actually, `isAdmin` calls `createClient` which calls `cookies()`.
    // Running this in pure Node script (ts-node) will crash on `cookies()`.
    // So we can't fully test the action this way without mocking Next.js internals.

    console.log(
      '   ⚠️ tailored test: skipping direct action call due to "cookies()" dependency.',
    );
    console.log('   ✅ Imports validated.');
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testRewrite();
