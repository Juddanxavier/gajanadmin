/** @format */

'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTheme } from 'next-themes';

interface ShipmentTrendsChartProps {
  data: {
    date: string;
    total: number;
    delivered: number;
    exception: number;
  }[];
}

export function ShipmentTrendsChart({ data }: ShipmentTrendsChartProps) {
  const { theme } = useTheme();

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Shipment Trends</CardTitle>
        <CardDescription>
          Daily shipment volume over the last 30 days.
        </CardDescription>
      </CardHeader>
      <CardContent className='pl-2'>
        <ResponsiveContainer width='100%' height={350}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id='colorTotal' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='#8b5cf6' stopOpacity={0.8} />
                <stop offset='95%' stopColor='#ec4899' stopOpacity={0} />
              </linearGradient>
            </defs>
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
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className='rounded-lg border bg-background p-2 shadow-sm'>
                      <div className='grid grid-cols-2 gap-2'>
                        <div className='flex flex-col'>
                          <span className='text-[0.70rem] uppercase text-muted-foreground'>
                            Total
                          </span>
                          <span className='font-bold text-muted-foreground'>
                            {payload[0].value}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <CartesianGrid
              strokeDasharray='3 3'
              vertical={false}
              className='stroke-muted'
            />
            <Area
              type='monotone'
              dataKey='total'
              stroke='#8b5cf6'
              fillOpacity={1}
              fill='url(#colorTotal)'
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
