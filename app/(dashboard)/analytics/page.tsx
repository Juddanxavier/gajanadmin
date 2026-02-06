/** @format */

import {
  getPredictiveInsights,
  getRevenueAnalytics,
} from '@/app/(dashboard)/analytics/actions';
import { PredictiveInsights } from '@/components/analytics/predictive-insights';
import { RevenueChart } from '@/components/analytics/revenue-chart';
import { LeadsView } from '@/components/analytics/leads-view';
import { UsersView } from '@/components/analytics/users-view';
// import { ShipmentsView } from '@/components/analytics/shipments-view';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const revenueData = await getRevenueAnalytics(30);
  const insights = await getPredictiveInsights();

  return (
    <div className='flex-1 space-y-4 p-4 md:p-8 pt-6'>
      <div className='flex items-center justify-between space-y-2'>
        <h2 className='text-3xl font-bold tracking-tight'>Analytics</h2>
      </div>
      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='shipments'>Shipments</TabsTrigger>
          <TabsTrigger value='leads'>Leads</TabsTrigger>
          <TabsTrigger value='users'>Users</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <Suspense fallback={<AnalyticsSkeleton />}>
            <PredictiveInsights insights={insights} />
          </Suspense>

          <Suspense
            fallback={
              <div className='h-[300px] w-full bg-muted/20 animate-pulse rounded-lg' />
            }>
            <RevenueChart data={revenueData} />
          </Suspense>
        </TabsContent>

        <TabsContent value='shipments' className='space-y-4'>
          {/* <ShipmentsView /> */}
        </TabsContent>

        <TabsContent value='leads' className='space-y-4'>
          <LeadsView />
        </TabsContent>

        <TabsContent value='users' className='space-y-4'>
          <UsersView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className='grid gap-4 md:grid-cols-3'>
      <Skeleton className='h-[120px] w-full' />
      <Skeleton className='h-[120px] w-full' />
      <Skeleton className='h-[120px] w-full' />
    </div>
  );
}
