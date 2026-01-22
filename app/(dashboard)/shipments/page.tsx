/** @format */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { ShipmentStatsCards } from '@/components/shipments/shipment-stats';
import { ShipmentDataTable } from '@/components/shipments/data-table';
import { columns, ShipmentDisplay } from '@/components/shipments/columns';
import { CreateShipmentDialog } from '@/components/shipments/create-shipment-dialog';
import {
  getShipments,
  getShipmentStats,
  bulkDeleteShipmentsAction,
} from '@/app/(dashboard)/shipments/actions';
import { getTenants } from '@/app/(dashboard)/users/actions';
import { toast } from 'sonner';
import { SortingState, PaginationState } from '@tanstack/react-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useShipmentRealtime } from '@/components/shipments/use-shipment-realtime';
import { Tenant, ShipmentTableFilters } from '@/lib/types';

interface ShipmentStats {
  total: number;
  pending: number;
  in_transit: number;
  delivered: number;
  exception: number;
}

function ShipmentsContent() {
  const [stats, setStats] = useState<ShipmentStats | null>(null);
  const [data, setData] = useState<ShipmentDisplay[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table State
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  // Filters State
  const [filters, setFilters] = useState<ShipmentTableFilters>({});
  const [tenants, setTenants] = useState<Tenant[]>([]);

  // Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadData = async () => {
    // Optimistic UI: Only show loading on initial load
    const isInitialLoad = data.length === 0;
    if (isInitialLoad) {
      setIsLoading(true);
    }

    try {
      // Parallel fetch stats, table data, and tenants
      const [statsResult, dataResult, tenantsResult] = await Promise.all([
        getShipmentStats(),
        getShipments(
          pagination.pageIndex + 1,
          pagination.pageSize,
          filters,
          sorting.length > 0
            ? { id: sorting[0].id, desc: sorting[0].desc }
            : undefined,
        ),
        getTenants(), // Fetch tenants for the filter
      ]);

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }

      if (dataResult.success && dataResult.data) {
        setData(dataResult.data.data as ShipmentDisplay[]);
        setPageCount(dataResult.data.pageCount);
      }

      // Handle tenants result (it returns array directly, not ActionResponse, based on viewed code)
      // Wait, let's verify getTenants return type.
      // viewed code: export async function getTenants() { return getAvailableTenants(); }
      // getAvailableTenants returns array or [].
      if (Array.isArray(tenantsResult)) {
        setTenants(tenantsResult as Tenant[]);
      }
    } catch (error: any) {
      console.error('Failed to load shipments:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      }
    }
  };

  // Realtime Updates
  useShipmentRealtime(loadData);

  useEffect(() => {
    loadData();
  }, [pagination.pageIndex, pagination.pageSize, sorting, filters]);

  const handleRefresh = () => {
    loadData();
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (!confirm(`Are you sure you want to delete ${ids.length} shipments?`))
      return;

    const result = await bulkDeleteShipmentsAction(ids);
    if (result.success) {
      toast.success('Shipments deleted successfully');
      loadData();
    } else {
      toast.error('Failed to delete shipments: ' + result.error);
    }
  };

  const onTabChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value === 'all' ? undefined : value,
    }));
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

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
      </div>

      {error && (
        <div className='bg-destructive/15 text-destructive p-4 rounded-md border border-destructive/20'>
          Error loading shipments: {error}
        </div>
      )}

      {/* Stats Cards - Show skeleton while loading */}
      {isLoading && !stats ? (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className='rounded-lg border bg-card p-6 animate-pulse'>
              <div className='h-4 bg-muted rounded w-20 mb-2'></div>
              <div className='h-8 bg-muted rounded w-16'></div>
            </div>
          ))}
        </div>
      ) : stats ? (
        <ShipmentStatsCards stats={stats} />
      ) : null}

      <Tabs
        defaultValue='all'
        className='space-y-4'
        onValueChange={onTabChange}>
        <TabsList>
          <TabsTrigger value='all'>All</TabsTrigger>
          <TabsTrigger value='pending'>Pending</TabsTrigger>
          <TabsTrigger value='in_transit'>In Transit</TabsTrigger>
          <TabsTrigger value='delivered'>Delivered</TabsTrigger>
          <TabsTrigger value='exception'>Exception</TabsTrigger>
        </TabsList>

        <TabsContent value='all' className='space-y-4'>
          {/* All Tab */}
          <ShipmentDataTable
            columns={columns}
            data={data}
            pageCount={pageCount}
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            onPaginationChange={setPagination}
            onSortingChange={setSorting}
            sorting={sorting}
            isLoading={isLoading}
            onAddNew={() => setIsCreateOpen(true)}
            onRefresh={handleRefresh}
            filters={filters}
            onFiltersChange={setFilters}
            onDeleteSelected={handleBulkDelete}
            tenants={tenants}
          />
        </TabsContent>

        {['pending', 'in_transit', 'delivered', 'exception'].map((status) => (
          <TabsContent key={status} value={status} className='space-y-4'>
            <ShipmentDataTable
              columns={columns}
              data={data}
              pageCount={pageCount}
              pageIndex={pagination.pageIndex}
              pageSize={pagination.pageSize}
              onPaginationChange={setPagination}
              onSortingChange={setSorting}
              sorting={sorting}
              isLoading={isLoading}
              onAddNew={() => setIsCreateOpen(true)}
              onRefresh={handleRefresh}
              filters={filters}
              onFiltersChange={setFilters}
              onDeleteSelected={handleBulkDelete}
              tenants={tenants}
            />
          </TabsContent>
        ))}
      </Tabs>

      <CreateShipmentDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
}

export default function ShipmentsPage() {
  return (
    <Suspense
      fallback={
        <div className='p-8 text-center text-muted-foreground'>
          Loading shipments...
        </div>
      }>
      <ShipmentsContent />
    </Suspense>
  );
}
