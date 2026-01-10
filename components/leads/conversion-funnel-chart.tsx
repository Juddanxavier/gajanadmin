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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface ConversionFunnelChartProps {
  data: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
}

const COLORS = [
  { color: '#f59e0b', name: 'Pending', gradient: ['#fbbf24', '#f59e0b'] }, // Amber
  { color: '#3b82f6', name: 'Processing', gradient: ['#60a5fa', '#3b82f6'] }, // Blue
  { color: '#10b981', name: 'Completed', gradient: ['#34d399', '#10b981'] }, // Green
  { color: '#ef4444', name: 'Failed', gradient: ['#f87171', '#ef4444'] }, // Red
];

export function ConversionFunnelChart({ data }: ConversionFunnelChartProps) {
  const total = data.pending + data.processing + data.completed + data.failed;

  const chartData = [
    {
      name: 'Pending',
      value: data.pending,
      percentage: total > 0 ? ((data.pending / total) * 100).toFixed(1) : 0,
      color: COLORS[0].color,
    },
    {
      name: 'Processing',
      value: data.processing,
      percentage: total > 0 ? ((data.processing / total) * 100).toFixed(1) : 0,
      color: COLORS[1].color,
    },
    {
      name: 'Completed',
      value: data.completed,
      percentage: total > 0 ? ((data.completed / total) * 100).toFixed(1) : 0,
      color: COLORS[2].color,
    },
    {
      name: 'Failed',
      value: data.failed,
      percentage: total > 0 ? ((data.failed / total) * 100).toFixed(1) : 0,
      color: COLORS[3].color,
    },
  ].filter((item) => item.value > 0); // Only show segments with data

  const hasData = total > 0;

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    if (percent < 0.05) return null; // Don't show label if too small

    return (
      <text
        x={x}
        y={y}
        fill='white'
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline='central'
        className='font-semibold text-xs drop-shadow-lg'>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className='h-full flex flex-col shadow-md border-border/50 bg-gradient-to-br from-background to-muted/20'>
      <CardHeader className='pb-4'>
        <CardTitle className='text-xl flex items-center gap-2'>
          <span className='h-2 w-2 rounded-full bg-gradient-to-r from-amber-500 to-green-500 animate-pulse'></span>
          Conversion Funnel
        </CardTitle>
        <CardDescription>
          Lead status breakdown and conversion flow
        </CardDescription>
      </CardHeader>
      <CardContent className='flex-1 pb-4'>
        {!hasData ? (
          <div className='flex items-center justify-center h-[250px]'>
            <div className='text-center space-y-2'>
              <p className='text-muted-foreground text-sm'>
                No funnel data available
              </p>
              <p className='text-xs text-muted-foreground/70'>
                Data will appear here once leads are created
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width='100%' height={350}>
            <PieChart>
              <defs>
                {COLORS.map((item, index) => (
                  <linearGradient
                    key={`gradient-${index}`}
                    id={`gradient-${index}`}
                    x1='0'
                    y1='0'
                    x2='1'
                    y2='1'>
                    <stop
                      offset='0%'
                      stopColor={item.gradient[0]}
                      stopOpacity={1}
                    />
                    <stop
                      offset='100%'
                      stopColor={item.gradient[1]}
                      stopOpacity={1}
                    />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={chartData}
                cx='50%'
                cy='50%'
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                innerRadius={60}
                fill='#8884d8'
                dataKey='value'
                paddingAngle={2}
                animationBegin={0}
                animationDuration={800}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#gradient-${index})`}
                    stroke='hsl(var(--background))'
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className='rounded-lg border border-gray-700 bg-gray-900 text-white p-3 shadow-xl'>
                        <div className='space-y-1.5'>
                          <div className='flex items-center gap-2'>
                            <span
                              className='h-3 w-3 rounded-full'
                              style={{ backgroundColor: data.color }}></span>
                            <p className='font-semibold text-sm'>{data.name}</p>
                          </div>
                          <div className='flex items-center justify-between gap-4'>
                            <span className='text-xs opacity-80'>Count:</span>
                            <span className='font-semibold text-sm'>
                              {data.value}
                            </span>
                          </div>
                          <div className='flex items-center justify-between gap-4'>
                            <span className='text-xs opacity-80'>
                              Percentage:
                            </span>
                            <span className='font-semibold text-sm'>
                              {data.percentage}%
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
                verticalAlign='bottom'
                height={36}
                iconType='circle'
                formatter={(value, entry: any) => (
                  <span className='text-xs font-medium'>
                    {value} ({entry.payload.value})
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
