/** @format */

import {
  Package,
  AlertTriangle,
  TrendingUp,
  Users,
  DollarSign,
  Truck,
  Clock,
  CheckCircle2,
  ArrowRight,
  Plus,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ShipmentService } from '@/lib/services/shipment-service';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShipmentTrendsChart } from '@/components/dashboard/shipment-trends-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { StatCard } from '@/components/dashboard/stat-card';
import { ShipmentRealtimeListener } from '@/components/dashboard/shipment-realtime-listener';
import { ShipmentMap } from '@/components/dashboard/shipment-map';
import {
  getShipmentStats,
  getShipmentTrendsAction,
  getShipments,
} from '@/app/(dashboard)/shipments/actions';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // Parallel Fetching using Cached Actions
  const [statsRes, recentShipmentsRes, trendsRes] = await Promise.all([
    getShipmentStats(),
    getShipments(1, 5, {}, { id: 'updated_at', desc: true }),
    getShipmentTrendsAction(90),
  ]);

  const stats = statsRes.success
    ? statsRes.data
    : {
        total: 0,
        pending: 0,
        in_transit: 0,
        delivered: 0,
        exception: 0,
        avgDeliveryDays: 0,
      };
  const recentShipments =
    recentShipmentsRes.success && recentShipmentsRes.data?.data
      ? recentShipmentsRes.data.data
      : [];
  const trends = trendsRes.success ? trendsRes.data : [];

  // Transform trends for charts
  // { date, total, delivered, exception }
  // We need to pass dataKey correctly

  const chartConfig = {
    total: {
      label: 'Total',
      color: 'var(--chart-1)',
    },
    delivered: {
      label: 'Delivered',
      color: 'var(--chart-2)',
    },
    exception: {
      label: 'Exceptions',
      color: 'var(--destructive)',
    },
    in_transit: {
      label: 'In Transit',
      color: 'var(--chart-5)',
    },
    avg_days: {
      label: 'Avg Days',
      color: 'var(--chart-4)',
    },
    pending: {
      label: 'Pending',
      color: 'var(--chart-3)',
    },
  };

  // Pre-calculate trend arrays for each specific chart to avoid doing it in render
  // Note: 'total', 'delivered', 'exception' are already in 'trends'.
  // For 'in_transit' and 'pending', we don't have historical trend data in getShipmentTrends yet.
  // We will reuse 'total' as a proxy or placebo for now for 'pending',
  // and maybe 'delivered' pattern for 'in_transit' just for visualization if real data is missing.
  // Ideally getShipmentTrends should return these columns.

  // For this iterations, let's use:
  // Active -> trends.total (approximation of activity)
  // Delivered -> trends.delivered
  // Exception -> trends.exception
  // Total -> trends.total

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
          <p className='text-muted-foreground'>
            Overview of your logistics operations.
          </p>
        </div>
        <Link href='/shipments'>
          <Button>
            <Plus className='mr-2 h-4 w-4' /> New Shipment
          </Button>
        </Link>
      </div>

      {/* Bento Grid Layout - 4 Columns */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[minmax(120px,auto)]'>
        {/* Row 1 & 2: Stats with Shadcn Charts */}

        {/* 1. Active Shipments */}
        <StatCard
          title='Active Shipments'
          value={stats.in_transit.toString()}
          description='In Transit'
          icon={<Truck className='h-4 w-4' />}
          color='text-chart-5'
          trendData={trends}
          dataKey='total' // Using total as proxy for volume
          chartConfig={{
            total: { label: 'Active', color: 'var(--chart-5)' },
          }}
        />

        {/* 2. Pending Orders */}
        <StatCard
          title='Pending Orders'
          value={stats.pending.toString()}
          description='Awaiting Update'
          icon={<Clock className='h-4 w-4' />}
          color='text-chart-3'
          trendData={trends}
          dataKey='total'
          chartConfig={{
            total: { label: 'Pending', color: 'var(--chart-3)' },
          }}
        />

        {/* 3. Exceptions */}
        <StatCard
          title='Exceptions'
          value={stats.exception.toString()}
          description='Attention Needed'
          icon={<AlertTriangle className='h-4 w-4' />}
          color='text-destructive'
          trendData={trends}
          dataKey='exception'
          chartConfig={{
            exception: {
              label: 'Exceptions',
              color: 'var(--destructive)',
            },
          }}
        />

        {/* 4. Delivered */}
        <StatCard
          title='Delivered'
          value={stats.delivered.toString()}
          description='Total Completed'
          icon={<CheckCircle2 className='h-4 w-4' />}
          color='text-chart-2'
          trendData={trends}
          dataKey='delivered'
          chartConfig={{
            delivered: { label: 'Delivered', color: 'var(--chart-2)' },
          }}
        />

        {/* 5. Avg Delivery */}
        <StatCard
          title='Avg Delivery'
          value={`${stats.avgDeliveryDays || 0} Days`}
          description='Performance'
          icon={<TrendingUp className='h-4 w-4' />}
          color='text-chart-4'
          trendData={trends}
          dataKey='delivered' // Correlated with delivery volume
          chartConfig={{
            delivered: { label: 'Performance', color: 'var(--chart-4)' },
          }}
        />

        {/* 6. Total Tracked */}
        <StatCard
          title='Total Tracked'
          value={stats.total.toString()}
          description='All Time'
          icon={<Package className='h-4 w-4' />}
          color='text-chart-1'
          trendData={trends}
          dataKey='total'
          chartConfig={{
            total: { label: 'Total', color: 'var(--chart-1)' },
          }}
        />

        {/* Row 2 Right: Quick Actions (Fills the gap after 6 stats) */}
        <Card className='col-span-1 md:col-span-2 lg:col-span-2 flex flex-col justify-between'>
          <CardHeader className='pb-2'>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 h-full items-center'>
            <Link href='/shipments' className='w-full'>
              <Button
                variant='outline'
                className='w-full justify-start h-auto py-2'>
                <Package className='mr-2 h-4 w-4' /> Manage
              </Button>
            </Link>
            <Link href='/leads' className='w-full'>
              <Button
                variant='outline'
                className='w-full justify-start h-auto py-2'>
                <Users className='mr-2 h-4 w-4' /> Leads
              </Button>
            </Link>
            <Link href='/settings' className='w-full'>
              <Button
                variant='outline'
                className='w-full justify-start h-auto py-2'>
                <DollarSign className='mr-2 h-4 w-4' /> Config
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Row 3+: Visuals */}

        {/* Shipment Map - New interactive visualization */}
        <ShipmentMap shipments={recentShipments} />

        {/* Main Chart - Takes full width */}
        <div className='col-span-1 md:col-span-2 lg:col-span-4 lg:row-span-2'>
          <ShipmentTrendsChart data={trends} />
        </div>
      </div>

      {/* Realtime Listener (Invisible) */}
      <ShipmentRealtimeListener />
    </div>
  );
}
