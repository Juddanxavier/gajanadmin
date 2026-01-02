"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActionResponse } from "@/lib/types";

export async function initializeAdmin(): Promise<ActionResponse<{ message: string }>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const adminClient = createAdminClient();

    // 1. Get Admin Role
    const { data: adminRole, error: roleError } = await adminClient
      .from("roles")
      .select("id")
      .eq("name", "admin")
      .single();

    if (roleError || !adminRole) {
      console.error("Error fetching admin role:", roleError);
      return { success: false, error: "Admin role not found in database. Please run migrations." };
    }

    // 2. Get Default Tenant (India)
    const { data: defaultTenant, error: tenantError } = await adminClient
      .from("tenants")
      .select("id")
      .eq("code", "IN")
      .single();

    if (tenantError || !defaultTenant) {
      console.error("Error fetching default tenant:", tenantError);
      return { success: false, error: "Default tenant (India) not found in database. Please run migrations." };
    }

    // 3. Assign Admin Role
    // Check if already assigned
    const { data: existingRole } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role_id", adminRole.id)
      .single();

    if (!existingRole) {
      const { error: insertRoleError } = await adminClient
        .from("user_roles")
        .insert({
          user_id: user.id,
          role_id: adminRole.id,
          created_by: user.id
        });

      if (insertRoleError) {
        console.error("Error assigning admin role:", insertRoleError);
        return { success: false, error: "Failed to assign admin role: " + insertRoleError.message };
      }
    }

    // 4. Assign Default Tenant
    // Check if already assigned
    const { data: existingTenant } = await adminClient
      .from("user_tenants")
      .select("id")
      .eq("user_id", user.id)
      .eq("tenant_id", defaultTenant.id)
      .single();

    if (!existingTenant) {
      const { error: insertTenantError } = await adminClient
        .from("user_tenants")
        .insert({
          user_id: user.id,
          tenant_id: defaultTenant.id,
          is_default: true,
          created_by: user.id
        });

      if (insertTenantError) {
        console.error("Error assigning default tenant:", insertTenantError);
        return { success: false, error: "Failed to assign default tenant: " + insertTenantError.message };
      }
    }

    return { success: true, data: { message: "Successfully initialized as Admin" } };

  } catch (error) {
    console.error("Error initializing admin:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initialize admin",
    };
  }
}

export async function getSystemStatus(): Promise<ActionResponse<{ authUserCount: number; assignedUserCount: number; orphanCount: number }>> {
  try {
    const adminClient = createAdminClient();

    // Get total auth users
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 });
    // Note: listUsers returns 'total' in the response but the type definition might vary. 
    // In newer Supabase versions, it might be in the metadata or a separate count.
    // Ideally we iterate if total isn't returned, but usually it is.
    // Let's assume we can get a rough count or just check first page.
    
    // Actually listUsers returns { users: User[], aud: string } - it doesn't always return total count in all versions.
    // However, let's try to get all users to count them (assuming reasonable number for now) or use a direct query if possible?
    // We can't use direct query. Let's fetch page 1.
    
    // Better strategy: fetch all users (batching) if we want accurate orphan count.
    
    let allAuthUsers: any[] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
        const { data: { users }, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw error;
        if (!users || users.length === 0) {
            hasMore = false;
        } else {
            allAuthUsers = [...allAuthUsers, ...users];
            if (users.length < 1000) hasMore = false;
            else page++;
        }
    }

    const authUserCount = allAuthUsers.length;

    // Get assigned users (in user_roles)
    const { count: assignedUserCount, error: countError } = await adminClient
      .from("user_roles")
      .select("*", { count: 'exact', head: true });
      
    if (countError) throw countError;

    // This is distinct users?
    const { data: distinctRoles } = await adminClient.from("user_roles").select("user_id");
    const uniqueAssignedUsers = new Set(distinctRoles?.map(r => r.user_id)).size;

    return {
      success: true,
      data: {
        authUserCount,
        assignedUserCount: uniqueAssignedUsers,
        orphanCount: authUserCount - uniqueAssignedUsers
      }
    };
  } catch (error) {
    console.error("Error getting system status:", error);
    return { success: false, error: "Failed to get system status" };
  }
}

export async function fixOrphanUsers(): Promise<ActionResponse<{ message: string }>> {
  try {
    const adminClient = createAdminClient();
    const { data: { user: currentUser } } = await adminClient.auth.getUser(); // This might fail if using admin client for auth check? 
    // Wait, createAdminClient uses service role, so auth.getUser() returns... nothing usually unless we set session?
    // We shouldn't rely on auth.getUser() from adminClient.
    // We can get current user from standard client.
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // 1. Get all auth users
    let allAuthUsers: any[] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
        const { data: { users }, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw error;
        if (!users || users.length === 0) {
            hasMore = false;
        } else {
            allAuthUsers = [...allAuthUsers, ...users];
            if (users.length < 1000) hasMore = false;
            else page++;
        }
    }

    // 2. Get all assigned users
    const { data: assignedUsers } = await adminClient.from("user_roles").select("user_id");
    const assignedUserIds = new Set(assignedUsers?.map(u => u.user_id));

    // 3. Identify orphans
    const orphans = allAuthUsers.filter(u => !assignedUserIds.has(u.id));

    if (orphans.length === 0) {
      return { success: true, data: { message: "No orphans found" } };
    }

    // 4. Get 'customer' role
    const { data: customerRole } = await adminClient.from("roles").select("id").eq("name", "customer").single();
    if (!customerRole) throw new Error("Customer role not found");

    // 5. Get default tenant
    const { data: defaultTenant } = await adminClient.from("tenants").select("id").eq("code", "IN").single();
    if (!defaultTenant) throw new Error("Default tenant not found");

    // 6. Assign role and tenant to orphans
    let successCount = 0;
    for (const orphan of orphans) {
        // Assign role
        const { error: roleError } = await adminClient.from("user_roles").insert({
            user_id: orphan.id,
            role_id: customerRole.id,
            created_by: user.id
        });
        
        // Assign tenant
        const { error: tenantError } = await adminClient.from("user_tenants").insert({
            user_id: orphan.id,
            tenant_id: defaultTenant.id,
            is_default: true,
            created_by: user.id
        });

        if (!roleError && !tenantError) successCount++;
    }

    return { success: true, data: { message: `Fixed ${successCount} orphan users` } };

  } catch (error) {
    console.error("Error fixing orphans:", error);
    return { success: false, error: "Failed to fix orphans" };
  }
}
