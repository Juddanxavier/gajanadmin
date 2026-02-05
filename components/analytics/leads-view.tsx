/** @format */

'use client';

import { useEffect, useState } from 'react';
import { getLeadStats, getLeadTrends } from '@/app/(dashboard)/leads/actions';
import { LeadStatsCards } from '@/components/leads/lead-stats';
import { LeadTrendsInteractive } from '@/components/leads/lead-trends-interactive';
import { ConversionFunnelChart } from '@/components/leads/conversion-funnel-chart';
import {
  generateMockLeadTrends,
  generateMockLeadStats,
} from '@/lib/utils/mock-data-generator';
import { Skeleton } from '@/components/ui/skeleton';

export function LeadsView() {
  const [stats, setStats] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Check if mock data is enabled
      const useMockData = localStorage.getItem('use-mock-data') === 'true';

      if (useMockData) {
        setStats(generateMockLeadStats());
        setTrends(generateMockLeadTrends(90));
      } else {
        const [statsResult, trendsResult] = await Promise.all([
          getLeadStats(),
          getLeadTrends(),
        ]);

        if (statsResult.success) setStats(statsResult.data);
        if (trendsResult.success) setTrends(trendsResult.data);
      }
    } catch (error) {
      console.error('Failed to load leads analytics', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className='space-y-6'>
      {stats && <LeadStatsCards stats={stats} trends={trends} />}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <LeadTrendsInteractive data={trends} />
        <ConversionFunnelChart
          data={{
            pending: stats?.pending || 0,
            processing: stats?.processing || 0,
            completed: stats?.completed || 0,
            failed: stats?.failed || 0,
          }}
        />
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='grid gap-4 md:grid-cols-4'>
        <Skeleton className='h-[120px] w-full' />
        <Skeleton className='h-[120px] w-full' />
        <Skeleton className='h-[120px] w-full' />
        <Skeleton className='h-[120px] w-full' />
      </div>
      <Skeleton className='h-[300px] w-full' />
    </div>
  );
}
