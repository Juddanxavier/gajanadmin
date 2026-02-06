/** @format */

import { Users, ShoppingBag, DollarSign, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RecentActivity } from '@/components/dashboard/recent-activity';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // Future: Fetch Leads Stats here
  const stats = {
    leads: 0,
    users: 0,
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
          <p className='text-muted-foreground'>Overview of your operations.</p>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* LEADS CARD */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Leads</CardTitle>
            <ShoppingBag className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.leads}</div>
            <p className='text-xs text-muted-foreground'>
              Active leads pipeline
            </p>
          </CardContent>
        </Card>

        {/* USERS CARD */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Users</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.users}</div>
            <p className='text-xs text-muted-foreground'>Registered users</p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className='col-span-1 md:col-span-2'>
          <CardHeader className='pb-2'>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-2 gap-2 h-full items-center'>
            <Link href='/leads' className='w-full'>
              <Button
                variant='outline'
                className='w-full justify-start h-auto py-2'>
                <ShoppingBag className='mr-2 h-4 w-4' /> Leads
              </Button>
            </Link>
            <Link href='/settings' className='w-full'>
              <Button
                variant='outline'
                className='w-full justify-start h-auto py-2'>
                <DollarSign className='mr-2 h-4 w-4' /> Config
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity (Leads focused) */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <RecentActivity initialData={[]} />
      </div>
    </div>
  );
}
