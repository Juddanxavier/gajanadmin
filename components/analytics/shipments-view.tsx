/** @format */

'use client';

import { useEffect, useState } from 'react';
// Imports updated
import {
  getShipmentStats,
  getShipmentTrendsAction,
} from '@/app/(dashboard)/shipments/actions';
import { ShipmentTrendsChart } from '@/components/dashboard/shipment-trends-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/dashboard/stat-card';
import { Truck, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function ShipmentsView() {
  const [trends, setTrends] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [trendsResult, statsResult] = await Promise.all([
        getShipmentTrendsAction(90),
        getShipmentStats(),
      ]);

      if (trendsResult.success) {
        setTrends(trendsResult.data);
      }
      if (statsResult.success) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error('Failed to load shipment analytics', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <Skeleton className='h-[120px] w-full' />
          <Skeleton className='h-[120px] w-full' />
          <Skeleton className='h-[120px] w-full' />
          <Skeleton className='h-[120px] w-full' />
        </div>
        <Skeleton className='h-[400px] w-full' />
      </div>
    );
  }

  // Fallback stats if null
  const safeStats = stats || {
    in_transit: 0,
    pending: 0,
    exception: 0,
    delivered: 0,
  };

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <StatCard
          title='Active Shipments'
          value={safeStats.in_transit.toString()}
          description='In Transit'
          icon={<Truck className='h-4 w-4' />}
          color='text-chart-5'
          trendData={trends}
          dataKey='total'
          chartConfig={{
            total: { label: 'Active', color: 'var(--chart-5)' },
          }}
        />
        <StatCard
          title='Pending Orders'
          value={safeStats.pending.toString()}
          description='Awaiting Update'
          icon={<Clock className='h-4 w-4' />}
          color='text-chart-3'
          trendData={trends}
          dataKey='total'
          chartConfig={{
            total: { label: 'Pending', color: 'var(--chart-3)' },
          }}
        />
        <StatCard
          title='Exceptions'
          value={safeStats.exception.toString()}
          description='Attention Needed'
          icon={<AlertTriangle className='h-4 w-4' />}
          color='text-destructive'
          trendData={trends}
          dataKey='exception'
          chartConfig={{
            exception: { label: 'Exceptions', color: 'var(--destructive)' },
          }}
        />
        <StatCard
          title='Delivered'
          value={safeStats.delivered.toString()}
          description='Total Completed'
          icon={<CheckCircle2 className='h-4 w-4' />}
          color='text-chart-2'
          trendData={trends}
          dataKey='delivered'
          chartConfig={{
            delivered: { label: 'Delivered', color: 'var(--chart-2)' },
          }}
        />
      </div>

      <div className='w-full'>
        <ShipmentTrendsChart data={trends} />
      </div>
    </div>
  );
}
