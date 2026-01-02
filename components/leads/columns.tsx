"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ArrowUpDown, Trash2, Archive, Play, XCircle, RotateCcw, Eye, Smartphone } from "lucide-react";
import { Lead } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

import { Checkbox } from "@/components/ui/checkbox";

export const columns: ColumnDef<Lead>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        pending: "secondary",
        processing: "default",
        completed: "outline",
        failed: "destructive",
        archived: "outline",
        deleted: "destructive"
      };
      return <Badge variant={variants[status] || "default"}>{status.toUpperCase()}</Badge>;
    }
  },
  {
    accessorKey: "name", // Virtual accessor, we display customer name
    header: "Customer",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.customer?.name || "Unknown"}</span>
        <span className="text-xs text-muted-foreground">{row.original.customer?.email}</span>
      </div>
    )
  },
  {
    accessorKey: "assigned_to",
    header: "Assignee",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium">{row.original.assignee?.name || "Unassigned"}</span>
        {row.original.assignee?.email && (
            <span className="text-xs text-muted-foreground">{row.original.assignee.email}</span>
        )}
      </div>
    )
  },
  {
    accessorKey: "phone", // Virtual accessor for phone
    header: "Phone",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
          <Smartphone className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{row.original.customer?.phone || row.original.phone || "N/A"}</span>
      </div>
    )
  },
  {
    accessorKey: "route",
    header: "Route",
    cell: ({ row }) => (
      <div className="text-sm flex items-center gap-1">
        <span>{row.original.origin_country}</span>
        <span className="text-muted-foreground">→</span>
        <span>{row.original.destination_country}</span>
      </div>
    )
  },
  {
      accessorKey: "weight", // Virtual for sorting
      header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Weight
              <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
      ),
      cell: ({ row }) => <div className="pl-4">{row.original.weight} kg</div>
  },
  {
      accessorKey: "value", // Virtual for sorting
      header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Value
              <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
      ),
      cell: ({ row }) => <div className="pl-4 font-medium">{formatCurrency(row.original.value)}</div>
  },
  {
    accessorKey: "goods_type",
    header: "Goods",
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="text-muted-foreground text-sm">{formatDate(row.getValue("created_at"))}</div>,
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const lead = row.original;
      const meta = table.options.meta as {
        onUpdateStatus?: (id: string, status: string) => void;
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
                <Link href={`/admin/leads/${lead.id}`} className="cursor-pointer flex items-center w-full">
                    <Eye className="mr-2 h-4 w-4" /> View Details
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(lead.id)}>
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            
            {lead.status === 'pending' && (
                <DropdownMenuItem onClick={() => meta.onUpdateStatus?.(lead.id, 'processing')}>
                    <Play className="mr-2 h-4 w-4" /> Start Processing
                </DropdownMenuItem>
            )}
            
            {(lead.status === 'processing' || lead.status === 'pending') && (
                <>
                        <DropdownMenuItem onClick={() => meta.onUpdateStatus?.(lead.id, 'completed')}>
                        <Archive className="mr-2 h-4 w-4" /> Mark Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => meta.onUpdateStatus?.(lead.id, 'failed')} className="text-destructive">
                        <XCircle className="mr-2 h-4 w-4" /> Mark Failed
                    </DropdownMenuItem>
                </>
            )}
            
            {lead.status === 'deleted' && (
                <DropdownMenuItem onClick={() => meta.onUpdateStatus?.(lead.id, 'pending')}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Restore
                </DropdownMenuItem>
            )}
            
            {lead.status !== 'deleted' && (
                <DropdownMenuItem onClick={() => meta.onUpdateStatus?.(lead.id, 'deleted')} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
