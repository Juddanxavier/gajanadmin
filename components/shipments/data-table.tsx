/** @format */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  PaginationState,
  SortingState,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableLoadingBar } from '@/components/ui/table-loading-bar';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  RefreshCw,
  Download,
  Trash,
} from 'lucide-react';
import { exportToCSV } from '@/lib/utils/export';
import { exportShipmentsAction } from '@/app/(dashboard)/shipments/actions';
import { downloadCSV } from '@/lib/utils';
import { toast } from 'sonner';

import { DataTableToolbar } from './data-table-toolbar';
import { ShipmentTableFilters, Tenant } from '@/lib/types';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  pageIndex: number;
  pageSize: number;
  onPaginationChange: (pagination: PaginationState) => void;
  onSortingChange: (sorting: SortingState) => void;
  sorting?: SortingState;
  isLoading?: boolean;
  onAddNew: () => void;
  onRefresh: () => void;
  filters: ShipmentTableFilters;
  onFiltersChange: (filters: ShipmentTableFilters) => void;
  onDeleteSelected?: (selectedIds: string[]) => void;
  tenants?: Tenant[];
}

export function ShipmentDataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  pageIndex,
  pageSize,
  onPaginationChange,
  onSortingChange,
  sorting,
  isLoading,
  onAddNew,
  onRefresh,
  filters,
  onFiltersChange,
  onDeleteSelected,
  tenants = [],
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      pagination: { pageIndex, pageSize },
      sorting,
    },
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({ pageIndex, pageSize });
        onPaginationChange(newState);
      } else {
        onPaginationChange(updater);
      }
    },
    onSortingChange: (updater) => {
      // @ts-ignore
      onSortingChange(updater);
    },
    manualPagination: true,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const router = useRouter();

  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const result = await exportShipmentsAction(filters);

      if (result.success && result.data) {
        downloadCSV(
          result.data,
          `shipments-${new Date().toISOString().split('T')[0]}.csv`,
        );
        toast.success('Export successful');
      } else {
        toast.error('Export failed: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      toast.error('Failed to export shipments');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between pl-2'>
        <div className='flex flex-1 items-center space-x-2'>
          <DataTableToolbar
            filters={filters}
            onFiltersChange={onFiltersChange}
            tenants={tenants}
          />
        </div>
        <div className='flex items-center space-x-2'>
          {onDeleteSelected &&
            table.getFilteredSelectedRowModel().rows.length > 0 && (
              <Button
                variant='destructive'
                size='sm'
                onClick={() => {
                  const selectedIds = table
                    .getFilteredSelectedRowModel()
                    .rows.map((row) => (row.original as any).id);
                  onDeleteSelected(selectedIds);
                  table.resetRowSelection();
                }}>
                <Trash className='mr-2 h-4 w-4' />
                Delete ({table.getFilteredSelectedRowModel().rows.length})
              </Button>
            )}

          <Button
            variant='outline'
            size='sm'
            onClick={handleExport}
            disabled={isExporting}>
            <Download
              className={`mr-2 h-4 w-4 ${isExporting ? 'animate-pulse' : ''}`}
            />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={onRefresh}
            disabled={isLoading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button size='sm' onClick={onAddNew}>
            <Plus className='mr-2 h-4 w-4' />
            Add Shipment
          </Button>
        </div>
      </div>
      <div className='rounded-md border overflow-hidden relative'>
        <TableLoadingBar isLoading={!!isLoading && data.length > 0} />
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && data.length === 0 ? (
              // Show skeleton rows on initial load
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <div className='h-4 bg-muted rounded animate-pulse w-full max-w-[200px]' />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(
                    'cursor-pointer transition-colors',
                    isLoading ? 'opacity-50 transition-opacity' : '',
                  )}
                  onClick={() =>
                    router.push(`/shipments/${(row.original as any).id}`)
                  }>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'>
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='flex items-center justify-between px-2'>
        <div className='flex-1 text-sm text-muted-foreground'>
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className='flex items-center space-x-6 lg:space-x-8'>
          <div className='flex items-center space-x-2'>
            <p className='text-sm font-medium'>Rows per page</p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}>
              <SelectTrigger className='h-8 w-[70px]'>
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side='top'>
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex items-center space-x-2'>
            <div className='flex w-[100px] items-center justify-center text-sm font-medium'>
              Page {pageIndex + 1} of {pageCount}
            </div>
            <Button
              variant='outline'
              className='h-8 w-8 p-0'
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}>
              <span className='sr-only'>Go to first page</span>
              <ChevronsLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='h-8 w-8 p-0'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}>
              <span className='sr-only'>Go to previous page</span>
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='h-8 w-8 p-0'
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}>
              <span className='sr-only'>Go to next page</span>
              <ChevronRight className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='h-8 w-8 p-0'
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}>
              <span className='sr-only'>Go to last page</span>
              <ChevronsRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
