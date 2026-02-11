/** @format */

'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { getNotificationLogs } from './actions';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Log {
  id: string;
  created_at: string;
  recipient: string;
  type: string;
  subject?: string;
  status: string;
  error_message?: string;
  provider_id?: string;
}

interface TableProps {
  initialData: any;
}

export function NotificationHistoryTable({ initialData }: TableProps) {
  const [data, setData] = useState<Log[]>((initialData?.data ?? []) as Log[]);
  const [metadata, setMetadata] = useState(
    initialData.metadata || { page: 1, totalPages: 1 },
  );
  const [loading, setLoading] = useState(false);

  const fetchData = async (page: number) => {
    setLoading(true);
    try {
      const res = await getNotificationLogs(page);
      if (res.success) {
        setData(res.data || []);
        setMetadata(res.metadata);
      } else {
        toast.error(res.error || 'Failed to fetch logs');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
        return 'default'; // primary/black
      case 'sent':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'pending':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => fetchData(1)}
          disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Type/Subject</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='h-24 text-center'>
                  No logs found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge
                      variant={getStatusColor(log.status)}
                      className='capitalize'>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground whitespace-nowrap'>
                    {format(new Date(log.created_at), 'MMM d, p')}
                  </TableCell>
                  <TableCell className='font-medium'>{log.recipient}</TableCell>
                  <TableCell>
                    <div className='flex flex-col'>
                      <span className='text-xs font-semibold uppercase text-muted-foreground'>
                        {log.type}
                      </span>
                      <span className='text-sm truncate max-w-[200px]'>
                        {log.subject || '-'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.error_message ? (
                      <div
                        className='flex items-center text-destructive text-xs gap-1'
                        title={log.error_message}>
                        <AlertCircle className='h-3 w-3' />
                        <span className='truncate max-w-[150px]'>
                          {log.error_message}
                        </span>
                      </div>
                    ) : (
                      <span className='text-xs text-muted-foreground'>
                        {log.provider_id || 'System'}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className='flex items-center justify-end space-x-2'>
        <div className='text-xs text-muted-foreground'>
          Page {metadata.page} of {metadata.totalPages}
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={() => fetchData(metadata.page - 1)}
          disabled={metadata.page <= 1 || loading}>
          <ChevronLeft className='h-4 w-4' />
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={() => fetchData(metadata.page + 1)}
          disabled={metadata.page >= metadata.totalPages || loading}>
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
