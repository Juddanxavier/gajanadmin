/** @format */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface ShipmentTrendsProps {
  data: { date: string; count: number }[];
}

export function ShipmentTrends({ data }: ShipmentTrendsProps) {
  if (!data || data.length === 0) {
    return (
      <Card className='col-span-4 h-full'>
        <CardHeader>
          <CardTitle>Shipment Trends</CardTitle>
          <p className='text-sm text-muted-foreground'>
            No data available for the last 30 days.
          </p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className='h-fit shadow-md hover:shadow-lg transition-all'>
      <CardHeader>
        <CardTitle>Shipment Volume</CardTitle>
        <p className='text-sm text-muted-foreground'>
          Daily shipments created over the last 30 days
        </p>
      </CardHeader>
      <CardContent className='pl-2 h-[300px]'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={data}>
            <XAxis
              dataKey='date'
              stroke='#888888'
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => {
                const d = new Date(val);
                return `${d.getDate()}/${d.getMonth() + 1}`;
              }}
            />
            <YAxis
              stroke='#888888'
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #ccc' }}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
              cursor={{ stroke: '#888888', strokeWidth: 1 }}
            />
            <Line
              type='monotone'
              dataKey='count'
              stroke='#2563eb'
              strokeWidth={2}
              dot={{ r: 4, fill: '#2563eb' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
