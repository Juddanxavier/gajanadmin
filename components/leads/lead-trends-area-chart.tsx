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
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface LeadTrendsAreaChartProps {
  data: {
    date: string;
    total: number;
    converted: number;
    lost: number;
  }[];
}

export function LeadTrendsAreaChart({ data }: LeadTrendsAreaChartProps) {
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
  const conversionRate =
    totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';

  return (
    <Card className='h-full flex flex-col shadow-md border-border/50 bg-gradient-to-br from-background to-muted/20'>
      <CardHeader className='pb-4'>
        <CardTitle className='text-xl flex items-center gap-2'>
          <span className='h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 animate-pulse'></span>
          Lead Trends
        </CardTitle>
        <CardDescription>Last 14 days performance overview</CardDescription>
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
            <div className='grid grid-cols-4 gap-3'>
              <div className='text-center p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20'>
                <div className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
                  {totalLeads}
                </div>
                <div className='text-xs text-muted-foreground mt-1'>Total</div>
              </div>
              <div className='text-center p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20'>
                <div className='text-2xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent'>
                  {convertedLeads}
                </div>
                <div className='text-xs text-muted-foreground mt-1'>
                  Converted
                </div>
              </div>
              <div className='text-center p-3 rounded-lg bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20'>
                <div className='text-2xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent'>
                  {lostLeads}
                </div>
                <div className='text-xs text-muted-foreground mt-1'>Lost</div>
              </div>
              <div className='text-center p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20'>
                <div className='text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent'>
                  {conversionRate}%
                </div>
                <div className='text-xs text-muted-foreground mt-1'>Rate</div>
              </div>
            </div>

            {/* Area Chart */}
            <ResponsiveContainer width='100%' height={240}>
              <AreaChart
                data={formattedData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {/* Gradient for Total */}
                  <linearGradient id='colorTotal' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#3b82f6' stopOpacity={0.8} />
                    <stop offset='95%' stopColor='#3b82f6' stopOpacity={0.1} />
                  </linearGradient>
                  {/* Gradient for Converted */}
                  <linearGradient
                    id='colorConverted'
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'>
                    <stop offset='5%' stopColor='#10b981' stopOpacity={0.8} />
                    <stop offset='95%' stopColor='#10b981' stopOpacity={0.1} />
                  </linearGradient>
                  {/* Gradient for Lost */}
                  <linearGradient id='colorLost' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#ef4444' stopOpacity={0.8} />
                    <stop offset='95%' stopColor='#ef4444' stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='hsl(var(--muted))'
                  opacity={0.2}
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
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  iconType='circle'
                />
                <Area
                  type='monotone'
                  dataKey='total'
                  stroke='#3b82f6'
                  strokeWidth={2}
                  fillOpacity={1}
                  fill='url(#colorTotal)'
                  name='Total'
                />
                <Area
                  type='monotone'
                  dataKey='converted'
                  stroke='#10b981'
                  strokeWidth={2}
                  fillOpacity={1}
                  fill='url(#colorConverted)'
                  name='Converted'
                />
                <Area
                  type='monotone'
                  dataKey='lost'
                  stroke='#ef4444'
                  strokeWidth={2}
                  fillOpacity={1}
                  fill='url(#colorLost)'
                  name='Lost'
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
