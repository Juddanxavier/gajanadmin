/** @format */

'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { ShipmentDataTable } from './data-table';
import { columns, ShipmentDisplay } from './columns';
import { ShipmentTableFilters, Tenant } from '@/lib/types';
import { SortingState, PaginationState } from '@tanstack/react-table';

interface ShipmentTableClientProps {
  data: ShipmentDisplay[];
  pageCount: number;
  currentSort?: { id: string; desc: boolean };
  currentFilters: ShipmentTableFilters;
  tenants: Tenant[];
}

export function ShipmentTableClient({
  data,
  pageCount,
  currentSort,
  currentFilters,
  tenants,
}: ShipmentTableClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Helper to update URL params
  const createQueryString = useCallback(
    (params: Record<string, string | number | null | undefined>) => {
      const newSearchParams = new URLSearchParams(searchParams?.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      });

      return newSearchParams.toString();
    },
    [searchParams],
  );

  const onPaginationChange = (
    updater: PaginationState | ((prev: PaginationState) => PaginationState),
  ) => {
    // In URL mode, we only usually care about "page" and "pageSize"
    // But DataTable passes us PaginationState
    let nextState: PaginationState;

    const currentState = {
      pageIndex: Number(searchParams?.get('page') || 1) - 1,
      pageSize: Number(searchParams?.get('limit') || 10),
    };

    if (typeof updater === 'function') {
      nextState = updater(currentState);
    } else {
      nextState = updater;
    }

    router.push(
      `${pathname}?${createQueryString({
        page: nextState.pageIndex + 1,
        limit: nextState.pageSize,
      })}`,
    );
  };

  const onSortingChange = (
    updater: SortingState | ((prev: SortingState) => SortingState),
  ) => {
    // We only support single column sort for now via URL
    let nextState: SortingState;
    const currentState = currentSort
      ? [{ id: currentSort.id, desc: currentSort.desc }]
      : [];

    if (typeof updater === 'function') {
      nextState = updater(currentState);
    } else {
      nextState = updater;
    }

    if (nextState.length > 0) {
      const { id, desc } = nextState[0];
      router.push(
        `${pathname}?${createQueryString({
          sort: `${id}.${desc ? 'desc' : 'asc'}`,
        })}`,
      );
    } else {
      // Clear sort
      router.push(`${pathname}?${createQueryString({ sort: null })}`);
    }
  };

  const onFiltersChange = (newFilters: ShipmentTableFilters) => {
    // Reset page to 1 when filters change
    router.push(
      `${pathname}?${createQueryString({
        page: 1,
        status: newFilters.status,
        tenant: newFilters.tenant,
        search: newFilters.search,
        provider: newFilters.provider,
      })}`,
    );
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <ShipmentDataTable
      columns={columns}
      data={data}
      pageCount={pageCount}
      // Map URL params to Table State
      pageIndex={Number(searchParams?.get('page') || 1) - 1}
      pageSize={Number(searchParams?.get('limit') || 10)}
      onPaginationChange={onPaginationChange}
      sorting={
        currentSort ? [{ id: currentSort.id, desc: currentSort.desc }] : []
      }
      onSortingChange={onSortingChange}
      filters={currentFilters}
      onFiltersChange={onFiltersChange}
      isLoading={false} // Loading handled by Suspense in parent
      onRefresh={handleRefresh}
      onAddNew={() => {}} // TODO: Pass dialog opener or handle separate route
      tenants={tenants}
    />
  );
}
