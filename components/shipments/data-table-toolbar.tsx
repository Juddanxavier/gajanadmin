/** @format */

'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
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

interface DataTableToolbarProps {
  filters: ShipmentTableFilters;
  onFiltersChange: (filters: ShipmentTableFilters) => void;
  tenants?: Tenant[];
  children?: React.ReactNode;
}

export function DataTableToolbar({
  filters,
  onFiltersChange,
  tenants = [],
  children,
}: DataTableToolbarProps) {
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
    <div className='flex items-center justify-between p-4'>
      <div className='flex flex-1 items-center space-x-2'>
        <Input
          placeholder='Search tracking number...'
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          className='h-8 w-[150px] lg:w-[250px]'
        />

        {/* Tenant Filter */}
        {tenants.length > 0 && (
          <Select
            value={filters.tenant || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                tenant: value, // Pass 'all' explicitly to override cookie
              })
            }>
            <SelectTrigger className='h-8 w-[150px]'>
              <SelectValue placeholder='Tenant' />
            </SelectTrigger>
            <SelectContent>
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
                status: undefined,
                tenant: undefined,
              })
            }
            className='h-8 px-2 lg:px-3'>
            Reset
            <X className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>
      <div className='flex items-center space-x-2'>{children}</div>
    </div>
  );
}
