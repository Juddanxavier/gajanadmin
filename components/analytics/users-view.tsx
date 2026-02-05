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
import {
  generateMockUserTrends,
  generateMockUserStats,
} from '@/lib/utils/mock-data-generator';
import { Skeleton } from '@/components/ui/skeleton';

export function UsersView() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const useMockData = localStorage.getItem('use-mock-data') === 'true';

      if (useMockData) {
        setStats(generateMockUserStats() as UserStats);
        setTrends(generateMockUserTrends(90));
      } else {
        const [statsResult, trendsResult] = await Promise.all([
          getUserStats(),
          getUserDetailedTrendsAction(90),
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
    return <AnalyticsSkeleton />;
  }

  return (
    <div className='space-y-6'>
      {stats && <UserStatsCards stats={stats} trendData={trends} />}

      <div className='w-full'>
        <UserTrendsChart
          data={trends.map((t) => ({ date: t.date, total: t.totalUsers }))}
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
