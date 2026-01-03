"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/lib/types";
import { isAdmin } from "@/lib/utils/permissions";

/**
 * Delete user with cascade deletion of related records
 */
export async function deleteUser(userId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return { success: false, error: "Only admins can delete users" };
    }

    // Delete related records in order (cascade)
    // 1. Delete user roles
    await supabase.from("user_roles").delete().eq("user_id", userId);

    // 2. Delete user tenants
    await supabase.from("user_tenants").delete().eq("user_id", userId);

    // 3. Delete from auth.users (this will cascade to other auth-related tables)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) throw deleteError;

    revalidatePath("/users");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete user",
    };
  }
}
