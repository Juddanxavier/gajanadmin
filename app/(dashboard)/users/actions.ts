"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  UserDisplay,
  UserTableFilters,
  PaginatedResponse,
  ActionResponse,
  CreateUserInput,
  UpdateUserInput,
  UserStats,
} from "@/lib/types";
import { successResponse, errorResponse } from "@/lib/api-response";
import { isAdmin, getUserTenantIds, hasPermission } from "@/lib/utils/permissions";
import { UserService } from "@/lib/services/user-service";
import { getCurrentTenantId } from "@/lib/auth/session";

export async function getUsers(
  page: number = 0,
  pageSize: number = 10,
  filters: UserTableFilters = {},
  sortBy?: { id: string; desc: boolean }
): Promise<ActionResponse<PaginatedResponse<UserDisplay>>> {
  console.log("getUsers called", { page, pageSize, filters: JSON.stringify(filters) });
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return errorResponse(new Error("Unauthorized"));

    const userIsAdmin = await isAdmin();
    const userTenantIds = await getUserTenantIds();

    const service = new UserService(supabase);
    const result = await service.getUsers(
        page, 
        pageSize, 
        { 
            ...filters, 
            tenantIds: userIsAdmin ? undefined : userTenantIds,
            excludeAdmins: !userIsAdmin
        }, 
        sortBy
    );

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function createUser(
  input: CreateUserInput
): Promise<ActionResponse<UserDisplay>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return errorResponse(new Error("Unauthorized"));

    const canCreate = await hasPermission("users.create");
    if (!canCreate) return errorResponse(new Error("Permission denied"));

    // Hierarchy Enforcement
    const isGlobalAdmin = await isAdmin();
    
    // Fetch target role details to check its name/type
    const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('name')
        .eq('id', input.role)
        .single();
        
    if (roleError || !roleData) return errorResponse(new Error("Invalid role selected"));

    // Rule: Only Global Admin can create 'admin' role
    if (roleData.name === 'admin' && !isGlobalAdmin) {
        return errorResponse(new Error("Only Global Admins can create new Admins."));
    }

    // Rule: Tenant Admins can only create users for their own tenant
    if (!isGlobalAdmin) {
        const userTenantIds = await getUserTenantIds();
        if (!userTenantIds.includes(input.tenant)) {
             return errorResponse(new Error("You can only create users for your assigned tenant."));
        }
    }

    const service = new UserService(supabase);
    // ... existing logic ...
    const newUser = await service.createUser(input, user.id);
    if (!newUser) throw new Error("Failed to return created user");

    revalidatePath("/admin/users");
    return successResponse(newUser);
  } catch (error) {
    return errorResponse(error);
  }
}

// ... existing code ...

export async function getAvailableRoles() {
  const supabase = await createClient();
  const userIsAdmin = await isAdmin(); // true = Global Admin, false = Tenant Admin (or Staff)
  
  const { data, error } = await supabase.from("roles").select("*").order("name");
  if (error) throw error;
  
  // Hierarchy Logic:
  // Global Admin: Sees All
  // Tenant Admin: Sees everything EXCEPT 'admin' (can create staff/customer)
  // Staff: Sees nothing (or customer? usually staff don't create users)
  
  if (!userIsAdmin) {
    // Return all except 'admin'
    return data.filter(role => role.name !== "admin");
  }
  return data;
}

import { createAdminClient } from "@/lib/supabase/admin";

export async function getTenants() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("tenants").select("*").eq("is_active", true).order("name");
  if (error) throw error;
  return data.map((t: any) => ({ ...t, code: t.country_code }));
}

export async function getAvailableTenants() {
  return getTenants();
}

export async function getUserDefaultTenant() {
  return await getCurrentTenantId();
}

export async function getTeamMembersAction(): Promise<ActionResponse<UserDisplay[]>> {
    try {
        const supabase = await createClient();
        const tenantId = await getCurrentTenantId();
        const service = new UserService(supabase);
        // If admin, they might want all members across tenants, but usually within context.
        // For now, use current tenant context if available.
        const members = await service.getTeamMembers(tenantId || undefined);
        return successResponse(members);
    } catch (error) {
        return errorResponse(error);
    }
}
