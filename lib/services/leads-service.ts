import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { Lead, LeadTableFilters, PaginatedResponse, LeadStatus } from '@/lib/types';

export class LeadsService {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
      this.client = client;
  }

  async getLeads(
    page: number = 0,
    pageSize: number = 10,
    filters: LeadTableFilters & { tenantIds?: string[] } = {},
    sortBy?: { id: string; desc: boolean }
  ): Promise<PaginatedResponse<Lead>> {
    let query = this.client.from("leads").select("*", { count: "exact" });

    // Status filter
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    // Tenant filter
    if (filters.tenantIds) {
        if (filters.tenantIds.length === 0) {
            return { data: [], total: 0, pageCount: 0 };
        }
        query = query.in("tenant_id", filters.tenantIds);
    }
    
    // Date filters
    if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom.toISOString());
    if (filters.dateTo) query = query.lte("created_at", filters.dateTo.toISOString());

    // Sorting
    if (sortBy) {
       if (['created_at', 'status', 'weight', 'value'].includes(sortBy.id)) {
           query = query.order(sortBy.id, { ascending: !sortBy.desc });
       }
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: leads, count, error } = await query;
    if (error) throw error;
    
    // Enrich with customer details and assignee details using Admin Client
    const adminClient = createAdminClient();
    const customerIds = Array.from(new Set(leads?.map((l) => l.customer_id) || []));
    const assigneeIds = Array.from(new Set(leads?.map((l) => l.assigned_to).filter(Boolean) || []));
    
    const userMap = new Map();

    const allUserIds = [...new Set([...customerIds, ...assigneeIds])];

    await Promise.all(allUserIds.map(async (uid) => {
        try {
            const { data: { user } } = await adminClient.auth.admin.getUserById(uid as string);
            if (user) {
              userMap.set(uid, {
                email: user.email || "",
                name: user.user_metadata?.display_name || user.user_metadata?.name || user.email || "Unknown",
                phone: user.phone || user.user_metadata?.phone || ""
              });
            }
        } catch (err) {
            console.warn(`Failed to fetch user ${uid}:`, err);
        }
    }));

    const data: Lead[] = (leads || []).map((lead) => ({
      ...lead,
      customer: userMap.get(lead.customer_id),
      assignee: lead.assigned_to ? userMap.get(lead.assigned_to) : undefined,
    }));

    return {
      data,
      total: count || 0,
      pageCount: Math.ceil((count || 0) / pageSize),
    };
  }

  async getLead(id: string, tenantIds?: string[]): Promise<Lead | null> {
    let query = this.client.from("leads").select("*").eq("id", id).single();
    const { data: lead, error } = await query;
    
    if (error) throw error;
    if (!lead) return null;

    if (tenantIds && !tenantIds.includes(lead.tenant_id)) {
        throw new Error("Unauthorized");
    }

    // Enrich
    const adminClient = createAdminClient();
    let customer = undefined;
    let assignee = undefined;
    
    try {
        const [cResult, aResult] = await Promise.all([
            adminClient.auth.admin.getUserById(lead.customer_id),
            lead.assigned_to ? adminClient.auth.admin.getUserById(lead.assigned_to) : Promise.resolve({ data: { user: null } })
        ]);

        if (cResult.data.user) {
            customer = {
                email: cResult.data.user.email || "",
                name: cResult.data.user.user_metadata?.display_name || cResult.data.user.user_metadata?.name || cResult.data.user.email || "Unknown",
                phone: cResult.data.user.phone || cResult.data.user.user_metadata?.phone || ""
            };
        }

        if (aResult.data.user) {
            assignee = {
                email: aResult.data.user.email || "",
                name: aResult.data.user.user_metadata?.display_name || aResult.data.user.user_metadata?.name || aResult.data.user.email || "Unknown"
            };
        }
    } catch (err) {
        console.warn(`Failed to fetch users for lead ${id}:`, err);
    }

    return { ...lead, customer, assignee };
  }

  async updateStatus(id: string, status: LeadStatus) {
      const { error } = await this.client
        .from("leads")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      return true;
  }

  async getStats(tenantIds?: string[]) {
      let query = this.client.from("leads").select("status, value", { count: "exact" });
      if (tenantIds) {
          if (tenantIds.length === 0) return null;
          query = query.in("tenant_id", tenantIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      const total = data?.length || 0;
      const pending = data?.filter(l => l.status === 'pending').length || 0;
      const processing = data?.filter(l => l.status === 'processing').length || 0;
      const completed = data?.filter(l => l.status === 'completed').length || 0;
      const failed = data?.filter(l => l.status === 'failed').length || 0;
      const totalValue = data?.reduce((acc, curr) => acc + (curr.value || 0), 0) || 0;

      return { total, pending, processing, completed, failed, totalValue };
  }

  async assignLead(id: string, userId: string | null) {
      const { error } = await this.client
        .from("leads")
        .update({ assigned_to: userId })
        .eq("id", id);
      if (error) throw error;
      return true;
  }
}
