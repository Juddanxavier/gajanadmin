/** @format */

'use client';

import { AreaChart } from '@/components/charts/area-chart';
import { type ChartConfig } from '@/components/ui/chart';

interface UserTrendsChartProps {
  data: {
    date: string;
    total: number;
  }[];
}

const chartConfig = {
  total: {
    label: 'Total Users',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export function UserTrendsChart({ data }: UserTrendsChartProps) {
  return (
    <AreaChart
      title='User Growth'
      description='Showing total user registrations over time'
      data={data}
      config={chartConfig}
      dataKeys={['total']}
      timeRangeEnabled={true}
      height='250px'
    />
  );
}
