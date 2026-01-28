/** @format */

'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, RefreshCw, Edit, Trash2, Mail } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  syncShipmentAction,
  sendShipmentNotificationAction,
} from '@/app/(dashboard)/shipments/actions';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CarrierLogo } from './carrier-logo';
import { EditShipmentDialog } from './edit-shipment-dialog';
import { DeleteShipmentDialog } from './delete-shipment-dialog';
import { CountryFlag } from '@/components/ui/country-flag';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Type definition matching the join in actions.ts: select('*, user:user_id(email, id)')
export type ShipmentDisplay = {
  id: string;
  created_at: string;
  updated_at: string;
  white_label_code: string;
  carrier_tracking_code: string;
  carrier_id: string;
  provider: string;
  status: string;
  latest_location?: string;
  estimated_delivery?: string;
  origin_country?: string;
  destination_country?: string;
  customer_details: any;
  invoice_details?: any;
  user?: { email: string; id: string } | null;
  last_synced_at?: string;
  raw_response?: any;
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'delivered':
      return 'default'; // Black/Primary
    case 'in_transit':
      return 'secondary'; // Gray
    case 'pending':
      return 'outline';
    case 'exception':
      return 'destructive';
    case 'invalid':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const handleSync = async (id: string) => {
  const promise = syncShipmentAction(id);
  toast.promise(promise, {
    loading: 'Syncing shipment...',
    success: 'Shipment synced successfully',
    error: (err) => `Sync failed: ${err.message}`,
  });
};

const handleSendNotification = async (id: string) => {
  const promise = sendShipmentNotificationAction(id);
  toast.promise(promise, {
    loading: 'Queueing notification...',
    success: 'Notification queued successfully',
    error: (err) => `Failed to queue: ${err.message}`,
  });
};

export const columns: ColumnDef<ShipmentDisplay>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'white_label_code',
    header: 'White Label',
    cell: ({ row }) => (
      <div className='text-xs text-muted-foreground'>
        {row.getValue('white_label_code')}
      </div>
    ),
  },
  {
    accessorKey: 'carrier_tracking_code',
    header: 'Tracking Code',
    cell: ({ row }) => (
      <a
        href={`/shipments/${row.original.id}`}
        className='font-medium hover:underline text-primary'>
        {row.getValue('carrier_tracking_code')}
      </a>
    ),
  },
  {
    accessorKey: 'carrier_id',
    header: 'Carrier',
    cell: ({ row }) => {
      const carrierCode = row.getValue('carrier_id') as string;
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className='flex items-center justify-start'>
              <CarrierLogo
                code={carrierCode}
                className='h-6 w-6'
                width={24}
                height={24}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className='capitalize'>{carrierCode}</p>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge variant={getStatusColor(status)} className='capitalize'>
          {status.replace('_', ' ')}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'origin',
    header: 'Origin',
    cell: ({ row }) => {
      const raw = row.original.raw_response;
      const origin =
        raw?.ship_from || raw?.shipFrom || row.original.origin_country || '-';
      // Fallback: If origin string is exactly 2 chars (e.g. "CN"), use it as code.
      const countryCode =
        row.original.origin_country ||
        (typeof origin === 'string' && origin.length === 2
          ? origin
          : undefined);

      const displayContent =
        countryCode && countryCode.length === 2 ? (
          <CountryFlag
            countryCode={countryCode}
            className='h-5 w-7 rounded-[2px] shrink-0'
          />
        ) : (
          <span className='text-xs text-muted-foreground truncate max-w-[120px]'>
            {origin}
          </span>
        );

      return (
        <Tooltip>
          <TooltipTrigger className='cursor-default'>
            {displayContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{origin}</p>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: 'destination',
    header: 'Destination',
    cell: ({ row }) => {
      const raw = row.original.raw_response;
      // Prioritize latest_location (actual city) over country code, unless it's the historical placeholder
      const location =
        row.original.latest_location === 'Historical Data Entry'
          ? null
          : row.original.latest_location;

      const destination =
        location ||
        raw?.ship_to ||
        raw?.shipTo ||
        row.original.destination_country ||
        '-';
      const countryCode =
        row.original.destination_country ||
        (typeof destination === 'string' && destination.length === 2
          ? destination
          : undefined);

      const displayContent =
        countryCode && countryCode.length === 2 ? (
          <CountryFlag
            countryCode={countryCode}
            className='h-5 w-7 rounded-[2px] shrink-0'
          />
        ) : (
          <span className='text-xs text-muted-foreground truncate max-w-[120px]'>
            {destination}
          </span>
        );

      return (
        <Tooltip>
          <TooltipTrigger className='cursor-default'>
            {displayContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{destination}</p>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => {
      const invoice = row.original.invoice_details as any;
      const amount = invoice?.amount || invoice?.total;
      return amount ? (
        <div className='font-medium'>₹{amount}</div>
      ) : (
        <span className='text-muted-foreground'>-</span>
      );
    },
  },
  {
    accessorKey: 'customer',
    header: 'Customer',
    cell: ({ row }) => {
      const details = row.original.customer_details as any;
      return (
        <div className='text-xs'>
          {details?.name || row.original.user?.email || 'Unknown'}
        </div>
      );
    },
  },
  {
    accessorKey: 'last_synced_at',
    header: 'Last Synced',
    cell: ({ row }) => {
      const dateStr = row.getValue('last_synced_at') as string;
      if (!dateStr) return '-';
      const date = new Date(dateStr);
      // Check if valid date
      if (isNaN(date.getTime())) return '-';
      return (
        <span className='text-xs text-muted-foreground'>
          {format(date, 'PP p')}
        </span>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const shipment = row.original;
      const [editOpen, setEditOpen] = useState(false);
      const [deleteOpen, setDeleteOpen] = useState(false);
      const [refreshKey, setRefreshKey] = useState(0);

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <span className='sr-only'>Open menu</span>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  navigator.clipboard.writeText(shipment.carrier_tracking_code)
                }>
                Copy Tracking Code
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Edit className='mr-2 h-4 w-4' /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSendNotification(shipment.id)}>
                <Mail className='mr-2 h-4 w-4' /> Resend Update
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSync(shipment.id)}>
                <RefreshCw className='mr-2 h-4 w-4' /> Sync Now
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className='text-destructive focus:text-destructive'>
                <Trash2 className='mr-2 h-4 w-4' /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <EditShipmentDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            onSuccess={() => setRefreshKey((prev) => prev + 1)}
            shipment={shipment}
          />

          <DeleteShipmentDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            onSuccess={() => setRefreshKey((prev) => prev + 1)}
            shipment={shipment}
          />
        </>
      );
    },
  },
];
