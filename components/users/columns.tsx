"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal, ArrowUpDown, Pencil, Trash2, Eye } from "lucide-react";
import { UserDisplay } from "@/lib/types";
import { formatDate, formatRelativeTime, getInitials } from "@/lib/utils";
import Link from "next/link";

export const columns: ColumnDef<UserDisplay>[] = [
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
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const name = row.getValue("name") as string | null;
      return <div className="font-medium">{name || "—"}</div>;
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const email = row.getValue("email") as string;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(email)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{email}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      const user = row.original;
      // @ts-ignore - phone might not be in type yet
      const phone = user.phone;
      return (
        <div className="text-sm text-muted-foreground">
          {phone || "—"}
        </div>
      );
    },
  },
  {
    accessorKey: "roles",
    header: "Roles",
    cell: ({ row }) => {
      const roles = row.getValue("roles") as UserDisplay["roles"];
      return (
        <div className="flex flex-wrap gap-1">
          {roles.map((role) => (
            <Badge
              key={role.id}
              variant={
                role.name === "admin"
                  ? "destructive"
                  : role.name === "staff"
                  ? "default"
                  : "secondary"
              }
            >
              {role.name}
            </Badge>
          ))}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const roles = row.getValue(id) as UserDisplay["roles"];
      return roles.some((role) => role.name === value);
    },
  },
  {
    accessorKey: "tenants",
    header: "Tenants",
    cell: ({ row }) => {
      const tenants = row.getValue("tenants") as UserDisplay["tenants"];
      return (
        <div className="flex flex-wrap gap-1">
          {tenants.map((tenant) => (
            <Badge key={tenant.id} variant="outline">
              {tenant.code}
            </Badge>
          ))}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const tenants = row.getValue(id) as UserDisplay["tenants"];
      return tenants.some((tenant) => tenant.code === value);
    },
  },
  {
    accessorKey: "last_sign_in_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Sign In
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("last_sign_in_at") as string | null;
      return (
        <div className="text-sm text-muted-foreground">
          {formatRelativeTime(date)}
        </div>
      );
    },
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
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string;
      return (
        <div className="text-sm text-muted-foreground">
          {formatDate(date)}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const user = row.original;
      const meta = table.options.meta as {
        onEdit?: (user: UserDisplay) => void;
        onDelete?: (user: UserDisplay) => void;
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
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(user.id)}
            >
              Copy user ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <Link href={`/admin/users/${user.id}`}>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem onClick={() => meta.onEdit?.(user)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit user
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => meta.onDelete?.(user)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete user
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
