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
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TableLoadingBar } from '@/components/ui/table-loading-bar';
import { RefreshCw, Download, Trash } from 'lucide-react';
import { exportShipmentsAction } from '@/app/(dashboard)/shipments/actions';
import { downloadCSV } from '@/lib/utils';
import { toast } from 'sonner';

import { DataTableToolbar } from './data-table-toolbar';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
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
      <DataTableToolbar
        filters={filters}
        onFiltersChange={onFiltersChange}
        tenants={tenants}>
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
      </DataTableToolbar>
      <Card className='border-0 shadow-none sm:border sm:shadow-sm'>
        <CardContent className='p-0'>
          <div className='relative'>
            <TableLoadingBar isLoading={!!isLoading} />
            <Table containerClassName='max-h-[calc(100vh-300px)]'>
              <TableHeader className='bg-muted sticky top-0 z-20'>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const isSticky =
                        header.column.id === 'carrier_tracking_code';
                      return (
                        <TableHead
                          key={header.id}
                          className={cn(
                            isSticky &&
                              'sticky left-0 z-30 bg-muted shadow-[4px_0_4px_-2px_rgba(0,0,0,0.1)]',
                          )}>
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
                      {columns.map((_, colIndex) => {
                        return (
                          <TableCell key={colIndex}>
                            <div className='h-4 bg-muted rounded animate-pulse w-full max-w-[200px]' />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className={cn(
                        'transition-colors',
                        isLoading ? 'opacity-50 transition-opacity' : '',
                      )}>
                      {row.getVisibleCells().map((cell) => {
                        const isSticky =
                          cell.column.id === 'carrier_tracking_code';
                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              isSticky &&
                                'sticky left-0 z-10 bg-background shadow-[4px_0_4px_-2px_rgba(0,0,0,0.1)]',
                            )}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className='h-24 text-center'>
                      <div className='flex flex-col items-center justify-center p-8 text-muted-foreground'>
                        <p className='mb-2 text-lg font-medium'>
                          No shipments found
                        </p>
                        <p className='text-sm'>
                          Try adjusting your filters or search query.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className='p-4 border-t'>
          <div className='w-full'>
            <DataTablePagination table={table} />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
