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
  Legend,
} from 'recharts';

interface LeadTrendsBarChartProps {
  data: {
    date: string;
    total: number;
    converted: number;
    lost: number;
  }[];
}

export function LeadTrendsBarChart({ data }: LeadTrendsBarChartProps) {
  const hasData = data && data.length > 0;

  // Get last 14 days for better visibility
  const recentData = hasData ? data.slice(-14) : [];

  // Check if there's any actual lead data
  const hasActualData = recentData.some(
    (d) => d.total > 0 || d.converted > 0 || d.lost > 0
  );

  // Format date for display (e.g., "Jan 10")
  const formattedData = recentData.map((d) => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  // Calculate totals
  const totalLeads = hasData ? data.reduce((sum, d) => sum + d.total, 0) : 0;
  const convertedLeads = hasData
    ? data.reduce((sum, d) => sum + d.converted, 0)
    : 0;
  const lostLeads = hasData ? data.reduce((sum, d) => sum + d.lost, 0) : 0;

  return (
    <Card className='h-full flex flex-col shadow-md border-border/50 bg-gradient-to-br from-background to-muted/20'>
      <CardHeader className='pb-4'>
        <CardTitle className='text-xl flex items-center gap-2'>
          <span className='h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 animate-pulse'></span>
          Lead Trends
        </CardTitle>
        <CardDescription>Last 14 days of lead activity</CardDescription>
      </CardHeader>
      <CardContent className='flex-1 pb-4'>
        {!hasActualData ? (
          <div className='flex items-center justify-center h-[350px]'>
            <div className='text-center space-y-2'>
              <p className='text-muted-foreground text-sm'>
                No trend data available
              </p>
              <p className='text-xs text-muted-foreground/70'>
                {hasData
                  ? 'No leads found in the selected period'
                  : 'Data will appear here once leads are created'}
              </p>
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            {/* Summary Stats */}
            <div className='grid grid-cols-3 gap-4'>
              <div className='text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20'>
                <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                  {totalLeads}
                </div>
                <div className='text-xs text-muted-foreground mt-1'>Total</div>
              </div>
              <div className='text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20'>
                <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
                  {convertedLeads}
                </div>
                <div className='text-xs text-muted-foreground mt-1'>
                  Converted
                </div>
              </div>
              <div className='text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20'>
                <div className='text-2xl font-bold text-red-600 dark:text-red-400'>
                  {lostLeads}
                </div>
                <div className='text-xs text-muted-foreground mt-1'>Lost</div>
              </div>
            </div>

            {/* Bar Chart */}
            <ResponsiveContainer width='100%' height={250}>
              <BarChart
                data={formattedData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='hsl(var(--muted))'
                  opacity={0.3}
                />
                <XAxis
                  dataKey='displayDate'
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className='rounded-lg border border-gray-700 bg-gray-900 text-white p-3 shadow-xl'>
                          <p className='text-xs font-semibold mb-2'>
                            {data.displayDate}
                          </p>
                          <div className='space-y-1'>
                            <div className='flex items-center justify-between gap-4'>
                              <span className='text-xs flex items-center gap-1'>
                                <span className='w-2 h-2 rounded-full bg-blue-500'></span>
                                Total:
                              </span>
                              <span className='text-xs font-bold'>
                                {data.total}
                              </span>
                            </div>
                            <div className='flex items-center justify-between gap-4'>
                              <span className='text-xs flex items-center gap-1'>
                                <span className='w-2 h-2 rounded-full bg-green-500'></span>
                                Converted:
                              </span>
                              <span className='text-xs font-bold'>
                                {data.converted}
                              </span>
                            </div>
                            <div className='flex items-center justify-between gap-4'>
                              <span className='text-xs flex items-center gap-1'>
                                <span className='w-2 h-2 rounded-full bg-red-500'></span>
                                Lost:
                              </span>
                              <span className='text-xs font-bold'>
                                {data.lost}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} iconType='circle' />
                <Bar
                  dataKey='total'
                  fill='#3b82f6'
                  radius={[4, 4, 0, 0]}
                  name='Total'
                />
                <Bar
                  dataKey='converted'
                  fill='#10b981'
                  radius={[4, 4, 0, 0]}
                  name='Converted'
                />
                <Bar
                  dataKey='lost'
                  fill='#ef4444'
                  radius={[4, 4, 0, 0]}
                  name='Lost'
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
