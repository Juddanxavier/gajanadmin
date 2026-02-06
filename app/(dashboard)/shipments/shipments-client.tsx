/** @format */

'use client';

import {
  useOptimistic,
  useState,
  useTransition,
  useEffect,
  startTransition,
} from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/shipments/data-table';
import { columns, Shipment } from '@/components/shipments/columns';
import { NewShipmentButton } from '@/components/shipments/new-shipment-button';
import { Button } from '@/components/ui/button';
import { NewShipmentDialog } from '@/components/shipments/new-shipment-dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { bulkDeleteShipments, getShipments } from './actions';
import { StatsCards } from '@/components/shipments/stats-cards';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShipmentTableFilters, Tenant } from '@/lib/types';

interface ShipmentsClientProps {
  initialShipments: Shipment[];
  initialCount: number;
  initialStats: any;
  tenants?: Tenant[];
}

export function ShipmentsClient({
  initialShipments,
  initialCount,
  initialStats,
  tenants = [],
}: ShipmentsClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // State for filtering/pagination
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10); // Default probably 10 to match look? Or 50 as before? Leads used 10.
  const [filters, setFilters] = useState<ShipmentTableFilters>({
    status: 'all',
  });
  const [isPending, startTransition] = useTransition();
  const [currentShipments, setCurrentShipments] = useState(initialShipments);
  const [currentCount, setCurrentCount] = useState(initialCount);

  // Optimistic State
  const [optimisticShipments, addOptimisticShipment] = useOptimistic(
    currentShipments,
    (state, newShipment: Shipment) => {
      return [newShipment, ...state];
    },
  );

  const [optimisticStats, addOptimisticStats] = useOptimistic(
    initialStats,
    (
      state,
      change: { type: 'add' | 'delete'; status?: string; count?: number },
    ) => {
      const delta = change.type === 'add' ? 1 : -1;
      const newState = {
        ...state,
        total_shipments: state.total_shipments + delta,
      };

      if (change.status) {
        // Map status to stats keys if necessary, assuming simple mapping for now
        // stats keys: pending, in_transit, delivered, exception
        // created shipment is 'pending' usually.
        const key = change.status.toLowerCase();
        if (key in newState) {
          newState[key] = (newState[key] || 0) + delta;
        }

        // Also update 'this_month' if it's an add?
        // We can approximate.
        if (change.type === 'add') {
          newState.this_month = (newState.this_month || 0) + 1;
        }
      }
      return newState;
    },
  );

  const displayStats = optimisticStats;

  useEffect(() => {
    // Check if initial mount to avoid double fetch?
    // Actually standard effect pattern is fine if we accept one fetch on mount (if dependencies change).
    // But pageIndex 0 is default.
    // We only fetch if params change from initial.
    // For now, simple fetch is fine.

    startTransition(async () => {
      try {
        const result = await getShipments({
          page: pageIndex,
          limit: pageSize,
          ...filters,
        });

        if (result.success) {
          setCurrentShipments(result.data as Shipment[]);
          setCurrentCount(result.count || 0);
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to update table');
      }
    });
  }, [pageIndex, pageSize, filters]);

  const handleOptimisticAdd = (data: any) => {
    // ... (same as before)
    const tempShipment: Shipment = {
      id: 'temp-' + Math.random(),
      white_label_code: 'G-' + data.carrierTrackingCode,
      carrier_tracking_code: data.carrierTrackingCode,
      status: 'pending',
      carrier_id: data.carrierId,
      customer_details: {
        name: data.customerName || 'New User',
        email: data.customerEmail || '',
        phone: data.customerPhone,
      },
      tenants: { name: 'Current', slug: 'current' },
      carriers: { name_en: data.carrierId, logo_url: '' },
      created_at: new Date().toISOString(),
      amount: data.amount,
    };

    startTransition(() => {
      addOptimisticShipment(tempShipment);
      addOptimisticStats({ type: 'add', status: 'pending' });
    });
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} shipments?`)) return;

    toast.promise(bulkDeleteShipments(ids), {
      loading: 'Deleting shipments...',
      success: 'Shipments deleted',
      error: 'Failed to delete shipments',
    });
  };

  const handleTabChange = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value }));
    setPageIndex(0);
  };

  return (
    <div className='flex-1 space-y-4 p-8 pt-6'>
      <div className='flex items-center justify-between space-y-2'>
        <h2 className='text-3xl font-bold tracking-tight'>Shipments</h2>
        <div className='flex items-center space-x-2'>
          <Button onClick={() => setOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            New Shipment
          </Button>
          <NewShipmentDialog
            open={open}
            onOpenChange={setOpen}
            onOptimisticUpdate={handleOptimisticAdd}
          />
        </div>
      </div>

      <StatsCards stats={displayStats} />

      <Tabs
        defaultValue='all'
        onValueChange={handleTabChange}
        className='w-full'>
        <TabsList className='mb-4'>
          <TabsTrigger value='all'>All</TabsTrigger>
          <TabsTrigger value='pending'>Pending</TabsTrigger>
          <TabsTrigger value='in_transit'>In Transit</TabsTrigger>
          <TabsTrigger value='out_for_delivery'>Out for Delivery</TabsTrigger>
          <TabsTrigger value='delivered'>Delivered</TabsTrigger>
          <TabsTrigger value='exception'>Exception</TabsTrigger>
          <TabsTrigger value='archived'>Archived</TabsTrigger>
        </TabsList>

        <DataTable
          columns={columns}
          data={optimisticShipments}
          pageCount={Math.ceil(optimisticStats.total_shipments / pageSize)}
          currentPage={pageIndex + 1} // 1-based for UI
          pageSize={pageSize}
          onPageChange={(p) => setPageIndex(p - 1)} // 0-based for API
          onBulkDelete={handleBulkDelete}
          filters={filters}
          onFiltersChange={setFilters}
          tenants={tenants}
          isLoading={isPending}
        />
      </Tabs>
    </div>
  );
}
