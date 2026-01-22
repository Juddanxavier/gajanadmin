/** @format */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { UserDetailsClient } from '@/components/users/user-details-client';
import { getRoles, getTenants } from '@/app/(dashboard)/users/actions';
import type { UserDisplay } from '@/lib/types';

// Helper to fetch single user with full admin rights
async function getUserDetails(userId: string): Promise<UserDisplay | null> {
  const supabase = createAdminClient();

  // 1. Fetch Profile + Relations
  // Note: We use !inner joins or standard joins based on need, but for single GET
  // we just want everything.
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      id, email, display_name, full_name, phone, created_at,
      user_roles(role),
      user_tenants(tenant_id, tenants(id, name, country_code))
    `,
    )
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  // 2. Fetch Auth Metadata for extra fields like email_confirmed_at
  const {
    data: { user: authUser },
  } = await supabase.auth.admin.getUserById(userId);

  // 3. Transform
  return {
    id: data.id,
    email: data.email,
    name: data.display_name || data.full_name || data.email.split('@')[0],
    phone: data.phone,
    roles: (data.user_roles || []).map((ur: any) => ({
      id: ur.role,
      name: ur.role,
      description: null,
      created_at: '',
      updated_at: '',
    })),
    tenants: (data.user_tenants || [])
      .map((ut: any) => ({
        ...ut.tenants,
        code: ut.tenants?.country_code,
      }))
      .filter(Boolean),
    created_at: data.created_at,
    last_sign_in_at: authUser?.last_sign_in_at || null,
    email_confirmed_at: authUser?.email_confirmed_at || null,
  };
}

// Wrapper for data fetching
async function UserDetailsContent({ userId }: { userId: string }) {
  const supabase = await createClient(); // Auth Context
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (currentUser) {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id);
    isAdmin = data?.some((r) => r.role === 'admin') || false;
  }

  const [user, roles, tenants] = await Promise.all([
    getUserDetails(userId),
    getRoles(),
    getTenants(),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <UserDetailsClient
      user={user}
      roles={roles}
      tenants={tenants}
      isAdmin={isAdmin}
    />
  );
}

export default async function UserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className='flex-1 space-y-6 p-8 pt-6'>
          <div className='flex items-center gap-4'>
            <div className='h-10 w-10 rounded-md bg-muted animate-pulse' />
            <div className='space-y-2'>
              <div className='h-8 w-48 bg-muted rounded animate-pulse' />
              <div className='h-4 w-64 bg-muted rounded animate-pulse' />
            </div>
          </div>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {[...Array(4)].map((_, i) => (
              <div key={i} className='h-32 bg-muted rounded-lg animate-pulse' />
            ))}
          </div>
        </div>
      }>
      <UserDetailsContent userId={id} />
    </Suspense>
  );
}
