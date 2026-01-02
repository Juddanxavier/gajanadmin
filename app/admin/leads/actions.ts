"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  Lead,
  LeadTableFilters,
  PaginatedResponse,
  LeadStatus,
} from "@/lib/types";
import { ActionResponse, successResponse, errorResponse } from "@/lib/api-response";
import { hasPermission, isAdmin, getUserTenantIds } from "@/lib/utils/permissions";
import { LeadsService } from "@/lib/services/leads-service";

/**
 * Get leads with pagination, filtering, and sorting
 */
export async function getLeads(
  page: number = 0,
  pageSize: number = 10,
  filters: LeadTableFilters = {},
  sortBy?: { id: string; desc: boolean }
): Promise<ActionResponse<PaginatedResponse<Lead>>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return errorResponse(new Error("Unauthorized"));

    const userIsAdmin = await isAdmin();
    const userTenantIds = await getUserTenantIds();

    const service = new LeadsService(supabase);

    const result = await service.getLeads(
        page, 
        pageSize, 
        {
            ...filters,
            tenantIds: userIsAdmin ? undefined : userTenantIds
        },
        sortBy
    );

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * Update lead status
 */
export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errorResponse(new Error("Unauthorized"));

    const canUpdate = await hasPermission("leads.update");
    if (!canUpdate) {
        const userIsAdmin = await isAdmin();
        if (!userIsAdmin) return errorResponse(new Error("Permission denied"));
    }

    const service = new LeadsService(supabase);
    await service.updateStatus(id, status);

    // No revalidation needed - client handles optimistic updates
    return successResponse(undefined);
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * Get lead statistics
 */
export async function getLeadStats() {
  try {
    const supabase = await createClient();
    const userIsAdmin = await isAdmin();
    const userTenantIds = await getUserTenantIds();
    
    const service = new LeadsService(supabase);
    const stats = await service.getStats(userIsAdmin ? undefined : userTenantIds);
    
    if (!stats && !userIsAdmin && userTenantIds.length === 0) return successResponse(null);
    
    return successResponse(stats || { total: 0, pending: 0, processing: 0, completed: 0, failed: 0, totalValue: 0 });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * Get a single lead by ID
 */
export async function getLead(id: string): Promise<ActionResponse<Lead>> {
  try {
    const supabase = await createClient();
    const userIsAdmin = await isAdmin();
    const userTenantIds = await getUserTenantIds();

    const service = new LeadsService(supabase);
    const lead = await service.getLead(id, userIsAdmin ? undefined : userTenantIds);

    if (!lead) return errorResponse(new Error("Lead not found"));

    return successResponse(lead);
  } catch (error) {
      return errorResponse(error);
  }
}

/**
 * Assign lead to a user
 */
export async function assignLeadAction(
  leadId: string,
  userId: string | null
): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const canAssign = await hasPermission("leads.manage"); // Assuming this permission exists or using update
        if (!canAssign) {
            const userIsAdmin = await isAdmin();
            if (!userIsAdmin) return errorResponse(new Error("Permission denied"));
        }

        const service = new LeadsService(supabase);
        await service.assignLead(leadId, userId);

        revalidatePath("/admin/leads");
        revalidatePath(`/admin/leads/${leadId}`);
        return successResponse(undefined);
    } catch (error) {
        return errorResponse(error);
    }
}
