/**
 * Get potential team members for assignment (Admins & Staff)
 *
 * @format
 */

export async function getTeamMembersAction(): Promise<
  ActionResponse<UserDisplay[]>
> {
  try {
    const supabase = createAdminClient();
    const userTenantIds = await getUserTenantIds();
    const isGlobalAdmin = await isAdmin();

    let query = supabase
      .from('admin_profile_view')
      .select(
        `
        id, email, display_name, full_name, phone,
        user_roles!inner(role),
        user_tenants(tenant_id)
      `,
      )
      .in('user_roles.role', ['admin', 'staff']); // Only fetch staff/admins

    // Context filtering
    if (!isGlobalAdmin) {
      // Must share at least one tenant
      // For simplicity in this action, we just check if they are in ANY of the current user's tenants
      // Ideally, we'd filter by the specific lead's tenant, but this is a generic "team" fetch.
      // Let's rely on intersecting tenants.
      query = query.in('user_tenants.tenant_id', userTenantIds);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Deduplicate users (due to joins) and format
    const uniqueUsers = new Map();
    data?.forEach((p: any) => {
      if (!uniqueUsers.has(p.id)) {
        uniqueUsers.set(p.id, {
          id: p.id,
          email: p.email,
          name: p.display_name || p.full_name || p.email.split('@')[0],
          phone: p.phone,
          roles: [], // Simplified for dropdown
          tenants: [],
          created_at: '',
          last_sign_in_at: null,
          email_confirmed_at: null,
        });
      }
    });

    return successResponse(Array.from(uniqueUsers.values()));
  } catch (error) {
    console.error('getTeamMembersAction error:', error);
    return errorResponse(error);
  }
}
