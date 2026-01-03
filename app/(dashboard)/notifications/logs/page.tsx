
// Notification Logs Page
// c:\websites\kajen\gajan\admin\app\admin\notifications\logs\page.tsx

import { createClient } from '@/lib/supabase/server';
import { getNotificationLogs, getNotificationStats } from './actions';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

export default async function NotificationLogsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Unauthorized</div>;

    const { data: userTenants } = await supabase
       .from('user_tenants')
       .select('tenant_id')
       .eq('user_id', user.id)
       .single();
    
    if (!userTenants) return <div>No tenant found.</div>;

    const logs = await getNotificationLogs(userTenants.tenant_id);
    const stats = await getNotificationStats(userTenants.tenant_id);

    return (
        <div className="container mx-auto py-10 space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Notification Logs</h1>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">All time volume</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-green-500"
                        >
                            <path d="M22 2L11 13" />
                            <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
                        <p className="text-xs text-muted-foreground">Successfully sent</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Failed</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-red-500"
                        >
                             <circle cx="12" cy="12" r="10" />
                             <line x1="12" y1="8" x2="12" y2="12" />
                             <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                        <p className="text-xs text-muted-foreground">Errors (Quota, Auth, etc)</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Recipient</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Provider</TableHead>
                                <TableHead>Sent At</TableHead>
                                <TableHead>Error</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                                            {log.status === 'sent' ? 'Success' : 'Failed'}
                                        </Badge>
                                        {/* For detailed error view, we could add a Dialog here */}
                                    </TableCell>
                                    <TableCell>{log.recipient}</TableCell>
                                    <TableCell className="capitalize">{log.type}</TableCell>
                                    <TableCell>{log.providerName}</TableCell>
                                    <TableCell>
                                        {log.sent_at 
                                            ? formatDistanceToNow(new Date(log.sent_at), { addSuffix: true }) 
                                            : '-'}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground" title={log.error_message}>
                                        {log.error_message || '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {logs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        No logs found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
