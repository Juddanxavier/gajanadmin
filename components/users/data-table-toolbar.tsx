/** @format */

'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Search, Trash2, UserPlus, RefreshCw, Plus } from 'lucide-react';
import { UserTableFilters } from '@/lib/types';
import type { Role, Tenant } from '@/lib/types';
// import { getCountryFlag } from "@/lib/utils";
import { CountryFlag } from '@/components/ui/country-flag';

interface DataTableToolbarProps {
  filters: UserTableFilters;
  onFiltersChange: (filters: UserTableFilters) => void;
  selectedCount: number;
  onBulkDelete?: () => void;
  onBulkAssignRole?: () => void;
  roles: Role[];
  tenants: Tenant[];
  onRefresh: () => void;
  onInvite?: () => void;
  onAddNew: () => void;
  isRefreshing?: boolean;
}

export function DataTableToolbar({
  filters = {},
  onFiltersChange,
  selectedCount,
  onBulkDelete,
  onBulkAssignRole,
  roles,
  tenants,
  onRefresh,
  onInvite,
  onAddNew,
  isRefreshing = false,
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

  const hasFilters =
    searchValue ||
    filters.role ||
    filters.tenant ||
    filters.dateFrom ||
    filters.dateTo;

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className='flex items-center justify-between p-4 space-x-2'>
      {/* Search and Filters */}
      <div className='flex flex-1 items-center space-x-2'>
        <Input
          placeholder='Search users...'
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className='h-8 w-[150px] lg:w-[250px]'
        />

        {/* Role Filter */}
        {roles.length > 0 && (
          <Select
            value={filters.role || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                role: value === 'all' ? undefined : value,
              })
            }>
            <SelectTrigger className='h-8 w-[130px]'>
              <SelectValue placeholder='Role' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Roles</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.name}>
                  {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

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
            <SelectTrigger className='h-8 w-[150px]'>
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

        {/* Clear Filters */}
        {hasFilters && (
          <Button
            variant='ghost'
            onClick={clearFilters}
            className='h-8 px-2 lg:px-3'>
            Reset
            <X className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>

      {/* Right Side Actions */}
      <div className='flex items-center space-x-2'>
        {/* Bulk Actions */}
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

        {/* Primary Actions */}
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
      </div>
    </div>
  );
}
