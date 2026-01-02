"use client";

import * as React from "react";
import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadTableFilters } from "@/lib/types";

interface DataTableToolbarProps<TData> {
  filters: LeadTableFilters;
  onFiltersChange: (filters: LeadTableFilters) => void;
}

export function DataTableToolbar<TData>({
  filters,
  onFiltersChange,
}: DataTableToolbarProps<TData>) {
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

  const isFiltered = !!searchValue || (filters.status && filters.status !== "all");

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Search leads..."
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => onFiltersChange({ ...filters, search: undefined, status: "all" })}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
