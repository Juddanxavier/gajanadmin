/** @format */

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface TopDestinationsChartProps {
  data: {
    country: string;
    count: number;
    value: number;
  }[];
}

const GRADIENT_COLORS = [
  { id: 'gradient1', start: '#3b82f6', end: '#1d4ed8' }, // Blue
  { id: 'gradient2', start: '#10b981', end: '#059669' }, // Green
  { id: 'gradient3', start: '#f59e0b', end: '#d97706' }, // Amber
  { id: 'gradient4', start: '#8b5cf6', end: '#6d28d9' }, // Purple
  { id: 'gradient5', start: '#ec4899', end: '#db2777' }, // Pink
];

export function TopDestinationsChart({ data }: TopDestinationsChartProps) {
  // Sort by count and take top 5
  const topDestinations = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const hasData = topDestinations.length > 0;

  return (
    <Card className='h-full flex flex-col shadow-md border-border/50 bg-gradient-to-br from-background to-muted/20'>
      <CardHeader className='pb-4'>
        <CardTitle className='text-xl flex items-center gap-2'>
          <span className='h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse'></span>
          Top Destinations
        </CardTitle>
        <CardDescription>
          Most popular destination countries by lead volume
        </CardDescription>
      </CardHeader>
      <CardContent className='flex-1 pb-4'>
        {!hasData ? (
          <div className='flex items-center justify-center h-[250px]'>
            <div className='text-center space-y-2'>
              <p className='text-muted-foreground text-sm'>
                No destination data available
              </p>
              <p className='text-xs text-muted-foreground/70'>
                Data will appear here once leads are created
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width='100%' height={250}>
            <BarChart
              data={topDestinations}
              layout='vertical'
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                {GRADIENT_COLORS.map((gradient) => (
                  <linearGradient
                    key={gradient.id}
                    id={gradient.id}
                    x1='0'
                    y1='0'
                    x2='1'
                    y2='0'>
                    <stop
                      offset='0%'
                      stopColor={gradient.start}
                      stopOpacity={0.9}
                    />
                    <stop
                      offset='100%'
                      stopColor={gradient.end}
                      stopOpacity={1}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray='3 3'
                horizontal={true}
                vertical={false}
                className='stroke-muted/30'
              />
              <XAxis
                type='number'
                tickLine={false}
                axisLine={false}
                className='text-xs text-muted-foreground'
              />
              <YAxis
                type='category'
                dataKey='country'
                tickLine={false}
                axisLine={false}
                width={100}
                className='text-xs font-medium'
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted) / 0.15)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className='rounded-lg border bg-background/95 backdrop-blur-sm p-3 shadow-lg'>
                        <div className='space-y-1.5'>
                          <p className='font-semibold text-sm flex items-center gap-2'>
                            <span className='h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500'></span>
                            {data.country}
                          </p>
                          <div className='flex items-center justify-between gap-4'>
                            <span className='text-xs text-muted-foreground'>
                              Leads:
                            </span>
                            <span className='font-semibold text-sm'>
                              {data.count}
                            </span>
                          </div>
                          <div className='flex items-center justify-between gap-4'>
                            <span className='text-xs text-muted-foreground'>
                              Value:
                            </span>
                            <span className='font-semibold text-sm text-green-600 dark:text-green-400'>
                              ${(data.value / 1000).toFixed(1)}k
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey='count' radius={[0, 8, 8, 0]} maxBarSize={35}>
                {topDestinations.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#${GRADIENT_COLORS[index % GRADIENT_COLORS.length].id})`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
