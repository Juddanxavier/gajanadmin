/** @format */

'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  RowSelectionState,
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
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTableToolbar } from './data-table-toolbar';
import { UserTableFilters, Role, Tenant } from '@/lib/types';
import { Loader2, Trash2, RefreshCw, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { EmptyState } from './empty-state';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount?: number;
  pageIndex?: number;
  pageSize?: number;
  onPaginationChange?: (pagination: {
    pageIndex: number;
    pageSize: number;
  }) => void;
  onSortingChange?: (sorting: SortingState) => void;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  rowSelection?: RowSelectionState;
  isLoading?: boolean;
  meta?: any;
  onAddNew?: () => void;
  // Toolbar Props
  filters: UserTableFilters;
  onFiltersChange: (filters: UserTableFilters) => void;
  onRefresh: () => void;
  onInvite?: () => void;
  onBulkDelete?: () => void;
  onBulkAssignRole?: () => void;
  roles: Role[];
  tenants: Tenant[];
  isRefreshing?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount = 0,
  pageIndex = 0,
  pageSize = 10,
  onPaginationChange,
  onSortingChange,
  onRowSelectionChange,
  rowSelection = {},
  isLoading = false,
  meta,
  onAddNew,
  filters,
  onFiltersChange,
  onRefresh,
  onInvite,
  onBulkDelete,
  onBulkAssignRole,
  roles,
  tenants,
  isRefreshing,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting,
      pagination: { pageIndex, pageSize },
      rowSelection,
    },
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
      onSortingChange?.(newSorting);
    },
    onPaginationChange: (updater) => {
      const currentPagination = { pageIndex, pageSize };
      const newPagination =
        typeof updater === 'function' ? updater(currentPagination) : updater;
      onPaginationChange?.(newPagination);
    },
    onRowSelectionChange: (updater) => {
      const newSelection =
        typeof updater === 'function' ? updater(rowSelection) : updater;
      onRowSelectionChange?.(newSelection);
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    meta,
  });

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className='space-y-4'>
      <DataTableToolbar
        filters={filters}
        onFiltersChange={onFiltersChange}
        roles={roles}
        tenants={tenants}>
        {/* Right Side Actions injected here */}
        {selectedCount > 0 && onBulkDelete && (
          <Button variant='destructive' size='sm' onClick={onBulkDelete}>
            <Trash2 className='mr-2 h-4 w-4' />
            Delete ({selectedCount})
          </Button>
        )}

        {selectedCount > 0 && onBulkAssignRole && (
          <Button variant='outline' size='sm' onClick={onBulkAssignRole}>
            Assign Role ({selectedCount})
          </Button>
        )}

        <Button
          variant='outline'
          size='sm'
          onClick={onRefresh}
          disabled={isRefreshing}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>

        {onInvite && (
          <Button variant='outline' size='sm' onClick={onInvite}>
            Invite
          </Button>
        )}

        <Button size='sm' onClick={onAddNew}>
          <Plus className='mr-2 h-4 w-4' />
          Add User
        </Button>
      </DataTableToolbar>
      <Card className='border-0 shadow-none sm:border sm:shadow-sm'>
        <CardContent className='p-0'>
          <div className='relative'>
            {isLoading && data.length > 0 && (
              <div className='absolute inset-0 z-10 bg-background/50 flex items-center justify-center backdrop-blur-[1px]'>
                <Loader2 className='h-8 w-8 animate-spin text-primary' />
              </div>
            )}
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
                  // Simple Loading Skeletons for initial load
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
                      className={cn(
                        isLoading &&
                          'opacity-50 pointer-events-none transition-opacity duration-200',
                      )}>
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
                      <EmptyState onAddUser={onAddNew} />
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
