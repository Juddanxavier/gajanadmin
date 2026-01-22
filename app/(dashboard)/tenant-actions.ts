/** @format */

'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function setTenantCookie(tenantId: string | 'all') {
  const cookieStore = await cookies();
  if (tenantId === 'all') {
    cookieStore.delete('admin_tenant_context');
  } else {
    cookieStore.set('admin_tenant_context', tenantId);
  }
  revalidatePath('/', 'layout');
}

export async function getTenantCookie() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_tenant_context')?.value;
}
