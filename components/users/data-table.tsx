"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  RowSelectionState,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { EmptyState } from "./empty-state";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { TableLoadingBar } from "@/components/ui/table-loading-bar";
import { motion, AnimatePresence } from "framer-motion";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount?: number;
  pageIndex?: number;
  pageSize?: number;
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  onSortingChange?: (sorting: SortingState) => void;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  rowSelection?: RowSelectionState;
  isLoading?: boolean;
  meta?: any;
  onAddNew?: () => void;
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
      const newSorting = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(newSorting);
      onSortingChange?.(newSorting);
    },
    onPaginationChange: (updater) => {
      const currentPagination = { pageIndex, pageSize };
      const newPagination =
        typeof updater === "function" ? updater(currentPagination) : updater;
      onPaginationChange?.(newPagination);
    },
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === "function" ? updater(rowSelection) : updater;
      onRowSelectionChange?.(newSelection);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    meta,
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-hidden relative">
        <TableLoadingBar isLoading={isLoading && data.length > 0} />
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
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="relative">
            {isLoading && data.length === 0 ? (
              // Skeleton rows for initial load
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <div className="h-4 bg-muted rounded animate-pulse w-full max-w-[200px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <AnimatePresence mode="popLayout" initial={false}>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row, index) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ 
                        duration: 0.2, 
                        delay: Math.min(index * 0.03, 0.3),
                        ease: "easeOut"
                      }}
                      data-state={row.getIsSelected() && "selected"}
                      className={cn(
                        "group border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                        isLoading ? "opacity-50 pointer-events-none" : ""
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </motion.tr>
                  ))
                ) : (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <TableCell
                      colSpan={columns.length}
                      className="p-0"
                    >
                      <EmptyState onAddUser={onAddNew} />
                    </TableCell>
                  </motion.tr>
                )
                }
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
