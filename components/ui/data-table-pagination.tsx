/** @format */

import { Table } from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className='flex items-center justify-between px-2'>
      <div className='flex-1 text-sm text-muted-foreground'>
        {table.getFilteredSelectedRowModel().rows.length} of{' '}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className='flex items-center space-x-6 lg:space-x-8'>
        <div className='flex items-center space-x-2'>
          <p className='text-sm font-medium'>Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}>
            <SelectTrigger className='h-8 w-[70px]'>
              <SelectValue placeholder={table.getState().pagination.pageSize} />
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
          <Button
            variant='outline'
            className='h-8 w-8 p-0'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}>
            <span className='sr-only'>Go to previous page</span>
            <ChevronLeft className='h-4 w-4' />
          </Button>

          {/* Numbered Pagination */}
          <div className='flex items-center gap-1'>
            {(() => {
              const pageIndex = table.getState().pagination.pageIndex;
              const pageCount = table.getPageCount();
              const maxButtons = 5; // Configurable: max number of page buttons to show
              const buttons = [];

              let startPage = Math.max(
                0,
                pageIndex - Math.floor(maxButtons / 2),
              );
              let endPage = Math.min(pageCount - 1, startPage + maxButtons - 1);

              if (endPage - startPage + 1 < maxButtons) {
                startPage = Math.max(0, endPage - maxButtons + 1);
              }

              // First Page + Ellipsis
              if (startPage > 0) {
                buttons.push(
                  <Button
                    key={0}
                    variant='outline'
                    className='h-8 w-8 p-0'
                    onClick={() => table.setPageIndex(0)}>
                    1
                  </Button>,
                );
                if (startPage > 1) {
                  buttons.push(
                    <span
                      key='ellipsis-start'
                      className='px-2 text-muted-foreground'>
                      ...
                    </span>,
                  );
                }
              }

              // Numbered Pages
              for (let i = startPage; i <= endPage; i++) {
                buttons.push(
                  <Button
                    key={i}
                    variant={pageIndex === i ? 'default' : 'outline'}
                    className='h-8 w-8 p-0'
                    onClick={() => table.setPageIndex(i)}>
                    {i + 1}
                  </Button>,
                );
              }

              // Ellipsis + Last Page
              if (endPage < pageCount - 1) {
                if (endPage < pageCount - 2) {
                  buttons.push(
                    <span
                      key='ellipsis-end'
                      className='px-2 text-muted-foreground'>
                      ...
                    </span>,
                  );
                }
                buttons.push(
                  <Button
                    key={pageCount - 1}
                    variant='outline'
                    className='h-8 w-8 p-0'
                    onClick={() => table.setPageIndex(pageCount - 1)}>
                    {pageCount}
                  </Button>,
                );
              }

              return buttons;
            })()}
          </div>

          <Button
            variant='outline'
            className='h-8 w-8 p-0'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}>
            <span className='sr-only'>Go to next page</span>
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  );
}
