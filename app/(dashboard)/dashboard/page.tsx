/** @format */

import {
  getDashboardStats,
  getShipmentTrends,
  getRecentActivities,
  getPerformanceStats,
  getCarrierStats,
} from './actions';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { ShipmentTrends } from '@/components/dashboard/shipment-trends';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { CarrierDistribution } from '@/components/dashboard/carrier-distribution';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function RequestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in</div>;
  }

  // Fetch role for Quick Actions
  const admin = createAdminClient();
  const { data: isGlobal } = await admin.rpc('is_admin', {
    user_uuid: user.id,
  });

  const { data: roles } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const role = isGlobal
    ? 'super_admin'
    : roles?.some((r) => r.role === 'admin')
      ? 'admin'
      : 'user';

  // Parallel Data Fetching
  const [statsResult, trendsResult, recentActivity, performance, carrierStats] =
    await Promise.all([
      getDashboardStats(),
      getShipmentTrends(),
      getRecentActivities(),
      getPerformanceStats(),
      getCarrierStats(),
    ]);

  const stats = statsResult.success
    ? statsResult.stats
    : { total: 0, active: 0, exceptions: 0, delivered: 0 };

  const trends = trendsResult.success ? trendsResult.data : [];

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
          <p className='text-muted-foreground mt-1'>
            Get a comprehensive overview of your shipments, performance metrics,
            and recent activities at a glance.
          </p>
        </div>
      </div>

      {/* Bento Grid Layout */}
      {/* Stats Overview - Top & Full Width */}
      <div className='mb-6'>
        <StatsOverview stats={stats as any} performance={performance} />
      </div>

      {/* Main Content Grid: 2 Columns */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 items-start'>
        {/* Left Column Stack */}
        <div className='space-y-6'>
          {/* Quick Actions */}
          <QuickActions role={role} />

          {/* Shipment Trends */}
          <ShipmentTrends data={trends} />
        </div>

        {/* Right Column Stack */}
        <div className='space-y-6'>
          {/* Carrier Distribution */}
          <CarrierDistribution data={carrierStats} />

          {/* Recent Activity */}
          <RecentActivity initialData={recentActivity} />
        </div>
      </div>
    </div>
  );
}
