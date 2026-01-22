/** @format */

'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export async function signOutAndRedirect(redirectTo: string = '/login') {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(redirectTo);
}

export async function checkUserAccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { authorized: false, isAuthenticated: false };

  // Use Admin Client to bypass RLS policies on user_roles table
  const admin = createAdminClient();

  // 1. Check Global Admin
  const { data: isGlobalAdmin } = await admin.rpc('is_admin', {
    user_uuid: user.id,
  });
  if (isGlobalAdmin) return { authorized: true, isAuthenticated: true };

  // 2. Check User Roles
  const { data: roles } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);
  const hasAccess = roles?.some((r) => ['admin', 'staff'].includes(r.role));

  return { authorized: !!hasAccess, isAuthenticated: true };
}
