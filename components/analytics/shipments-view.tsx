/** @format */

'use client';

import { useEffect, useState } from 'react';
import { getShipmentAnalyticsData } from '@/app/(dashboard)/analytics/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Package, Truck, CheckCircle, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_COLORS = {
  pending: '#fbbf24',
  in_transit: '#3b82f6',
  out_for_delivery: '#8b5cf6',
  delivered: '#22c55e',
  exception: '#ef4444',
  cancelled: '#6b7280',
  failed: '#dc2626',
};

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
];

const EmptyAnalyticsState = () => (
  <div className='flex flex-col items-center justify-center min-h-[400px] rounded-lg border border-dashed p-8 text-center animate-in fade-in-50'>
    <div className='flex h-20 w-20 items-center justify-center rounded-full bg-muted'>
      <Package className='h-10 w-10 text-muted-foreground' />
    </div>
    <h3 className='mt-4 text-lg font-semibold'>No shipment data found</h3>
    <p className='mb-4 mt-2 text-sm text-muted-foreground max-w-sm'>
      We couldn&apos;t find any shipment analytics for the selected period. Try
      adjusting your filters or create a new shipment to get started.
    </p>
  </div>
);

export function ShipmentsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getShipmentAnalyticsData(30);
        // Ensure we check for valid data structure, not just non-null
        if (result && result.stats) {
          setData(result);
        } else {
          setData(null);
        }
      } catch (error) {
        console.error('Failed to fetch shipment analytics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (!data) {
    return <EmptyAnalyticsState />;
  }

  const { stats, trends, statusDistribution, carrierPerformance } = data;

  return (
    <div className='space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500'>
      {/* Overview Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Shipments
            </CardTitle>
            <Package className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.total}</div>
            <p className='text-xs text-muted-foreground'>Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active</CardTitle>
            <Truck className='h-4 w-4 text-blue-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.active}</div>
            <p className='text-xs text-muted-foreground'>In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Delivered</CardTitle>
            <CheckCircle className='h-4 w-4 text-green-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.delivered}</div>
            <p className='text-xs text-muted-foreground'>Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Exceptions</CardTitle>
            <AlertTriangle className='h-4 w-4 text-red-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.exceptions}</div>
            <p className='text-xs text-muted-foreground'>Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
        {/* Trend Chart */}
        <Card className='col-span-4'>
          <CardHeader>
            <CardTitle>Shipment Volume (30 Days)</CardTitle>
          </CardHeader>
          <CardContent className='pl-2'>
            <div className='h-[350px] w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={trends}>
                  <XAxis
                    dataKey='date'
                    stroke='#888888'
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis
                    stroke='#888888'
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #ccc',
                    }}
                    labelFormatter={(label) =>
                      new Date(label).toLocaleDateString()
                    }
                  />
                  <Line
                    type='monotone'
                    dataKey='count'
                    stroke='#2563eb'
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className='col-span-3'>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='h-[350px] w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx='50%'
                    cy='50%'
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey='value'
                    label={({ name, percent }) =>
                      `${name} ${((percent || 0) * 100).toFixed(0)}%`
                    }>
                    {statusDistribution.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          STATUS_COLORS[
                            entry.name
                              .toLowerCase()
                              .replace(' ', '_') as keyof typeof STATUS_COLORS
                          ] || COLORS[index % COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carrier Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Top Carriers by Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-[300px] w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={carrierPerformance} layout='vertical'>
                <XAxis type='number' hide />
                <YAxis
                  dataKey='name'
                  type='category'
                  width={100}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #ccc',
                  }}
                />
                <Bar dataKey='value' fill='#adfa1d' radius={[0, 4, 4, 0]}>
                  {carrierPerformance.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Stats Cards Skeleton */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <Skeleton className='h-4 w-[100px]' />
              <Skeleton className='h-4 w-4 rounded-full' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-8 w-[60px] mb-1' />
              <Skeleton className='h-3 w-[80px]' />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
        <Card className='col-span-4'>
          <CardHeader>
            <Skeleton className='h-6 w-[200px]' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-[300px] w-full' />
          </CardContent>
        </Card>
        <Card className='col-span-3'>
          <CardHeader>
            <Skeleton className='h-6 w-[150px]' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-[300px] w-full rounded-full' />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Chart Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-[180px]' />
        </CardHeader>
        <CardContent>
          <Skeleton className='h-[250px] w-full' />
        </CardContent>
      </Card>
    </div>
  );
}
