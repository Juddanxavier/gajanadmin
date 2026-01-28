/** @format */

'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface ShipmentTabsProps {
  currentStatus: string;
  tenantId?: string;
}

export function ShipmentTabs({ currentStatus, tenantId }: ShipmentTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = useCallback(
    (value: string) => {
      // Construct new URL parameters
      const params = new URLSearchParams(searchParams?.toString());

      // Update Status
      if (value === 'all') {
        params.delete('status');
      } else {
        params.set('status', value);
      }

      // Ensure page resets to 1 on filter change
      params.set('page', '1');

      // Push new route
      router.push(`/shipments?${params.toString()}`);
    },
    [searchParams, router],
  );

  return (
    <Tabs
      value={currentStatus}
      onValueChange={handleTabChange}
      className='space-y-4'>
      <TabsList>
        <TabsTrigger value='all'>All</TabsTrigger>
        <TabsTrigger value='pending'>Pending</TabsTrigger>
        <TabsTrigger value='in_transit'>In Transit</TabsTrigger>
        <TabsTrigger value='delivered'>Delivered</TabsTrigger>
        <TabsTrigger value='exception'>Exception</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
