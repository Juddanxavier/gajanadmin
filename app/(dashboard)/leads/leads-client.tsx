/** @format */

'use client';

import * as React from 'react';
import { useState, useOptimistic, startTransition, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/leads/data-table';
import { columns } from '@/components/leads/columns';
import { getLeads, updateLeadStatus } from '@/app/(dashboard)/leads/actions';
import {
  Lead,
  LeadTableFilters,
  LeadStatus,
  Tenant,
  PaginatedResponse,
} from '@/lib/types';
import { RowSelectionState, SortingState } from '@tanstack/react-table';
import { toast } from 'sonner';

interface LeadsClientProps {
  initialLeads: PaginatedResponse<Lead>;
  initialTenants: Tenant[];
}

export function LeadsClient({
  initialLeads,
  initialTenants,
}: LeadsClientProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads.data);
  const [pageCount, setPageCount] = useState(initialLeads.pageCount);
  // Tenants are static usually, validation/updates happen elsewhere
  const tenants = initialTenants;

  const [optimisticLeads, setOptimisticLeads] = useOptimistic(
    leads,
    (state, updatedLead: Lead) => {
      return state.map((l) => (l.id === updatedLead.id ? updatedLead : l));
    },
  );

  const [isLoading, setIsLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<LeadTableFilters>({ status: 'all' });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [isPending, startClientTransition] = React.useTransition();

  // Load leads when filters/page/sort changes
  // Skip first run as we have initial data (unless initial params differ, but here we assume defaults match)
  // Load leads when filters/page/sort changes
  // Parse initial state string to compare
  const initialStateString = JSON.stringify({
    pageIndex: 0,
    pageSize: 10,
    filters: { status: 'all' },
    sorting: [],
  });

  const [prevDeps, setPrevDeps] = useState(initialStateString);

  useEffect(() => {
    const currentDeps = JSON.stringify({
      pageIndex,
      pageSize,
      filters,
      sorting,
    });

    if (currentDeps === prevDeps) return;

    setPrevDeps(currentDeps);

    startClientTransition(() => {
      loadLeads();
    });
  }, [pageIndex, pageSize, filters, sorting]);

  const loadLeads = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
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
      // Refresh to ensure sync
      loadLeads();
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

        <DataTable
          columns={columns}
          data={optimisticLeads}
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
          filters={filters}
          onFiltersChange={setFilters}
        />
      </Tabs>
    </div>
  );
}
