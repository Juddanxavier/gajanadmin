/** @format */

'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
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
import { Trash2, Loader2, PackageX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

import { DataTableToolbar } from './data-table-toolbar';
import { PaginationNumbered } from '@/components/ui/pagination-numbered';
import { ShipmentTableFilters, Tenant } from '@/lib/types';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  currentPage?: number;
  pageSize?: number;
  onBulkDelete?: (selectedIds: string[]) => void;

  // Toolbar Props
  filters?: ShipmentTableFilters;
  onFiltersChange?: (filters: ShipmentTableFilters) => void;
  tenants?: Tenant[];
  isLoading?: boolean;
  hideToolbar?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount = 1,
  onPageChange,
  onPageSizeChange,
  currentPage = 1,
  pageSize = 50,
  onBulkDelete,
  filters = {},
  onFiltersChange,
  tenants = [],
  isLoading = false,
  hideToolbar = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    pageCount,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const selectedIds = table
    .getFilteredSelectedRowModel()
    .rows.map((row: any) => row.original.id);

  return (
    <div className='space-y-4'>
      {onFiltersChange && !hideToolbar && (
        <DataTableToolbar
          filters={filters}
          onFiltersChange={onFiltersChange}
          tenants={tenants}>
          {selectedIds.length > 0 && onBulkDelete && (
            <Button
              variant='destructive'
              size='sm'
              onClick={() => {
                onBulkDelete(selectedIds);
                setRowSelection({});
              }}>
              <Trash2 className='mr-2 h-4 w-4' />
              Delete ({selectedIds.length})
            </Button>
          )}
        </DataTableToolbar>
      )}

      {/* If no filters provided, maybe fallback to minimal toolbar or just the delete button? 
         Currently the existing implementation relies on the Toolbar to host the delete button as children. 
         If onFiltersChange is null, we might lose the delete button. 
         Let's handle that: */}
      {!onFiltersChange && selectedIds.length > 0 && onBulkDelete && (
        <div className='flex justify-end mb-2'>
          <Button
            variant='destructive'
            size='sm'
            onClick={() => {
              onBulkDelete(selectedIds);
              setRowSelection({});
            }}>
            <Trash2 className='mr-2 h-4 w-4' />
            Delete ({selectedIds.length})
          </Button>
        </div>
      )}

      <Card className='border-0 shadow-none sm:border sm:shadow-sm'>
        <CardContent className='p-0'>
          <div className='relative'>
            {/* Loader Removed for Optimistic UI Feel */}

            <Table containerClassName='max-h-[calc(100vh-300px)]'>
              <TableHeader className='bg-muted sticky top-0 z-20'>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className='hover:bg-transparent border-b border-border'>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead
                          key={header.id}
                          className='font-bold text-foreground'>
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
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {columns.map((_, colIndex) => (
                        <TableCell key={colIndex}>
                          <div className='h-4 bg-muted rounded w-24 animate-pulse' />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className='cursor-pointer hover:bg-muted/30 transition-colors'>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className='py-3'>
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
                    <TableCell colSpan={columns.length} className='h-64'>
                      <EmptyState
                        icon={PackageX}
                        title='No shipments found'
                        description='No shipments match your current filters. Try adjusting your search criteria or create a new shipment.'
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        <CardFooter className='p-4 border-t'>
          <div className='w-full'>
            {onPageChange ? (
              <PaginationNumbered
                currentPage={currentPage}
                totalPages={pageCount}
                onPageChange={onPageChange}
                className='justify-end'
              />
            ) : (
              <div className='flex justify-center text-sm text-muted-foreground'>
                Showing {table.getRowModel().rows.length} rows
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
