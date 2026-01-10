/** @format */

import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  UserDisplay,
  UserTableFilters,
  PaginatedResponse,
  CreateUserInput,
  UpdateUserInput,
  UserStats,
} from '@/lib/types/index';

export class UserService {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async getUsers(
    page: number = 0,
    pageSize: number = 10,
    filters: UserTableFilters & {
      tenantIds?: string[];
      excludeAdmins?: boolean;
    } = {},
    sortBy?: { id: string; desc: boolean }
  ): Promise<PaginatedResponse<UserDisplay>> {
    console.log('UserService.getUsers', { page, pageSize, filters });

    // Use left joins to ensure users without certain relations still appear (unless filtered)
    // Dynamic Join Construction
    // If filtering, we use a separate alias `match_roles` with !inner join to filter parent rows,
    // while keeping `user_roles` as a standard left join to display ALL roles for that user.

    const isFilteringRoles = filters.role || filters.excludeAdmins;
    // Use user_tenants for tenant filtering (membership), distinct from roles
    const isFilteringTenants =
      filters.tenant || (filters.tenantIds && filters.tenantIds.length > 0);

    let query = this.client.from('profiles').select(
      `
        id,
        email,
        display_name,
        full_name,
        avatar_url,
        phone,
        created_at,
        updated_at,
        last_sign_in_at,
        user_roles (
          role,
          tenant_id
        ),
        ${isFilteringRoles ? 'match_roles:user_roles!inner(role, tenant_id),' : ''}
        ${isFilteringTenants ? 'match_tenants:user_tenants!inner(tenant_id),' : ''}
        user_tenants (
          tenant_id,
          tenants (
            id,
            name,
            slug,
            country_code
          )
        )
      `,
      { count: 'exact' }
    );

    // 1. Apply Filters

    // Role Filter
    if (filters.role) {
      query = query.eq('match_roles.role', filters.role);
    }

    // Exclude Admins (Restrict to only Staff and Customer roles)
    // This implements the "Staff should see only customers and staff" requirement strictly.
    if (filters.excludeAdmins) {
      query = query.in('match_roles.role', ['staff', 'customer']);
    }

    // Tenant Filter (Specific Selection)
    if (filters.tenant) {
      query = query.eq('match_tenants.tenant_id', filters.tenant);
    }

    // Tenant Scope (RBAC Restriction)
    if (filters.tenantIds && filters.tenantIds.length > 0) {
      query = query.in('match_tenants.tenant_id', filters.tenantIds);
    }

    // Search (Email or Name)
    if (filters.search) {
      const q = `%${filters.search}%`;
      query = query.or(
        `email.ilike.${q},display_name.ilike.${q},full_name.ilike.${q}`
      );
    }

    // Date Filters
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo.toISOString());
    }

    // 2. Sorting
    if (sortBy) {
      const column = sortBy.id === 'name' ? 'display_name' : sortBy.id;
      query = query.order(column, { ascending: !sortBy.desc });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // 3. Pagination
    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: profiles, count, error } = await query;
    if (error) {
      console.error('UserService.getUsers error:', error);
      throw error;
    }

    // 4. Transform Result
    const users: UserDisplay[] = (profiles || []).map((p: any) => {
      // Deduplicate roles (a user can have multiple records in user_roles if they have roles in different tenants)
      const roles = Array.from(new Set(p.user_roles.map((ur: any) => ur.role)));

      return {
        id: p.id,
        email: p.email,
        name: p.display_name || p.full_name || p.email.split('@')[0],
        phone: p.phone,
        // Match expected UserDisplay.roles type (Role[])
        roles: roles.map((r) => ({
          id: r as string,
          name: r as string,
          description: null,
          created_at: p.created_at,
          updated_at: p.updated_at,
        })) as any[], // Use any[] if full Role object fields are strictly missing in the mock
        tenants:
          p.user_tenants
            ?.map((ut: any) => ({
              ...ut.tenants,
              code: ut.tenants.country_code,
            }))
            .filter(Boolean) || [],
        created_at: p.created_at,
        last_sign_in_at: p.last_sign_in_at,
        email_confirmed_at: null,
      };
    });

    return {
      data: users,
      total: count || 0,
      pageCount: count ? Math.ceil(count / pageSize) : 0,
    };
  }

  async createUser(
    input: CreateUserInput,
    creatorId: string
  ): Promise<UserDisplay | undefined> {
    const adminClient = createAdminClient();
    const { data: newUser, error } = await adminClient.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      phone: input.phone,
      user_metadata: {
        display_name: input.name,
        full_name: input.name,
      },
    });

    if (error) throw error;
    if (!newUser.user) throw new Error('Failed to create user');

    // We don't need to manually insert into profiles here, the trigger handles it.

    // Assign Role (Globally or to a specific tenant if provided)
    // For now, if no tenant is provided, we assign to 'None' or just let it be.
    // Usually admin creation via UI requires a role and tenant.
    if (input.role) {
      await adminClient.from('user_roles').insert({
        user_id: newUser.user.id,
        role: input.role, // Now TEXT
        tenant_id: input.tenant, // Can be null if global
      });
    }

    if (input.tenant) {
      await adminClient.from('user_tenants').insert({
        user_id: newUser.user.id,
        tenant_id: input.tenant,
        created_by: creatorId,
      });
    }

    return this.getUserDisplay(newUser.user.id);
  }

  async updateUser(
    userId: string,
    input: UpdateUserInput,
    updaterId: string
  ): Promise<UserDisplay | undefined> {
    const adminClient = createAdminClient();

    // Update Auth Metadata (Syncs to profile via trigger)
    if (input.email || input.phone || input.name) {
      const { error } = await adminClient.auth.admin.updateUserById(userId, {
        ...(input.email && { email: input.email }),
        ...(input.phone && { phone: input.phone }),
        user_metadata: {
          ...(input.name && {
            display_name: input.name,
            full_name: input.name,
          }),
        },
      });
      if (error) throw error;
    }

    // Update Roles
    if (input.roles && input.roles.length > 0) {
      await adminClient.from('user_roles').delete().eq('user_id', userId);
      for (const roleName of input.roles) {
        await adminClient.from('user_roles').insert({
          user_id: userId,
          role: roleName,
          tenant_id: input.tenants?.[0], // Simplified: assign role to the first tenant
        });
      }
    }

    // Update Tenants
    if (input.tenants) {
      await adminClient.from('user_tenants').delete().eq('user_id', userId);
      for (const tenantId of input.tenants) {
        await adminClient.from('user_tenants').insert({
          user_id: userId,
          tenant_id: tenantId,
          created_by: updaterId,
        });
      }
    }
    return this.getUserDisplay(userId);
  }

  async getUserDisplay(userId: string): Promise<UserDisplay | undefined> {
    const { data: p, error } = await this.client
      .from('profiles')
      .select(
        `
        *,
        user_roles (role),
        user_tenants (tenants (*))
      `
      )
      .eq('id', userId)
      .single();

    if (error || !p) return undefined;

    return {
      id: p.id,
      email: p.email,
      name: p.display_name || p.full_name || p.email.split('@')[0],
      phone: p.phone,
      roles: p.user_roles.map((ur: any) => ({ id: ur.role, name: ur.role })),
      tenants:
        p.user_tenants
          ?.map((ut: any) => ({
            ...ut.tenants,
            code: ut.tenants.country_code,
          }))
          .filter(Boolean) || [],
      created_at: p.created_at,
      last_sign_in_at: null,
      email_confirmed_at: null,
    };
  }

  async deleteUser(userId: string) {
    const adminClient = createAdminClient();
    // Cascade handles user_roles, user_tenants, and profiles
    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) throw error;
    return true;
  }

  async getStats(tenantIds?: string[]): Promise<UserStats> {
    // Build query for user_roles with optional tenant filtering
    let rolesQuery = this.client.from('user_roles').select('role, user_id');

    // If tenantIds provided, filter by those tenants
    // If undefined (Global tenant), no filter - see all
    if (tenantIds && tenantIds.length > 0) {
      rolesQuery = rolesQuery.in('tenant_id', tenantIds);
    }

    const { data: roles } = await rolesQuery;

    const stats: UserStats = {
      total: 0,
      active: 0,
      byRole: { admin: 0, staff: 0, customer: 0 },
      byTenant: {},
    };

    (roles || []).forEach((r) => {
      if (r.role === 'admin') stats.byRole.admin++;
      else if (r.role === 'staff') stats.byRole.staff++;
      else if (r.role === 'customer') stats.byRole.customer++;
    });

    // Get total user count with tenant filtering
    let profilesQuery = this.client
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    // If filtering by tenant, join with user_tenants
    if (tenantIds && tenantIds.length > 0) {
      // Count only users in specified tenants
      const { count } = await this.client
        .from('user_tenants')
        .select('user_id', { count: 'exact', head: true })
        .in('tenant_id', tenantIds);
      stats.total = count || 0;
    } else {
      // Global tenant - count all users
      const { count } = await profilesQuery;
      stats.total = count || 0;
    }

    return stats;
  }

  async getTeamMembers(tenantId?: string): Promise<UserDisplay[]> {
    let query = this.client
      .from('profiles')
      .select(
        `
        id,
        email,
        display_name,
        full_name,
        phone,
        created_at,
        user_roles!inner (role),
        user_tenants!inner (tenant_id)
      `
      )
      .in('user_roles.role', ['admin', 'staff']);

    if (tenantId) {
      query = query.eq('user_tenants.tenant_id', tenantId);
    }

    const { data: profiles, error } = await query;
    if (error) throw error;

    return (profiles || []).map((p: any) => ({
      id: p.id,
      email: p.email,
      name: p.display_name || p.full_name || p.email,
      phone: p.phone,
      roles: p.user_roles.map((ur: any) => ({ name: ur.role })),
      tenants: [],
      created_at: p.created_at,
      last_sign_in_at: null,
      email_confirmed_at: null,
    }));
  }
  async getUserTrends(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.client
      .from('profiles')
      .select('created_at')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    // Group by date
    const trends: Record<string, { total: number }> = {};

    // Initialize all days
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      trends[dateStr] = { total: 0 };
    }

    data?.forEach((p) => {
      const dateStr = p.created_at.split('T')[0];
      if (trends[dateStr]) {
        trends[dateStr].total++;
      }
    });

    // Convert to array and sort
    return Object.entries(trends)
      .map(([date, stats]) => ({
        date,
        ...stats,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getUserDetailedTrends(days: number = 30, tenantIds?: string[]) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();

    // Fetch all profiles with their roles and last sign-in
    // If tenantIds provided, filter by those tenants
    let query = this.client.from('profiles').select(`
        id,
        created_at,
        last_sign_in_at,
        user_roles(role),
        user_tenants(tenant_id)
      `);

    const { data: allProfiles, error: profilesError } = await query;

    if (profilesError) throw profilesError;

    // Filter profiles by tenant if needed
    let profiles = allProfiles;
    if (tenantIds && tenantIds.length > 0) {
      profiles = allProfiles?.filter((profile: any) =>
        profile.user_tenants?.some((ut: any) =>
          tenantIds.includes(ut.tenant_id)
        )
      );
    }

    // Initialize trends for all days
    const trends: Record<
      string,
      {
        totalUsers: number;
        activeUsers: number;
        admins: number;
        tenants: Set<string>;
      }
    > = {};

    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      trends[dateStr] = {
        totalUsers: 0,
        activeUsers: 0,
        admins: 0,
        tenants: new Set(),
      };
    }

    // Process each profile
    profiles?.forEach((profile: any) => {
      const createdDate = new Date(profile.created_at);
      const createdDateStr = profile.created_at.split('T')[0];

      // Count total users registered on each day
      if (createdDate >= startDate && trends[createdDateStr]) {
        trends[createdDateStr].totalUsers++;

        // Count admins
        const isAdmin = profile.user_roles?.some(
          (ur: any) => ur.role === 'admin'
        );
        if (isAdmin) {
          trends[createdDateStr].admins++;
        }

        // Track unique tenants
        profile.user_tenants?.forEach((ut: any) => {
          if (ut.tenant_id) {
            trends[createdDateStr].tenants.add(ut.tenant_id);
          }
        });
      }

      // Count active users (signed in within last 30 days from each date)
      if (profile.last_sign_in_at) {
        const lastSignIn = new Date(profile.last_sign_in_at);
        Object.keys(trends).forEach((dateStr) => {
          const checkDate = new Date(dateStr);
          const thirtyDaysAgo = new Date(checkDate);
          thirtyDaysAgo.setDate(checkDate.getDate() - 30);

          if (lastSignIn >= thirtyDaysAgo && lastSignIn <= checkDate) {
            trends[dateStr].activeUsers++;
          }
        });
      }
    });

    // Convert to array and sort
    return Object.entries(trends)
      .map(([date, stats]) => ({
        date,
        totalUsers: stats.totalUsers,
        activeUsers: stats.activeUsers,
        admins: stats.admins,
        tenants: stats.tenants.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
