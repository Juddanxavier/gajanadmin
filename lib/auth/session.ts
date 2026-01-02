import { getUserTenantIds } from '@/lib/utils/permissions'

export async function getCurrentTenantId(): Promise<string | null> {
  const tenants = await getUserTenantIds()
  // For now, assuming single tenant per user or defaulting to the first one
  return tenants[0] || null
}
