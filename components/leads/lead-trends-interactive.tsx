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
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface LeadTrendsInteractiveProps {
  data: {
    date: string;
    total: number;
    converted: number;
    lost: number;
  }[];
}

export function LeadTrendsInteractive({ data }: LeadTrendsInteractiveProps) {
  const hasData = data && data.length > 0;

  // Use all 30 days for smooth curve
  const chartData = hasData ? data : [];

  // Check if there's any actual lead data
  const hasActualData = chartData.some(
    (d) => d.total > 0 || d.converted > 0 || d.lost > 0
  );

  // Format date for display (e.g., "Jan 10")
  const formattedData = chartData.map((d) => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <Card className='h-full flex flex-col shadow-md border-border/50 bg-card'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-base font-medium'>
              Lead Trends - Interactive
            </CardTitle>
            <CardDescription className='mt-1 text-xs'>
              Showing total visitors for the last 30 days
            </CardDescription>
          </div>
          <div className='text-xs text-muted-foreground px-3 py-1 rounded-md bg-muted/50'>
            Last 30 days
          </div>
        </div>
      </CardHeader>
      <CardContent className='flex-1 pb-2'>
        {!hasActualData ? (
          <div className='flex items-center justify-center h-[280px]'>
            <div className='text-center space-y-2'>
              <p className='text-muted-foreground text-sm'>
                No trend data available
              </p>
              <p className='text-xs text-muted-foreground/70'>
                Data will appear here once leads are created
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width='100%' height={280}>
            <AreaChart
              data={formattedData}
              margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                {/* Gradient for Converted (lighter blue - like Mobile in image) */}
                <linearGradient id='colorConverted' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='#60a5fa' stopOpacity={0.5} />
                  <stop offset='95%' stopColor='#60a5fa' stopOpacity={0.1} />
                </linearGradient>
                {/* Gradient for Total (darker blue - like Desktop in image) */}
                <linearGradient id='colorTotal' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='#2563eb' stopOpacity={0.7} />
                  <stop offset='95%' stopColor='#2563eb' stopOpacity={0.2} />
                </linearGradient>
              </defs>

              {/* X-axis - minimal, at bottom only */}
              <XAxis
                dataKey='displayDate'
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                interval='preserveStartEnd'
                minTickGap={40}
                dy={5}
              />

              {/* Tooltip */}
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className='rounded-md border bg-popover px-3 py-2 shadow-md'>
                        <p className='text-xs font-medium mb-1.5'>
                          {data.displayDate}
                        </p>
                        <div className='space-y-1'>
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 rounded-full bg-[#2563eb]'></div>
                            <span className='text-xs text-muted-foreground'>
                              Total:
                            </span>
                            <span className='text-xs font-semibold ml-auto'>
                              {data.total}
                            </span>
                          </div>
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 rounded-full bg-[#60a5fa]'></div>
                            <span className='text-xs text-muted-foreground'>
                              Converted:
                            </span>
                            <span className='text-xs font-semibold ml-auto'>
                              {data.converted}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={false}
              />

              {/* Legend at bottom - like in image */}
              <Legend
                wrapperStyle={{
                  fontSize: '11px',
                  paddingTop: '12px',
                }}
                iconType='circle'
                iconSize={6}
              />

              {/* Areas - Total first (darker blue, bottom) */}
              <Area
                type='monotone'
                dataKey='total'
                stroke='#2563eb'
                strokeWidth={1.5}
                fillOpacity={1}
                fill='url(#colorTotal)'
                name='Total'
                animationDuration={800}
                dot={false}
              />

              {/* Converted second (lighter blue, top) */}
              <Area
                type='monotone'
                dataKey='converted'
                stroke='#60a5fa'
                strokeWidth={1.5}
                fillOpacity={1}
                fill='url(#colorConverted)'
                name='Converted'
                animationDuration={800}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
