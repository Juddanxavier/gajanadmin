/** @format */

'use client';

import * as React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShipmentTableFilters } from '@/lib/types';

interface ShipmentFiltersProps {
  filters: ShipmentTableFilters;
  onFiltersChange: (filters: ShipmentTableFilters) => void;
  carriers?: { code: string; name: string }[];
}

const statuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'exception', label: 'Exception' },
  { value: 'expired', label: 'Expired' },
];

export function ShipmentFilters({
  filters,
  onFiltersChange,
  carriers = [],
}: ShipmentFiltersProps) {
  const selectedStatuses = Array.isArray(filters.status)
    ? filters.status
    : filters.status && filters.status !== 'all'
      ? [filters.status]
      : [];

  const handleStatusChange = (status: string, checked: boolean) => {
    let newStatuses = [...selectedStatuses];
    if (checked) {
      newStatuses.push(status);
    } else {
      newStatuses = newStatuses.filter((s) => s !== status);
    }

    const finalStatus = newStatuses.length > 0 ? newStatuses : 'all';

    onFiltersChange({
      ...filters,
      status: finalStatus,
    });
  };

  return (
    <div className='flex items-center gap-2'>
      {/* Status Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' size='sm' className='h-8 border-dashed'>
            <Filter className='mr-2 h-4 w-4' />
            Status
            {selectedStatuses.length > 0 && (
              <>
                <Separator orientation='vertical' className='mx-2 h-4' />
                <Badge
                  variant='secondary'
                  className='rounded-sm px-1 font-normal lg:hidden'>
                  {selectedStatuses.length}
                </Badge>
                <div className='hidden space-x-1 lg:flex'>
                  {selectedStatuses.length > 2 ? (
                    <Badge
                      variant='secondary'
                      className='rounded-sm px-1 font-normal'>
                      {selectedStatuses.length} selected
                    </Badge>
                  ) : (
                    statuses
                      .filter((s) => selectedStatuses.includes(s.value))
                      .map((option) => (
                        <Badge
                          variant='secondary'
                          key={option.value}
                          className='rounded-sm px-1 font-normal'>
                          {option.label}
                        </Badge>
                      ))
                  )}
                </div>
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start' className='w-[200px]'>
          <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {statuses.map((status) => (
            <DropdownMenuCheckboxItem
              key={status.value}
              checked={selectedStatuses.includes(status.value)}
              onCheckedChange={(checked) =>
                handleStatusChange(status.value, checked)
              }>
              {status.label}
            </DropdownMenuCheckboxItem>
          ))}
          {selectedStatuses.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                onCheckedChange={() =>
                  onFiltersChange({ ...filters, status: 'all' })
                }
                className='justify-center text-center'>
                Clear filters
              </DropdownMenuCheckboxItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Carrier Filter */}
      {carriers.length > 0 && (
        <Select
          value={filters.carrier_id || 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              carrier_id: value === 'all' ? undefined : value,
            })
          }>
          <SelectTrigger className='h-8 w-[150px] border-dashed'>
            <SelectValue placeholder='Carrier' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Carriers</SelectItem>
            {carriers.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
