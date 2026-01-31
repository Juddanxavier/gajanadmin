/** @format */

import { Metadata } from 'next';
import { getNotificationLogs } from './actions';
import { NotificationHistoryTable } from './table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Notification History',
  description: 'View sent email and SMS logs',
};

export default async function NotificationHistoryPage() {
  const initialData = await getNotificationLogs(1, 20);

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Notification History</h3>
        <p className='text-sm text-muted-foreground'>
          View a log of all system notifications sent to customers and staff.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sent Logs</CardTitle>
          <CardDescription>
            Real-time status of email/SMS delivery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationHistoryTable initialData={initialData} />
        </CardContent>
      </Card>
    </div>
  );
}
