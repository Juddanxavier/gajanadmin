/** @format */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { InsightMetric } from '@/app/(dashboard)/analytics/actions';

interface PredictiveInsightsProps {
  insights: InsightMetric[];
}

export function PredictiveInsights({ insights }: PredictiveInsightsProps) {
  return (
    <div className='grid gap-4 md:grid-cols-3'>
      {insights.map((insight, i) => (
        <Card key={i} className='overflow-hidden'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              {insight.title}
            </CardTitle>
            {insight.status === 'positive' && (
              <CheckCircle2 className='h-4 w-4 text-emerald-500' />
            )}
            {insight.status === 'negative' && (
              <AlertTriangle className='h-4 w-4 text-red-500' />
            )}
            {insight.status === 'warning' && (
              <AlertTriangle className='h-4 w-4 text-amber-500' />
            )}
            {insight.status === 'neutral' && (
              <TrendingUp className='h-4 w-4 text-muted-foreground' />
            )}
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{insight.value}</div>
            <p className='text-xs text-muted-foreground'>
              {insight.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
