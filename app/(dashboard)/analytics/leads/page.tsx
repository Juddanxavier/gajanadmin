/** @format */

'use client';

import { useEffect, useState } from 'react';
import { getLeadStats, getLeadTrends } from '@/app/(dashboard)/leads/actions';
import { LeadStatsCards } from '@/components/leads/lead-stats';
import { LeadTrendsBarChart } from '@/components/leads/lead-trends-bar-chart';
import { ConversionFunnelChart } from '@/components/leads/conversion-funnel-chart';
import Loading from '@/app/(dashboard)/analytics/loading';
import {
  generateMockLeadTrends,
  generateMockLeadStats,
} from '@/lib/utils/mock-data-generator';

export default function LeadsAnalyticsPage() {
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

      console.log('🔍 Lead Analytics - Loading data...', { useMockData });

      if (useMockData) {
        // Use mock data
        const mockStats = generateMockLeadStats();
        const mockTrends = generateMockLeadTrends(90);

        console.log('📊 Using MOCK data:', { mockStats, mockTrends });

        setStats(mockStats);
        setTrends(mockTrends);
      } else {
        // Use real data
        console.log('🗄️ Fetching REAL data from database...');

        const [statsResult, trendsResult] = await Promise.all([
          getLeadStats(),
          getLeadTrends(),
        ]);

        console.log('📥 API Responses:', {
          statsResult,
          trendsResult,
          statsSuccess: statsResult.success,
          trendsSuccess: trendsResult.success,
          statsData: statsResult.data,
          trendsData: trendsResult.data,
          trendsLength: trendsResult.data?.length,
        });

        if (statsResult.success) setStats(statsResult.data);
        if (trendsResult.success) setTrends(trendsResult.data);

        console.log('✅ Data set to state:', {
          stats: statsResult.data,
          trends: trendsResult.data,
        });
      }
    } catch (error) {
      console.error('❌ Failed to load leads analytics', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Leads Analytics</h1>
        <p className='text-muted-foreground'>
          Overview of lead conversion and performance
        </p>
      </div>

      {stats && <LeadStatsCards stats={stats} trends={trends} />}

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <LeadTrendsBarChart data={trends} />
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
