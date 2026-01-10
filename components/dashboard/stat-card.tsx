/** @format */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { Line, LineChart } from 'recharts';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trendData?: any[]; // Optional trend data
  color: string; // Hex color or chart variable
  chartConfig?: any; // Optional config
  dataKey?: string; // Optional data key
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trendData,
  color,
  chartConfig,
  dataKey,
}: StatCardProps) {
  return (
    <Card className='overflow-hidden relative border-border/40 hover:border-border/60 transition-all duration-300 hover:shadow-md'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>
          {title}
        </CardTitle>
        <div className={`p-2.5 rounded-lg bg-accent/5 ${color}`}>{icon}</div>
      </CardHeader>
      <CardContent className='pb-14'>
        <div className='text-2xl font-bold tracking-tight'>{value}</div>
        <p className='text-xs text-muted-foreground mt-1.5'>{description}</p>
      </CardContent>

      {trendData && trendData.length > 0 && chartConfig && dataKey && (
        <div className='absolute bottom-0 left-0 right-0 h-[50px] w-full opacity-30 hover:opacity-60 transition-opacity duration-300'>
          <ChartContainer config={chartConfig} className='h-full w-full'>
            <LineChart data={trendData}>
              <Line
                dataKey={dataKey}
                type='monotone'
                stroke={chartConfig[dataKey]?.color || 'var(--chart-1)'}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={true}
              />
            </LineChart>
          </ChartContainer>
        </div>
      )}
    </Card>
  );
}
