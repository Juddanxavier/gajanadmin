/** @format */

'use client';

import * as React from 'react';
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  XAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AreaChartProps {
  title: string;
  description: string;
  data: any[];
  config: ChartConfig;
  dataKeys: string[];
  timeRangeEnabled?: boolean;
  height?: string;
}

export function AreaChart({
  title,
  description,
  data,
  config,
  dataKeys,
  timeRangeEnabled = true,
  height = '250px',
}: AreaChartProps) {
  const [timeRange, setTimeRange] = React.useState('90d');

  const filteredData = React.useMemo(() => {
    if (!timeRangeEnabled) return data;

    return data.filter((item) => {
      const date = new Date(item.date);
      const now = new Date();
      let daysToSubtract = 90;

      if (timeRange === '30d') {
        daysToSubtract = 30;
      } else if (timeRange === '7d') {
        daysToSubtract = 7;
      }

      const startDate = new Date(now);
      startDate.setDate(now.getDate() - daysToSubtract);

      return date >= startDate;
    });
  }, [data, timeRange, timeRangeEnabled]);

  // Check if we have any data
  console.log('AreaChart Debug:', {
    title,
    dataLength: data?.length,
    filteredDataLength: filteredData?.length,
    dataKeys,
    sampleData: filteredData?.[0],
  });

  const hasData =
    filteredData &&
    filteredData.length > 0 &&
    filteredData.some((item) =>
      dataKeys.some((key) => item[key] != null && item[key] >= 0)
    );

  return (
    <Card className='pt-0'>
      <CardHeader className='flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row'>
        <div className='grid flex-1 gap-1'>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {timeRangeEnabled && (
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className='hidden w-[160px] rounded-lg sm:ml-auto sm:flex'
              aria-label='Select time range'>
              <SelectValue placeholder='Last 3 months' />
            </SelectTrigger>
            <SelectContent className='rounded-xl'>
              <SelectItem value='90d' className='rounded-lg'>
                Last 3 months
              </SelectItem>
              <SelectItem value='30d' className='rounded-lg'>
                Last 30 days
              </SelectItem>
              <SelectItem value='7d' className='rounded-lg'>
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        {!hasData ? (
          <div className='flex items-center justify-center' style={{ height }}>
            <div className='text-center space-y-2'>
              <p className='text-muted-foreground text-sm'>
                No data available for the selected time range
              </p>
              <p className='text-xs text-muted-foreground/70'>
                Data will appear here once records are created
              </p>
            </div>
          </div>
        ) : (
          <ChartContainer
            config={config}
            className='aspect-auto w-full'
            style={{ height }}>
            <RechartsAreaChart data={filteredData}>
              <defs>
                {dataKeys.map((key) => (
                  <linearGradient
                    key={key}
                    id={`fill${key.charAt(0).toUpperCase() + key.slice(1)}`}
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'>
                    <stop
                      offset='5%'
                      stopColor={`var(--color-${key})`}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset='95%'
                      stopColor={`var(--color-${key})`}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                vertical={false}
                strokeDasharray='2 4'
                className='stroke-muted/5'
              />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      });
                    }}
                    indicator='dot'
                  />
                }
              />
              {dataKeys.map((key, index) => (
                <Area
                  key={key}
                  dataKey={key}
                  type='natural'
                  fill={`url(#fill${key.charAt(0).toUpperCase() + key.slice(1)})`}
                  stroke={`var(--color-${key})`}
                  strokeWidth={1.5}
                  stackId='a'
                />
              ))}
              <ChartLegend content={<ChartLegendContent />} />
            </RechartsAreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
