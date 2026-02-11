/** @format */

'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  addDays,
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from 'date-fns';

export interface RevenueData {
  date: string;
  revenue: number;
  projected: number;
}

export interface InsightMetric {
  title: string;
  value: string;
  change?: string;
  description: string;
  status: 'positive' | 'negative' | 'neutral' | 'warning';
}

export async function getRevenueAnalytics(days = 30) {
  const supabase = await createClient();
  const startDate = subDays(new Date(), days).toISOString();

  // 1. Fetch Shipments with Invoice Details
  const { data: shipments } = await supabase
    .from('shipments')
    .select('invoice_details, created_at')
    .gte('created_at', startDate)
    .not('invoice_details', 'is', null);

  // 2. Fetch Leads with Value
  const { data: leads } = await supabase
    .from('leads')
    .select('value, created_at')
    .gte('created_at', startDate);

  // Process Daily Revenue
  const dailyData: Record<string, { revenue: number; projected: number }> = {};

  // Initialize days
  const interval = eachDayOfInterval({
    start: subDays(new Date(), days),
    end: new Date(),
  });

  interval.forEach((date) => {
    const key = format(date, 'yyyy-MM-dd');
    dailyData[key] = { revenue: 0, projected: 0 };
  });

  // Aggregate Real Revenue (Shipments)
  shipments?.forEach((s) => {
    const date = format(new Date(s.created_at), 'yyyy-MM-dd');
    if (dailyData[date]) {
      // @ts-ignore
      const amount = parseFloat(s.invoice_details?.amount || 0);
      dailyData[date].revenue += isNaN(amount) ? 0 : amount;
    }
  });

  // Aggregate Projected Revenue (Leads)
  leads?.forEach((l) => {
    const date = format(new Date(l.created_at), 'yyyy-MM-dd');
    if (dailyData[date]) {
      const amount = parseFloat((l.value as any) || 0);
      dailyData[date].projected += isNaN(amount) ? 0 : amount;
    }
  });

  const chartData: RevenueData[] = Object.entries(dailyData)
    .map(([date, values]) => ({
      date,
      revenue: values.revenue,
      projected: values.projected,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return chartData;
}

export async function getPredictiveInsights() {
  const supabase = await createClient();

  // 1. Delayed Shipments
  // Logic: Status not delivered/cancelled AND estimated_delivery < now
  const { count: delayedCount } = await supabase
    .from('shipments')
    .select('*', { count: 'exact', head: true })
    .not('status', 'in', '("delivered","cancelled","failed")')
    .lt('estimated_delivery', new Date().toISOString());

  // 2. High Value Leads at Risk
  // Logic: New leads created > 7 days ago
  const sevenDaysAgo = subDays(new Date(), 7).toISOString();
  const { count: stallingLeadsCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new')
    .lt('created_at', sevenDaysAgo);

  // 3. Exception Rate
  const { count: totalShipments } = await supabase
    .from('shipments')
    .select('*', { count: 'exact', head: true });

  const { count: exceptionCount } = await supabase
    .from('shipments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'exception');

  const exceptionRate = totalShipments
    ? ((exceptionCount || 0) / totalShipments) * 100
    : 0;

  const insights: InsightMetric[] = [
    {
      title: 'Delayed Shipments',
      value: delayedCount?.toString() || '0',
      description: 'Shipments past delivery date',
      status: (delayedCount || 0) > 0 ? 'warning' : 'positive',
    },
    {
      title: 'Stalling Leads',
      value: stallingLeadsCount?.toString() || '0',
      description: 'New leads > 7 days old',
      status: (stallingLeadsCount || 0) > 5 ? 'negative' : 'neutral',
    },
    {
      title: 'Exception Rate',
      value: `${exceptionRate.toFixed(1)}%`,
      description: 'Shipments with issues',
      status: exceptionRate > 10 ? 'negative' : 'positive',
    },
  ];

  return insights;
}

export async function getShipmentAnalyticsData(days = 30) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();
  const startDate = subDays(new Date(), days).toISOString();

  // 1. Determine Scope
  const { data: isGlobal } = await admin.rpc('is_admin', {
    user_uuid: user.id,
  });

  const { data: roles } = await admin
    .from('user_roles')
    .select('role, tenant_id')
    .eq('user_id', user.id);

  const isSuperAdmin = isGlobal || roles?.some((r) => r.role === 'super_admin');

  // 2. Base Query via Admin to ensure access if unauthorized via standard RLS
  let query = admin
    .from('shipments')
    .select('id, status, created_at, carrier_id, tenant_id')
    .gte('created_at', startDate);

  // 3. Apply Scoping
  if (!isSuperAdmin) {
    if (roles && roles.length > 0) {
      // Filter by user's tenants
      const tenantIds = roles.map((r) => r.tenant_id).filter(Boolean);
      if (tenantIds.length > 0) {
        query = query.in('tenant_id', tenantIds);
      } else {
        // Fallback
        query = query.eq('user_id', user.id);
      }
    } else {
      query = query.eq('user_id', user.id);
    }
  }

  // Fetch shipments
  const { data: shipments } = await query;

  if (!shipments) return null;

  // 1. Stats
  const total = shipments.length;
  const active = shipments.filter((s) =>
    ['pending', 'in_transit', 'out_for_delivery'].includes(s.status),
  ).length;
  const delivered = shipments.filter((s) => s.status === 'delivered').length;
  const exceptions = shipments.filter((s) => s.status === 'exception').length;

  // 2. Trends (Daily Volume)
  const dailyTrends: Record<string, number> = {};
  const interval = eachDayOfInterval({
    start: subDays(new Date(), days),
    end: new Date(),
  });

  interval.forEach((date) => {
    dailyTrends[format(date, 'yyyy-MM-dd')] = 0;
  });

  shipments.forEach((s) => {
    const date = format(new Date(s.created_at), 'yyyy-MM-dd');
    if (dailyTrends[date] !== undefined) {
      dailyTrends[date]++;
    }
  });

  const trends = Object.entries(dailyTrends)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 3. Status Distribution
  const statusCounts: Record<string, number> = {};
  shipments.forEach((s) => {
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
  });

  const statusDistribution = Object.entries(statusCounts).map(
    ([status, count]) => ({
      name: status.replace('_', ' '),
      value: count,
    }),
  );

  // 4. Carrier Performance (Volume)
  const carrierCounts: Record<string, number> = {};
  shipments.forEach((s) => {
    const carrier = s.carrier_id || 'Unknown';
    carrierCounts[carrier] = (carrierCounts[carrier] || 0) + 1;
  });

  const carrierPerformance = Object.entries(carrierCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5

  return {
    stats: { total, active, delivered, exceptions },
    trends,
    statusDistribution,
    carrierPerformance,
  };
}
