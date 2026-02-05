/** @format */

'use client';

import { TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RevenueData } from '@/app/(dashboard)/analytics/actions';

interface RevenueChartProps {
  data: RevenueData[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Calculate total revenue from data
  const totalRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalProjected = data.reduce((acc, curr) => acc + curr.projected, 0);

  const formattedRevenue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(totalRevenue);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Analytics</CardTitle>
        <CardDescription>
          Realized vs Projected Revenue (Last 30 Days)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='h-[300px] w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{
                left: 12,
                right: 12,
              }}>
              <CartesianGrid
                vertical={false}
                strokeDasharray='3 3'
                opacity={0.1}
              />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(5)} // Show MM-DD
                fontSize={12}
                tick={{ fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${value}`}
                fontSize={12}
                tick={{ fill: 'var(--muted-foreground)' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className='rounded-lg border bg-background p-2 shadow-sm'>
                        <div className='grid grid-cols-2 gap-2'>
                          <div className='flex flex-col'>
                            <span className='text-[0.70rem] uppercase text-muted-foreground'>
                              Revenue
                            </span>
                            <span className='font-bold text-emerald-500'>
                              ₹{payload[0].value}
                            </span>
                          </div>
                          <div className='flex flex-col'>
                            <span className='text-[0.70rem] uppercase text-muted-foreground'>
                              Projected
                            </span>
                            <span className='font-bold text-blue-500'>
                              ₹{payload[1].value}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                dataKey='projected'
                type='monotone'
                fill='var(--chart-2)'
                fillOpacity={0.1}
                stroke='var(--chart-2)'
                strokeWidth={2}
                stackId='a'
              />
              <Area
                dataKey='revenue'
                type='monotone'
                fill='var(--chart-1)'
                fillOpacity={0.4}
                stroke='var(--chart-1)'
                strokeWidth={2}
                stackId='b'
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-2'>
            <div className='flex items-center gap-2 font-medium leading-none'>
              Total Revenue: {formattedRevenue}{' '}
              <TrendingUp className='h-4 w-4 text-emerald-500' />
            </div>
            <div className='flex items-center gap-2 leading-none text-muted-foreground'>
              Total Pipeline Value:{' '}
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
              }).format(totalProjected)}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
