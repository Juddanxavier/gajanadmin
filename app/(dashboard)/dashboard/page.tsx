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

export default async function AdminPage() {
  const shipmentService = new ShipmentService();

  // Parallel Fetching
  const [stats, recentShipmentsRes, trends] = await Promise.all([
    shipmentService.getStats(),
    shipmentService.getShipments({
      pageSize: 5,
      sortBy: { field: 'updated_at', direction: 'desc' },
    }),
    shipmentService.getShipmentTrends(30),
  ]);

  const recentShipments = recentShipmentsRes.data || [];

  const statCards = [
    {
      title: 'Active Shipments',
      value: stats.in_transit.toString(),
      icon: Truck,
      description: 'In Transit',
      color: 'text-chart-1',
    },
    {
      title: 'Pending Orders',
      value: stats.pending.toString(),
      icon: Clock,
      description: 'Awaiting Update',
      color: 'text-chart-2',
    },
    {
      title: 'Exceptions',
      value: stats.exception.toString(),
      icon: AlertTriangle,
      description: 'Attention Needed',
      color: 'text-destructive',
    },
    {
      title: 'Delivered',
      value: stats.delivered.toString(),
      icon: CheckCircle2,
      description: 'Total Completed',
      color: 'text-chart-3',
    },
    {
      title: 'Avg Delivery',
      value: stats.avgDeliveryDays ? `${stats.avgDeliveryDays} Days` : 'N/A',
      icon: TrendingUp,
      description: 'Performance',
      color: 'text-chart-4',
    },
    {
      title: 'Total Tracked',
      value: stats.total.toString(),
      icon: Package,
      description: 'All Time',
      color: 'text-muted-foreground',
    },
  ];

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
        {/* Row 1 & 2: Stats */}
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stat.value}</div>
                <p className='text-xs text-muted-foreground'>
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}

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

        {/* Main Chart - Takes 2x2 space */}
        <div className='col-span-1 md:col-span-2 lg:col-span-2 lg:row-span-2'>
          <ShipmentTrendsChart data={trends} />
        </div>

        {/* Live Activity - Tall Vertical Column on the right */}
        <div className='col-span-1 md:col-span-2 lg:col-span-2 lg:row-span-2'>
          <RecentActivity initialData={recentShipments} />
        </div>
      </div>
    </div>
  );
}
