/** @format */

'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle2, Mail, MessageSquare } from 'lucide-react';

interface NotificationLog {
  id: string;
  type: 'email' | 'sms' | 'whatsapp';
  recipient: string;
  subject: string;
  status: 'sent' | 'failed' | 'queued';
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

interface NotificationHistoryTableProps {
  initialData: {
    success: boolean;
    data?: NotificationLog[];
    error?: string;
    metadata?: {
      totalCount: number;
    };
  };
}

export function NotificationHistoryTable({
  initialData,
}: NotificationHistoryTableProps) {
  const logs = initialData?.success ? initialData.data || [] : [];

  if (!initialData?.success) {
    return (
      <div className='p-4 text-center text-red-500'>
        Error loading logs: {initialData?.error || 'Unknown error'}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className='p-8 text-center text-muted-foreground'>
        No notification logs found.
      </div>
    );
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[100px]'>Type</TableHead>
            <TableHead>Subject / Message</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='text-right'>Sent At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                <div className='flex items-center gap-2'>
                  {log.type === 'email' ? (
                    <Badge variant='outline' className='gap-1'>
                      <Mail className='h-3 w-3' /> Email
                    </Badge>
                  ) : log.type === 'whatsapp' ? (
                    <Badge
                      variant='outline'
                      className='gap-1 border-green-200 bg-green-50 text-green-700'>
                      <MessageSquare className='h-3 w-3' /> WhatsApp
                    </Badge>
                  ) : (
                    <Badge variant='outline' className='gap-1'>
                      <MessageSquare className='h-3 w-3' /> SMS
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className='max-w-[400px] truncate' title={log.subject}>
                <span className='font-medium'>{log.subject}</span>
                {log.error_message && (
                  <p className='text-xs text-red-500 mt-1 truncate'>
                    {log.error_message}
                  </p>
                )}
              </TableCell>
              <TableCell>{log.recipient}</TableCell>
              <TableCell>
                {log.status === 'sent' ? (
                  <Badge
                    variant='default'
                    className='bg-green-500 hover:bg-green-600 gap-1'>
                    <CheckCircle2 className='h-3 w-3' /> Sent
                  </Badge>
                ) : log.status === 'failed' ? (
                  <Badge variant='destructive' className='gap-1'>
                    <AlertCircle className='h-3 w-3' /> Failed
                  </Badge>
                ) : (
                  <Badge variant='secondary'>Queued</Badge>
                )}
              </TableCell>
              <TableCell className='text-right whitespace-nowrap'>
                {format(new Date(log.created_at), 'MMM d, h:mm a')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
