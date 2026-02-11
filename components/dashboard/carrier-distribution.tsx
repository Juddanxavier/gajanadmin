/** @format */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Cell, PieChart, Pie, ResponsiveContainer, Legend } from 'recharts';

interface CarrierDistributionProps {
  data: {
    name: string;
    value: number;
  }[];
}

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

export function CarrierDistribution({ data }: CarrierDistributionProps) {
  // Config for Tooltip
  const chartConfig = data.reduce((acc, curr, index) => {
    acc[curr.name] = {
      label: curr.name,
      color: COLORS[index % COLORS.length],
    };
    return acc;
  }, {} as any);

  return (
    <Card className='col-span-1 h-fit shadow-md hover:shadow-lg transition-all'>
      <CardHeader>
        <CardTitle>Carrier Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='h-[300px] w-full'>
          {data.length > 0 ? (
            <ChartContainer config={chartConfig} className='h-full w-full'>
              <PieChart>
                <Pie
                  data={data}
                  cx='50%'
                  cy='50%'
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey='value'
                  label={({
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    value,
                    index,
                  }: any) => {
                    const RADIAN = Math.PI / 180;
                    const radius =
                      25 + innerRadius + (outerRadius - innerRadius);
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill='#888888'
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline='central'
                        className='text-xs'>
                        {data[index].name} ({value})
                      </text>
                    );
                  }}>
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      strokeWidth={0}
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className='flex items-center justify-center h-full text-muted-foreground'>
              No data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
