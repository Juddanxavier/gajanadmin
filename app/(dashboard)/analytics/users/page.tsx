/** @format */

'use client';

import { useEffect, useState } from 'react';
import {
  getUserStats,
  getUserDetailedTrendsAction,
} from '@/app/(dashboard)/users/actions';
import { UserStatsCards } from '@/components/users/user-stats';
import { UserTrendsChart } from '@/components/users/user-trends-chart';
import { UserStats } from '@/lib/types';
import Loading from '@/app/(dashboard)/analytics/loading';
import {
  generateMockUserTrends,
  generateMockUserStats,
} from '@/lib/utils/mock-data-generator';

export default function UsersAnalyticsPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [trends, setTrends] = useState<
    {
      date: string;
      totalUsers: number;
      activeUsers: number;
      admins: number;
      tenants: number;
    }[]
  >([]);
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
        // Use mock data
        setStats(generateMockUserStats() as UserStats);
        setTrends(generateMockUserTrends(90));
      } else {
        // Use real data
        const [statsResult, trendsResult] = await Promise.all([
          getUserStats(),
          getUserDetailedTrendsAction(90), // Fetch 90 days to match default chart range
        ]);

        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data);
        }
        if (trendsResult.success && trendsResult.data) {
          setTrends(trendsResult.data);
        }
      }
    } catch (error) {
      console.error('Failed to load user analytics', error);
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
        <h1 className='text-3xl font-bold tracking-tight'>User Analytics</h1>
        <p className='text-muted-foreground'>
          User registration and activity metrics
        </p>
      </div>

      {stats && <UserStatsCards stats={stats} trendData={trends} />}

      <div className='w-full'>
        <UserTrendsChart
          data={trends.map((t) => ({ date: t.date, total: t.totalUsers }))}
        />
      </div>
    </div>
  );
}
