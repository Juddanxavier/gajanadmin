/** @format */

'use client';

import { AreaChart } from '@/components/charts/area-chart';
import { type ChartConfig } from '@/components/ui/chart';

interface LeadTrendsChartProps {
  data: {
    date: string;
    total: number;
    converted: number;
    lost: number;
  }[];
}

const chartConfig = {
  total: {
    label: 'Total Leads',
    color: 'var(--chart-1)',
  },
  converted: {
    label: 'Converted',
    color: 'var(--chart-2)',
  },
  lost: {
    label: 'Lost/Failed',
    color: 'var(--destructive)',
  },
} satisfies ChartConfig;

export function LeadTrendsChart({ data }: LeadTrendsChartProps) {
  return (
    <AreaChart
      title='Lead Analytics'
      description='Trend analysis of new leads vs conversions'
      data={data}
      config={chartConfig}
      dataKeys={['total', 'converted', 'lost']}
      timeRangeEnabled={true}
      height='250px'
    />
  );
}
