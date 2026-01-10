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
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface LeadTrendsSparklineProps {
  data: {
    date: string;
    total: number;
    converted: number;
    lost: number;
  }[];
}

export function LeadTrendsSparkline({ data }: LeadTrendsSparklineProps) {
  // Better data validation
  const hasData = data && data.length > 0;

  // Check if there's any actual lead data (not just empty days)
  const hasActualData =
    hasData && data.some((d) => d.total > 0 || d.converted > 0 || d.lost > 0);

  // Calculate CUMULATIVE totals from ALL days (not just last day)
  const totalLeads = hasData ? data.reduce((sum, d) => sum + d.total, 0) : 0;
  const convertedLeads = hasData
    ? data.reduce((sum, d) => sum + d.converted, 0)
    : 0;
  const lostLeads = hasData ? data.reduce((sum, d) => sum + d.lost, 0) : 0;

  // Debug logging
  console.log('LeadTrendsSparkline - Data:', {
    hasData,
    hasActualData,
    dataLength: data?.length,
    totalLeads,
    convertedLeads,
    lostLeads,
    sampleData: data?.slice(0, 3),
    firstDay: data?.[0],
    lastDay: data?.[data.length - 1],
    allData: data, // Show ALL data to see the issue
  });

  return (
    <Card className='h-full flex flex-col shadow-md border-border/50 bg-gradient-to-br from-background to-muted/20'>
      <CardHeader className='pb-4'>
        <CardTitle className='text-xl flex items-center gap-2'>
          <span className='h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 animate-pulse'></span>
          Lead Trends
        </CardTitle>
        <CardDescription>
          Quick overview of lead activity over time
        </CardDescription>
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
          <div className='space-y-6'>
            {/* Total Leads Sparkline */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-muted-foreground'>
                  Total Leads
                </span>
                <span className='text-2xl font-bold'>{totalLeads}</span>
              </div>
              <ResponsiveContainer width='100%' height={80}>
                <LineChart
                  data={data}
                  margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid
                    strokeDasharray='3 3'
                    stroke='hsl(var(--muted))'
                    opacity={0.2}
                  />
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className='rounded-lg border border-gray-700 bg-gray-900 text-white p-2 shadow-xl'>
                            <p className='text-xs font-semibold'>
                              {payload[0].value}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type='monotone'
                    dataKey='total'
                    stroke='#3b82f6'
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#3b82f6' }}
                    animationDuration={800}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Converted Sparkline */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-muted-foreground'>
                  Converted
                </span>
                <span className='text-2xl font-bold text-green-600 dark:text-green-400'>
                  {convertedLeads}
                </span>
              </div>
              <ResponsiveContainer width='100%' height={80}>
                <LineChart
                  data={data}
                  margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid
                    strokeDasharray='3 3'
                    stroke='hsl(var(--muted))'
                    opacity={0.2}
                  />
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className='rounded-lg border border-gray-700 bg-gray-900 text-white p-2 shadow-xl'>
                            <p className='text-xs font-semibold'>
                              {payload[0].value}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type='monotone'
                    dataKey='converted'
                    stroke='#10b981'
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#10b981' }}
                    animationDuration={800}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Lost Sparkline */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-muted-foreground'>
                  Lost
                </span>
                <span className='text-2xl font-bold text-red-600 dark:text-red-400'>
                  {lostLeads}
                </span>
              </div>
              <ResponsiveContainer width='100%' height={80}>
                <LineChart
                  data={data}
                  margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid
                    strokeDasharray='3 3'
                    stroke='hsl(var(--muted))'
                    opacity={0.2}
                  />
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className='rounded-lg border border-gray-700 bg-gray-900 text-white p-2 shadow-xl'>
                            <p className='text-xs font-semibold'>
                              {payload[0].value}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type='monotone'
                    dataKey='lost'
                    stroke='#ef4444'
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#ef4444' }}
                    animationDuration={800}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
