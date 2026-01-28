/** @format */

// Notification Logs Page
// c:\websites\kajen\gajan\admin\app\(dashboard)\notifications\logs\page.tsx

import { createClient } from '@/lib/supabase/server';
import { getNotificationLogs, getNotificationStats } from './actions';
import { NotificationHistoryTable } from './table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle2, XCircle } from 'lucide-react';

export default async function NotificationLogsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <div>Unauthorized</div>;

  // Get Tenant context (if needed strictly, but actions handle RLS)
  // We fetch stats and initial logs
  const stats = await getNotificationStats();
  const initialLogs = await getNotificationLogs(1, 10);

  return (
    <div className='container mx-auto py-6 space-y-8'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-3xl font-bold tracking-tight'>Notification Logs</h1>
        <p className='text-muted-foreground'>
          Monitor system emails and alerts sent to customers and staff.
        </p>
      </div>

      {/* Stats Overview */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Volume</CardTitle>
            <Bell className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.total}</div>
            <p className='text-xs text-muted-foreground'>
              All time notifications
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Delivered</CardTitle>
            <CheckCircle2 className='h-4 w-4 text-green-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {stats.sent}
            </div>
            <p className='text-xs text-muted-foreground'>Successfully sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Failed</CardTitle>
            <XCircle className='h-4 w-4 text-red-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {stats.failed}
            </div>
            <p className='text-xs text-muted-foreground'>
              Errors (Quota, Auth, etc)
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>
            Real-time log of notification events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Client Component for Pagination/Refresh */}
          <NotificationHistoryTable initialData={initialLogs} />
        </CardContent>
      </Card>
    </div>
  );
}
