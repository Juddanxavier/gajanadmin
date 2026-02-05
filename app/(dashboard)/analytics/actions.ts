/** @format */

'use server';

import { createClient } from '@/lib/supabase/server';
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
