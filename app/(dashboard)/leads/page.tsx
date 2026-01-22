/** @format */

'use client';

import * as React from 'react';
import {
  useEffect,
  useState,
  useOptimistic,
  Suspense,
  startTransition,
} from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/leads/data-table';
import { columns } from '@/components/leads/columns';
import { DataTableToolbar } from '@/components/leads/data-table-toolbar';

import { getLeads, updateLeadStatus } from '@/app/(dashboard)/leads/actions';
import { getTenants } from '@/app/(dashboard)/users/actions'; // Reuse existing action
import { Lead, LeadTableFilters, LeadStatus, Tenant } from '@/lib/types';
import { RowSelectionState, SortingState } from '@tanstack/react-table';
import { toast } from 'sonner';

function LeadsPageContent() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [optimisticLeads, setOptimisticLeads] = useOptimistic(
    leads,
    (state, updatedLead: Lead) => {
      return state.map((l) => (l.id === updatedLead.id ? updatedLead : l));
    },
  );

  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageCount, setPageCount] = useState(0);
  const [filters, setFilters] = useState<LeadTableFilters>({ status: 'all' });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [isPending, startTransition] = React.useTransition();

  // Load tenants on mount
  useEffect(() => {
    getTenants()
      .then((res) => setTenants(res || []))
      .catch((err) => {
        console.error('Failed to load tenants:', err);
        // Don't crash, just show empty tenants
        setTenants([]);
      });
  }, []);

  // Load leads when filters/page/sort changes
  useEffect(() => {
    startTransition(() => {
      loadLeads();
    });
  }, [pageIndex, pageSize, filters, sorting]);

  const loadLeads = async () => {
    // Only show full loading if we have no data
    const isInitial = leads.length === 0;
    if (isInitial) setIsLoading(true);

    try {
      const sortBy = sorting[0]
        ? { id: sorting[0].id, desc: sorting[0].desc }
        : undefined;

      const result = await getLeads(pageIndex, pageSize, filters, sortBy);

      if (result.success) {
        setLeads(result.data.data);
        setPageCount(result.data.pageCount);
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
      toast.error('Failed to load leads');
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    // Optimistic update
    const lead = leads.find((l) => l.id === id);
    if (lead) {
      startTransition(() => {
        setOptimisticLeads({ ...lead, status: status as LeadStatus });
      });
    }

    const result = await updateLeadStatus(id, status as LeadStatus);
    if (result.success) {
      toast.success(`Lead marked as ${status}`);
      loadLeads(); // Refresh to ensure sync
    } else {
      toast.error(result.error || 'Failed to update status');
      // Revert if needed, but loadLeads will handle it
      loadLeads();
    }
  };

  const handleTabChange = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value }));
    setPageIndex(0); // Reset to first page
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Leads</h1>
          <p className='text-muted-foreground'>
            Manage customer leads and shipments
          </p>
        </div>
      </div>

      <Tabs
        defaultValue='all'
        onValueChange={handleTabChange}
        className='w-full'>
        <TabsList className='mb-4'>
          <TabsTrigger value='all'>All</TabsTrigger>
          <TabsTrigger value='pending'>Pending</TabsTrigger>
          <TabsTrigger value='processing'>Processing</TabsTrigger>
          <TabsTrigger value='completed'>Completed</TabsTrigger>
          <TabsTrigger value='failed'>Failed</TabsTrigger>
          <TabsTrigger value='archived'>Archived</TabsTrigger>
          <TabsTrigger value='deleted'>Deleted</TabsTrigger>
        </TabsList>

        <Card className='p-4'>
          <DataTableToolbar filters={filters} onFiltersChange={setFilters} />
          <DataTable
            columns={columns}
            data={optimisticLeads} // Use optimistic data
            pageCount={pageCount}
            pageIndex={pageIndex}
            pageSize={pageSize}
            onPaginationChange={({ pageIndex, pageSize }) => {
              setPageIndex(pageIndex);
              setPageSize(pageSize);
            }}
            onSortingChange={setSorting}
            onRowSelectionChange={setRowSelection}
            rowSelection={rowSelection}
            isLoading={isLoading || isPending}
            tenants={tenants}
            meta={{
              onUpdateStatus: handleUpdateStatus,
            }}
            // onAddNew logic not defined for admin leads view as per requirements ("only customer can create")
          />
        </Card>
      </Tabs>
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div>Loading leads...</div>}>
      <LeadsPageContent />
    </Suspense>
  );
}
