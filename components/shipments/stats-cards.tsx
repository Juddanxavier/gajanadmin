/** @format */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, CheckCircle, AlertTriangle } from 'lucide-react';

interface StatsProps {
  stats: {
    total_shipments: number;
    pending: number;
    in_transit: number;
    delivered: number;
    exception: number;
    this_month: number;
  };
}

export function StatsCards({ stats }: StatsProps) {
  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Shipments</CardTitle>
          <Package className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats.total_shipments}</div>
          <p className='text-xs text-muted-foreground'>
            {stats.this_month} new this month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>In Transit</CardTitle>
          <Truck className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats.in_transit}</div>
          <p className='text-xs text-muted-foreground'>
            {stats.pending > 0
              ? `+ ${stats.pending} pending`
              : 'Active shipments'}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Delivered</CardTitle>
          <CheckCircle className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats.delivered}</div>
          <p className='text-xs text-muted-foreground'>
            Successfully delivered
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Exceptions</CardTitle>
          <AlertTriangle className='h-4 w-4 text-destructive' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-destructive'>
            {stats.exception}
          </div>
          <p className='text-xs text-muted-foreground'>Requires attention</p>
        </CardContent>
      </Card>
    </div>
  );
}
