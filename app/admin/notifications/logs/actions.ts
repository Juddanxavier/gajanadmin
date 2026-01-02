
// Server Actions for Notification Logs
// c:\websites\kajen\gajan\admin\app\admin\notifications\logs\actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';

export async function getNotificationLogs(tenantId: string, limit = 50) {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('sent_at', { ascending: false })
        .limit(limit);

    if (error) throw new Error(error.message);
    
    // Map existing logs (which might not have provider info if old)
    return data.map(log => ({
        ...log,
        // Since we removed the join, we just use the ID or a manual map if needed.
        // For now, ID is fine or we can guess.
        provider: { display_name: log.provider_id ? log.provider_id.toUpperCase() : 'SYSTEM' },
        providerName: log.provider_id || 'System'
    }));
}

export async function getNotificationStats(tenantId: string) {
    const supabase = await createClient();
    
    // We want counts for: total, sent, failed
    // Aggregation is best done via .rpc() if complex, but for simple counts we can do 3 queries or 1 fetch-all-meta.
    // Optimization: Use .count() with filters.
    
    const [total, sent, failed] = await Promise.all([
        supabase.from('notification_logs').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('notification_logs').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'sent'),
        supabase.from('notification_logs').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'failed')
    ]);

    return {
        total: total.count || 0,
        sent: sent.count || 0,
        failed: failed.count || 0
    };
}
