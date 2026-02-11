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
import { Button } from '@/components/ui/button';
import { NewShipmentDialog } from '@/components/shipments/new-shipment-dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { bulkDeleteShipments, getShipments } from './actions';
import { StatsCards } from '@/components/shipments/stats-cards';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShipmentTableFilters, Tenant } from '@/lib/types';
import { DataTableToolbar } from '@/components/shipments/data-table-toolbar';
import { getCarriers } from './carrier-actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ShipmentFilters } from '@/components/shipments/shipment-filters';

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
  const [carriers, setCarriers] = useState<{ code: string; name: string }[]>(
    [],
  );

  // State for filtering/pagination
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<ShipmentTableFilters>({
    status: 'all',
  });
  const [isPending, startTransition] = useTransition();
  const [currentShipments, setCurrentShipments] = useState(initialShipments);
  const [currentCount, setCurrentCount] = useState(initialCount);

  // Delete Dialog State
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
        total_revenue: state.total_revenue,
        success_rate: state.success_rate,
      };

      if (change.status) {
        const key = change.status.toLowerCase();
        if (key in newState) {
          newState[key] = (newState[key] || 0) + delta;
        }
        if (change.type === 'add') {
          newState.this_month = (newState.this_month || 0) + 1;
        }
      }
      return newState;
    },
  );

  const displayStats = optimisticStats;

  useEffect(() => {
    // Load Carriers for filter
    getCarriers().then((res) => {
      if (res.success && res.data) {
        setCarriers(
          res.data.map((c: any) => ({ code: c.code, name: c.name_en })),
        );
      }
    });
  }, []);

  useEffect(() => {
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

  // Sync props with state on router refresh
  useEffect(() => {
    setCurrentShipments(initialShipments);
    setCurrentCount(initialCount);
  }, [initialShipments, initialCount]);

  const handleBulkDelete = async (ids: string[]) => {
    setDeleteIds(ids);
    setDeleteDialogOpen(true);
  };

  const executeBulkDelete = async () => {
    if (deleteIds.length === 0) return;

    toast.promise(bulkDeleteShipments(deleteIds), {
      loading: 'Deleting shipments...',
      success: () => {
        setDeleteDialogOpen(false);
        setDeleteIds([]);
        router.refresh();
        return 'Shipments deleted';
      },
      error: 'Failed to delete shipments',
    });
  };

  const handleTabChange = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value }));
    setPageIndex(0);
  };

  return (
    <div className='flex-1 space-y-4 p-8 pt-6'>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{' '}
              {deleteIds.length} shipment{deleteIds.length !== 1 ? 's' : ''} and
              remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeBulkDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Shipments</h2>
          <p className='text-muted-foreground mt-1'>
            Monitor and manage all shipments across carriers. Track status
            updates and customer details in real-time.
          </p>
        </div>
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
        value={typeof filters.status === 'string' ? filters.status : 'all'}
        onValueChange={handleTabChange}
        className='w-full'>
        <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4'>
          <TabsList className='w-full md:w-auto justify-start h-auto p-1 overflow-x-auto'>
            <TabsTrigger value='all'>All</TabsTrigger>
            <TabsTrigger value='pending'>Pending</TabsTrigger>
            <TabsTrigger value='in_transit'>In Transit</TabsTrigger>
            <TabsTrigger value='out_for_delivery'>Out for Delivery</TabsTrigger>
            <TabsTrigger value='delivered'>Delivered</TabsTrigger>
            <TabsTrigger value='exception'>Exception</TabsTrigger>
            <TabsTrigger value='archived'>Archived</TabsTrigger>
          </TabsList>

          <DataTableToolbar
            filters={filters}
            onFiltersChange={(val) => {
              setFilters(val);
              setPageIndex(0);
            }}
            tenants={tenants}
            carriers={carriers}
            className='p-0 w-full md:w-auto'
          />
        </div>

        <DataTable
          columns={columns}
          data={optimisticShipments}
          pageCount={Math.ceil(currentCount / pageSize)}
          currentPage={pageIndex + 1}
          pageSize={pageSize}
          onPageChange={(p) => setPageIndex(p - 1)}
          onBulkDelete={handleBulkDelete}
          filters={filters}
          onFiltersChange={setFilters}
          tenants={tenants}
          isLoading={isPending}
          hideToolbar={true} // Use external toolbar
        />
      </Tabs>
    </div>
  );
}
