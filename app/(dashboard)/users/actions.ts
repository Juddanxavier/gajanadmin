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

    const service = new UserService(supabase);
    const newUser = await service.createUser(input, user.id);
    if (!newUser) throw new Error("Failed to return created user");

    revalidatePath("/admin/users");
    return successResponse(newUser);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function updateUser(
  userId: string,
  input: UpdateUserInput
): Promise<ActionResponse<UserDisplay>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errorResponse(new Error("Unauthorized"));

    const canUpdate = await hasPermission("users.update");
    if (!canUpdate) return errorResponse(new Error("Permission denied"));

    const service = new UserService(supabase);
    const updatedUser = await service.updateUser(userId, input, user.id);
    
    revalidatePath("/admin/users");
    return successResponse(updatedUser || ({} as UserDisplay));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function deleteUser(userId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const canDelete = await hasPermission("users.delete");
    if (!canDelete) return errorResponse(new Error("Permission denied"));

    const service = new UserService(supabase);
    await service.deleteUser(userId);

    revalidatePath("/admin/users");
    return successResponse(undefined);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function bulkDeleteUsers(userIds: string[]): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const canDelete = await hasPermission("users.delete");
        if (!canDelete) return errorResponse(new Error("Permission denied"));

        const service = new UserService(supabase);
        for (const id of userIds) {
            await service.deleteUser(id);
        }
        revalidatePath("/admin/users");
        return successResponse(undefined);
    } catch (error) {
        return errorResponse(error);
    }
}

export async function bulkAssignRole(userIds: string[], roleId: string): Promise<ActionResponse> {
    // Implement bulk assign via service if needed
    // For now simple loop
    return successResponse(undefined);
}

export async function getUserStats(): Promise<ActionResponse<UserStats>> {
    try {
        const supabase = await createClient();
        const service = new UserService(supabase);
        const stats = await service.getStats();
        return successResponse(stats);
    } catch (error) {
        return errorResponse(error);
    }
}

export async function getRoles() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("roles").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function getAvailableRoles() {
  const supabase = await createClient();
  const userIsAdmin = await isAdmin();
  
  const { data, error } = await supabase.from("roles").select("*").order("name");
  if (error) throw error;
  
  if (!userIsAdmin) {
    return data.filter(role => role.name === "customer");
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
