'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Check if user is authorized (admin or staff)
 * Redirects to login if not authenticated
 * Redirects to unauthorized page if not admin/staff
 */
export async function checkAdminAccess() {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    // Not authenticated - redirect to login
    redirect('/login');
  }

  // Check user role
  const { data: userRoles, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);
  
  if (roleError) {
     console.error("Role check error:", roleError);
     await supabase.auth.signOut();
     redirect('/login?error=unauthorized');
  }
  
  // Transform the response: [{ role: 'admin' }] -> ['admin']
  const roles = userRoles?.map((ur: any) => ur.role).filter(Boolean) || [];
  
  const hasAccess = roles.some(r => ['admin', 'staff'].includes(r));

  if (!hasAccess) {
    // User doesn't have admin or staff role - sign out and redirect
    await supabase.auth.signOut();
    redirect('/login?error=unauthorized');
  }

  return { user, role: roles[0] };
}

/**
 * Sign out user
 */
export async function signOutUser() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
