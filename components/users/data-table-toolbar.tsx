"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Search, Trash2, UserPlus } from "lucide-react";
import { UserTableFilters } from "@/lib/types";
import type { Role, Tenant } from "@/lib/types";

interface DataTableToolbarProps {
  filters: UserTableFilters;
  onFiltersChange: (filters: UserTableFilters) => void;
  selectedCount: number;
  onBulkDelete?: () => void;
  onBulkAssignRole?: () => void;
  roles: Role[];
  tenants: Tenant[];
}

export function DataTableToolbar({
  filters,
  onFiltersChange,
  selectedCount,
  onBulkDelete,
  onBulkAssignRole,
  roles,
  tenants,
}: DataTableToolbarProps) {
  const [searchValue, setSearchValue] = React.useState(filters.search ?? "");

  React.useEffect(() => {
    const timer = setTimeout(() => {
        if (searchValue !== (filters.search ?? "")) {
            onFiltersChange({ ...filters, search: searchValue || undefined });
        }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  // Sync back if filters are cleared externally
  React.useEffect(() => {
    setSearchValue(filters.search ?? "");
  }, [filters.search]);

  const hasFilters =
    searchValue || filters.role || filters.tenant || filters.dateFrom || filters.dateTo;

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="pb-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Role Filter */}
          <Select
            value={filters.role || "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                role: value === "all" ? undefined : value,
              })
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.name}>
                  {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tenant Filter */}
          <Select
            value={filters.tenant || "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                tenant: value === "all" ? undefined : value,
              })
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tenant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tenants</SelectItem>
              {tenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="h-9 px-2 lg:px-3"
            >
              Clear
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, search: undefined })
                }
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.role && (
            <Badge variant="secondary" className="gap-1">
              Role: {filters.role}
              <button
                onClick={() => onFiltersChange({ ...filters, role: undefined })}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.tenant && (
            <Badge variant="secondary" className="gap-1">
              Tenant: {tenants.find(t => t.id === filters.tenant)?.name || filters.tenant}
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, tenant: undefined })
                }
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-2">
          <span className="text-sm font-medium">
            {selectedCount} row(s) selected
          </span>
        </div>
      )}
    </div>
  );
}
