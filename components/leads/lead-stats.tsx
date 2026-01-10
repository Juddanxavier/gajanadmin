/** @format */

'use client';

import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  Activity,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { StatCard } from '@/components/dashboard/stat-card';

interface LeadStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalValue: number;
}

interface LeadStatsCardsProps {
  stats: LeadStats;
  trends?: any[]; // Optional trend data
}

export function LeadStatsCards({ stats, trends }: LeadStatsCardsProps) {
  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      <StatCard
        title='Total Leads'
        value={stats.total}
        description='All time leads'
        icon={<Activity className='h-4 w-4' />}
        color='text-chart-1'
        trendData={trends}
        dataKey='total'
        chartConfig={{
          total: { label: 'Total', color: 'var(--chart-1)' },
        }}
      />
      <StatCard
        title='Pipeline Value'
        value={formatCurrency(stats.totalValue)}
        description='Total value of goods'
        icon={<DollarSign className='h-4 w-4' />}
        color='text-chart-2'
        trendData={trends}
        dataKey='value' // Assuming value is in trends, else total
        chartConfig={{
          value: { label: 'Value', color: 'var(--chart-2)' },
        }}
      />
      <StatCard
        title='Pending Processing'
        value={stats.pending}
        description='Waiting for action'
        icon={<Clock className='h-4 w-4' />}
        color='text-chart-3'
        trendData={trends}
        dataKey='total' // Pending not explicitly history tracking, use total
        chartConfig={{
          total: { label: 'Pending', color: 'var(--chart-3)' },
        }}
      />
      <StatCard
        title='Completed'
        value={stats.completed}
        description='Successfully delivery'
        icon={<CheckCircle2 className='h-4 w-4' />}
        color='text-chart-4'
        trendData={trends}
        dataKey='converted'
        chartConfig={{
          converted: { label: 'Completed', color: 'var(--chart-4)' },
        }}
      />
    </div>
  );
}
