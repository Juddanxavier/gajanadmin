/** @format */

'use client';

import * as React from 'react';
import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { X, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShipmentTableFilters, Tenant } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CountryFlag } from '@/components/ui/country-flag';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DataTableToolbarProps<TData> {
  table?: Table<TData>;
  filters: ShipmentTableFilters;
  onFiltersChange: (filters: ShipmentTableFilters) => void;
  tenants?: Tenant[];
  carriers?: { code: string; name: string }[];
  children?: React.ReactNode;
  className?: string;
}

export function DataTableToolbar<TData>({
  table,
  filters,
  onFiltersChange,
  tenants = [],
  carriers = [],
  children,
  className,
}: DataTableToolbarProps<TData>) {
  const [searchValue, setSearchValue] = React.useState(filters.search ?? '');

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== (filters.search ?? '')) {
        onFiltersChange({ ...filters, search: searchValue || undefined });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  // Sync back if filters are cleared externally
  React.useEffect(() => {
    setSearchValue(filters.search ?? '');
  }, [filters.search]);

  const isFiltered =
    !!searchValue ||
    (filters.status && filters.status !== 'all') ||
    (filters.tenant && filters.tenant !== 'all') ||
    (filters.carrier_id && filters.carrier_id !== 'all');

  return (
    <div
      className={`flex items-center justify-between gap-4 flex-wrap ${className}`}>
      <div className='flex flex-1 items-center space-x-2'>
        {/* Search */}
        <div className='relative'>
          <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search shipments...'
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className='h-9 w-[150px] lg:w-[250px] pl-8'
          />
        </div>

        {/* Tenant Filter */}
        {tenants.length > 0 && (
          <Select
            value={filters.tenant || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                tenant: value === 'all' ? undefined : value,
              })
            }>
            <SelectTrigger className='h-8 w-[150px] border-dashed'>
              <SelectValue placeholder='Tenant' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Tenants</SelectItem>
              {tenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  <div className='flex items-center gap-2'>
                    <CountryFlag
                      countryCode={tenant.code}
                      className='h-3 w-4'
                    />
                    <span>{tenant.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() =>
              onFiltersChange({
                ...filters,
                search: undefined,
                status: 'all',
                tenant: undefined,
                carrier_id: undefined,
              })
            }
            className='h-8 w-8 p-0'>
            <X className='h-4 w-4' />
            <span className='sr-only'>Reset</span>
          </Button>
        )}

        {/* Children (e.g. Delete Button) */}
        {children}
      </div>
    </div>
  );
}
