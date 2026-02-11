/** @format */

'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import Link from 'next/link';
import { Plus, Users, Settings, Package, FileText } from 'lucide-react';

interface QuickActionsProps {
  role?: string; // 'super_admin' | 'admin' | 'user'
}

export function QuickActions({ role = 'user' }: QuickActionsProps) {
  return (
    <Card className='h-fit shadow-sm'>
      <CardHeader className='pb-3'>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and shortcuts for faster navigation
        </CardDescription>
      </CardHeader>
      <CardContent className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href='/shipments/new' className='w-full'>
              <Button
                variant='default'
                className='w-full h-auto py-4 flex flex-col gap-2 shadow-md hover:shadow-lg transition-all'>
                <Plus className='h-5 w-5' />
                <span className='text-xs font-medium'>New Shipment</span>
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Create a new shipment entry</p>
          </TooltipContent>
        </Tooltip>

        {(role === 'admin' || role === 'super_admin') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href='/users' className='w-full'>
                <Button
                  variant='outline'
                  className='w-full h-auto py-4 flex flex-col gap-2 hover:bg-muted/50 transition-all border-dashed'>
                  <Users className='h-5 w-5 text-muted-foreground' />
                  <span className='text-xs font-medium'>Manage Users</span>
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>View and manage team members</p>
            </TooltipContent>
          </Tooltip>
        )}

        {role === 'super_admin' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href='/admin/tenants' className='w-full'>
                <Button
                  variant='outline'
                  className='w-full h-auto py-4 flex flex-col gap-2 hover:bg-muted/50 transition-all border-dashed'>
                  <Settings className='h-5 w-5 text-muted-foreground' />
                  <span className='text-xs font-medium'>Manage Tenants</span>
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Configure tenant organizations</p>
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Link href='/profile' className='w-full'>
              <Button
                variant='outline'
                className='w-full h-auto py-4 flex flex-col gap-2 hover:bg-muted/50 transition-all border-dashed'>
                <FileText className='h-5 w-5 text-muted-foreground' />
                <span className='text-xs font-medium'>My Profile</span>
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>View and edit your profile</p>
          </TooltipContent>
        </Tooltip>
      </CardContent>
    </Card>
  );
}
