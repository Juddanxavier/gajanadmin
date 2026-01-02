'use client';

import * as React from 'react';
import { getSystemHealthAction, SystemHealth } from './actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, Clock, RefreshCw, Server, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils'; // Assuming this exists or I'll use simple formatter

export default function SystemStatusPage() {
    const [health, setHealth] = React.useState<SystemHealth | null>(null);
    const [loading, setLoading] = React.useState(true);

    const fetchHealth = async () => {
        setLoading(true);
        try {
            const resp = await getSystemHealthAction();
            if (resp.success && resp.data) {
                setHealth(resp.data);
            } else {
                toast.error('Failed to load system health');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error loading system health');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchHealth();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ok': return 'bg-green-500/10 text-green-700 border-green-200';
            case 'configured': return 'bg-green-500/10 text-green-700 border-green-200';
            case 'warning': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
            case 'error': return 'bg-red-500/10 text-red-700 border-red-200';
            case 'missing': return 'bg-gray-500/10 text-gray-700 border-gray-200';
            default: return 'bg-muted';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">System Status</h2>
                    <p className="text-muted-foreground">Monitor the health of your application services.</p>
                </div>
                <Button variant="outline" onClick={fetchHealth} disabled={loading}>
                    <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Database */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Database</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                             <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                        ) : health ? (
                            <div className="space-y-2">
                                <Badge variant="outline" className={getStatusColor(health.database.status)}>
                                    {health.database.status.toUpperCase()}
                                </Badge>
                                <div className="text-xs text-muted-foreground">
                                    Latency: {health.database.latency}ms
                                </div>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                {/* Cron Jobs */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sync Engine (Cron)</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                             <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                        ) : health ? (
                            <div className="space-y-2">
                                <Badge variant="outline" className={getStatusColor(health.cron.status)}>
                                    {health.cron.status.toUpperCase()}
                                </Badge>
                                <div className="text-xs text-muted-foreground">
                                    {health.cron.lastSync ? `Last Sync: ${new Date(health.cron.lastSync).toLocaleString()}` : health.cron.message}
                                </div>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                {/* Track123 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Track123 API</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                             <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                        ) : health ? (
                            <div className="space-y-2">
                                <Badge variant="outline" className={getStatusColor(health.track123.status)}>
                                    {health.track123.status.toUpperCase()}
                                </Badge>
                                <div className="text-xs text-muted-foreground">
                                    {health.track123.message}
                                </div>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                {/* Email Service */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Email Service</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                             <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                        ) : health ? (
                            <div className="space-y-2">
                                <Badge variant="outline" className={getStatusColor(health.email.status)}>
                                    {health.email.status.toUpperCase()}
                                </Badge>
                                <div className="text-xs text-muted-foreground">
                                    Provider: {health.email.provider || 'N/A'}
                                </div>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
