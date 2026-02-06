/** @format */

'use client';

import * as React from 'react';
import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { X, Search } from 'lucide-react';
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

interface DataTableToolbarProps<TData> {
  table?: Table<TData>;
  filters: ShipmentTableFilters;
  onFiltersChange: (filters: ShipmentTableFilters) => void;
  tenants?: Tenant[];
  children?: React.ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  filters,
  onFiltersChange,
  tenants = [],
  children,
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
    (filters.tenant && filters.tenant !== 'all');

  return (
    <div className='flex items-center justify-between p-4 gap-4'>
      <div className='flex flex-1 items-center space-x-2'>
        {/* Tenant Filter on the Left */}
        {tenants.length > 0 && (
          <Select
            value={filters.tenant || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                tenant: value === 'all' ? undefined : value,
              })
            }>
            <SelectTrigger className='h-8 w-[150px]'>
              <SelectValue placeholder='Filter by Tenant' />
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
              })
            }
            className='h-8 px-2 lg:px-3'>
            Reset
            <X className='ml-2 h-4 w-4' />
          </Button>
        )}

        {/* Children (e.g. Delete Button) */}
        {children}
      </div>

      {/* Search on the Right */}
      <div className='flex items-center space-x-2'>
        <div className='relative'>
          <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search shipments...'
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className='h-9 w-[150px] lg:w-[250px] pl-8'
          />
        </div>
      </div>
    </div>
  );
}
