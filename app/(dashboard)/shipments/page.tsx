/** @format */

import { Suspense } from 'react';
import { ShipmentStatsCards } from '@/components/shipments/shipment-stats';
import { ShipmentTableClient } from '@/components/shipments/shipment-table-client';
import {
  getShipments,
  getShipmentStats,
} from '@/app/(dashboard)/shipments/actions';
import { getTenants } from '@/app/(dashboard)/users/actions';
import { CreateShipmentDialogWrapper } from '@/components/shipments/create-shipment-wrapper';
import { ShipmentTabs } from '@/components/shipments/shipment-tabs';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    sort?: string;
    tenant?: string;
    search?: string;
    provider?: string;
    archived?: string;
  }>;
}

export default async function ShipmentsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  // Parse Params
  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.limit) || 10;
  const status =
    searchParams.status === 'all' ? undefined : searchParams.status;
  const provider =
    searchParams.provider === 'all' ? undefined : searchParams.provider;
  const search = searchParams.search;

  const archivedParam = searchParams.archived;
  let archived: boolean | 'all' = false;
  if (archivedParam === 'true') archived = true;
  if (archivedParam === 'all') archived = 'all';

  // sort format: "field.dir" (e.g. "created_at.desc")
  let sortBy = undefined;
  if (searchParams.sort) {
    const [field, dir] = searchParams.sort.split('.');
    sortBy = { id: field, desc: dir === 'desc' };
  }

  // Parallel Data Fetching
  const [tenantsResult] = await Promise.all([getTenants()]);
  const tenants = Array.isArray(tenantsResult) ? tenantsResult : [];

  // Default to India if no tenant selected
  let tenant = searchParams.tenant;
  if (!tenant) {
    const indiaTenant = tenants.find(
      (t) => t.code === 'IN' || t.name.toLowerCase().includes('india'),
    );
    if (indiaTenant) {
      tenant = indiaTenant.id;
    }
  }

  // Fetch Data with resolved tenant
  const [statsResult, dataResult] = await Promise.all([
    getShipmentStats(tenant),
    getShipments({
      page,
      pageSize,
      filters: { status, tenant, search, provider, archived },
      sortBy,
    }),
  ]);

  const stats = statsResult.data;
  const shipmentsData = dataResult.data;

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Shipment Management
          </h1>
          <p className='text-muted-foreground'>
            Track and manage shipments across all providers.
          </p>
        </div>
        <CreateShipmentDialogWrapper />
      </div>
      {/* Stats Section */}
      <Suspense fallback={<StatsSkeleton />}>
        {stats && <ShipmentStatsCards stats={stats} />}
      </Suspense>
      {/* Filter Tabs (Synced to URL) */}
      {/* Filter Tabs (Synced to URL) */}
      <ShipmentTabs
        currentStatus={status || 'all'}
        currentArchived={
          archived === true ? 'archived' : archived === 'all' ? 'all' : 'active'
        }
        tenantId={tenant}
      />
      {/* Table Section */}
      <Suspense fallback={<TableSkeleton />}>
        <ShipmentTableClient
          data={shipmentsData?.data || []}
          pageCount={shipmentsData?.pageCount || 1}
          currentSort={sortBy}
          currentFilters={{ status, tenant, search, provider, archived }}
          tenants={tenants}
        />
      </Suspense>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
      {[...Array(5)].map((_, i) => (
        <div key={i} className='rounded-lg border bg-card p-6 animate-pulse'>
          <div className='h-4 bg-muted rounded w-20 mb-2'></div>
          <div className='h-8 bg-muted rounded w-16'></div>
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='h-10 bg-muted rounded w-full animate-pulse'></div>
      <div className='h-64 bg-muted rounded w-full animate-pulse'></div>
    </div>
  );
}
