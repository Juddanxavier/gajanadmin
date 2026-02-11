/** @format */

import { formatDistanceToNow } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface NotificationItem {
  id: string;
  event_type: string;
  channel: string;
  status: string;
  scheduled_for?: string;
  created_at: string;
  updated_at: string;
  error_message?: string;
  retry_count: number;
}

interface ShipmentNotificationsProps {
  notifications: NotificationItem[];
}

export function ShipmentNotifications({
  notifications,
}: ShipmentNotificationsProps) {
  if (!notifications || notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Notification History</CardTitle>
          <CardDescription>
            No notifications recorded for this shipment.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className='h-4 w-4 text-green-500' />;
      case 'failed':
        return <XCircle className='h-4 w-4 text-red-500' />;
      case 'processing':
        return <Clock className='h-4 w-4 text-blue-500 animate-pulse' />;
      default:
        return <Clock className='h-4 w-4 text-gray-400' />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className='h-4 w-4 text-slate-500' />;
      case 'whatsapp':
        return <MessageSquare className='h-4 w-4 text-green-600' />;
      default:
        return <AlertCircle className='h-4 w-4' />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Notification History</CardTitle>
        <CardDescription>
          Recent automated notifications sent to customrs.
        </CardDescription>
      </CardHeader>
      <CardContent className='p-0'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[30px]'></TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.map((n) => (
              <TableRow key={n.id}>
                <TableCell>{getStatusIcon(n.status)}</TableCell>
                <TableCell className='font-medium'>
                  {n.event_type.replace(/_/g, ' ')}
                  {n.retry_count > 0 && (
                    <span className='ml-2 text-xs text-muted-foreground'>
                      (Retry {n.retry_count})
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    {getChannelIcon(n.channel)}
                    <span className='capitalize'>{n.channel}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={n.status === 'completed' ? 'secondary' : 'outline'}
                    className='capitalize'>
                    {n.status}
                  </Badge>
                  {n.error_message && (
                    <div
                      className='text-xs text-red-500 mt-1 max-w-[200px] truncate'
                      title={n.error_message}>
                      {n.error_message}
                    </div>
                  )}
                </TableCell>
                <TableCell className='text-right text-muted-foreground whitespace-nowrap'>
                  {formatDistanceToNow(new Date(n.created_at), {
                    addSuffix: true,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
