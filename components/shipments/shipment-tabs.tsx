/** @format */

'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';

interface ShipmentTabsProps {
  currentStatus: string;
  currentArchived: string; // 'active' | 'archived' | 'all'
  tenantId?: string;
}

export function ShipmentTabs({
  currentStatus,
  currentArchived,
  tenantId,
}: ShipmentTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams?.toString());
      if (value === 'all') {
        params.delete('status');
      } else {
        params.set('status', value);
      }
      params.set('page', '1');
      startTransition(() => {
        router.push(`/shipments?${params.toString()}`);
      });
    },
    [searchParams, router],
  );

  const handleArchivedChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams?.toString());
      if (value === 'active') {
        params.delete('archived');
      } else {
        params.set('archived', value === 'all' ? 'all' : 'true');
      }
      // If switching archives, maybe we should reset status to all?
      // Or keep it? keeping it is more flexible.
      params.set('page', '1');
      startTransition(() => {
        router.push(`/shipments?${params.toString()}`);
      });
    },
    [searchParams, router],
  );

  return (
    <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
      <Tabs
        value={currentStatus}
        onValueChange={handleStatusChange}
        className='w-full sm:w-auto'>
        <TabsList>
          <TabsTrigger value='all'>All</TabsTrigger>
          <TabsTrigger value='pending'>Pending</TabsTrigger>
          <TabsTrigger value='in_transit'>In Transit</TabsTrigger>
          <TabsTrigger value='delivered'>Delivered</TabsTrigger>
          <TabsTrigger value='exception'>Exception</TabsTrigger>
        </TabsList>
      </Tabs>

      <Tabs
        value={currentArchived}
        onValueChange={handleArchivedChange}
        className='w-full sm:w-auto'>
        <TabsList>
          <TabsTrigger value='active'>Active</TabsTrigger>
          <TabsTrigger value='archived'>Archived</TabsTrigger>
          <TabsTrigger value='all'>All</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
