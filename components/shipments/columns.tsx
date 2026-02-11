/** @format */

'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, getCountryName } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowUpDown,
  RefreshCw,
  Eye,
  Edit,
  Archive,
  Trash,
  MoreHorizontal,
  Copy,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  deleteShipment,
  refreshShipment,
  archiveShipment,
} from '@/app/(dashboard)/shipments/actions';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CountryFlag } from '@/components/ui/country-flag';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EditShipmentDialog } from './edit-shipment-form';

export type Shipment = {
  id: string;
  white_label_code: string;
  carrier_tracking_code: string;
  status: string;
  carrier_id: string;
  customer_details: {
    name: string;
    email: string;
    phone?: string;
  };
  destination_country?: string;
  destination_city?: string;
  created_at: string;
  archived_at?: string | null;
  amount?: number;
  last_synced_at?: string;
  tenants: {
    name: string;
    slug: string;
  };
  carriers: {
    name_en: string;
    logo_url?: string;
  };
};

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  in_transit: 'bg-blue-100 text-blue-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  exception: 'bg-red-100 text-red-800',
  expired: 'bg-orange-100 text-orange-800',
  failed: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  exception: 'Exception',
  expired: 'Expired',
  failed: 'Failed',
};

export const columns: ColumnDef<Shipment>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'white_label_code',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          White Label Code
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      const copyToClipboard = () => {
        navigator.clipboard.writeText(row.original.white_label_code);
        toast.success('Code copied to clipboard');
      };

      return (
        <div className='flex items-center gap-2 group'>
          <Link
            href={`/shipments/${row.original.id}`}
            className='font-mono font-semibold text-blue-600 hover:text-blue-800 hover:underline'>
            {row.original.white_label_code}
          </Link>
          <Button
            variant='ghost'
            size='icon'
            className='h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity'
            onClick={copyToClipboard}>
            <Copy className='h-3 w-3' />
            <span className='sr-only'>Copy code</span>
          </Button>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Status
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
          {statusLabels[status] || status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'carrier_tracking_code',
    header: 'Carrier Tracking',
    cell: ({ row }) => {
      const copyToClipboard = () => {
        navigator.clipboard.writeText(row.original.carrier_tracking_code);
        toast.success('Tracking code copied to clipboard');
      };

      return (
        <div className='flex items-center gap-2'>
          <span className='font-mono text-sm text-muted-foreground'>
            {row.original.carrier_tracking_code}
          </span>
          <Button
            variant='ghost'
            size='icon'
            className='h-6 w-6'
            onClick={copyToClipboard}>
            <Copy className='h-3 w-3' />
            <span className='sr-only'>Copy tracking code</span>
          </Button>
        </div>
      );
    },
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Amount
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = row.original.amount;
      if (!amount) return <span className='text-muted-foreground'>—</span>;
      return (
        <div className='font-medium'>
          {new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
          }).format(Number(amount))}
        </div>
      );
    },
  },
  {
    accessorKey: 'customer_details.name',
    header: 'Customer',
    cell: ({ row }) => {
      const customer = row.original.customer_details;
      return (
        <div>
          <div className='font-medium'>{customer.name}</div>
          <div className='text-sm text-muted-foreground'>{customer.email}</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'carriers.name_en',
    header: 'Carrier',
    cell: ({ row }) => {
      const carrier = row.original.carriers;
      return (
        <div className='flex items-center gap-2'>
          {carrier.logo_url && (
            <img
              src={carrier.logo_url}
              alt={carrier.name_en}
              className='h-6 w-6 object-contain'
            />
          )}
          <span>{carrier.name_en}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'destination_country',
    header: 'Destination',
    cell: ({ row }) => {
      const { destination_country, destination_city } = row.original;
      return (
        <div className='flex flex-col'>
          {destination_city && (
            <div className='font-medium'>{destination_city}</div>
          )}
          {destination_country && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground cursor-help w-fit'>
                    <CountryFlag
                      countryCode={destination_country}
                      className='h-3 w-4 rounded-[1px]'
                    />
                    <span>{getCountryName(destination_country)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {destination_city ? `${destination_city}, ` : ''}
                    {getCountryName(destination_country)}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {!destination_country && !destination_city && (
            <span className='text-muted-foreground'>—</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Created
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className='text-sm'>
          {formatDistanceToNow(new Date(row.original.created_at), {
            addSuffix: true,
          })}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const shipment = row.original;
      const router = useRouter();
      const [showDeleteAlert, setShowDeleteAlert] = useState(false);
      const [showEditDialog, setShowEditDialog] = useState(false);

      const handleRefresh = async () => {
        toast.promise(refreshShipment(shipment.id), {
          loading: 'Refreshing tracking...',
          success: (data) => {
            if (data.success) {
              router.refresh();
              return 'Refresh requested successfully';
            }
            throw new Error(data.error);
          },
          error: (err) => `Refresh failed: ${err.message}`,
        });
      };

      const executeDelete = async () => {
        toast.promise(deleteShipment(shipment.id), {
          loading: 'Deleting shipment...',
          success: () => {
            router.refresh();
            return 'Shipment deleted';
          },
          error: 'Failed to delete shipment',
        });
        setShowDeleteAlert(false);
      };

      const handleArchive = async () => {
        toast.promise(archiveShipment(shipment.id), {
          loading: 'Archiving shipment...',
          success: () => {
            router.refresh();
            return 'Shipment archived';
          },
          error: 'Failed to archive shipment',
        });
      };

      return (
        <>
          <EditShipmentDialog
            shipment={shipment}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
          />

          <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  this shipment and remove its data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={executeDelete}
                  className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

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
                  navigator.clipboard.writeText(shipment.white_label_code)
                }>
                Copy tracking code
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/shipments/${shipment.id}`}>
                  <Eye className='mr-2 h-4 w-4' />
                  View details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  setShowEditDialog(true);
                }}>
                <Edit className='mr-2 h-4 w-4' />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRefresh}>
                <RefreshCw className='mr-2 h-4 w-4' />
                Refresh tracking
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!shipment.archived_at && (
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className='mr-2 h-4 w-4' />
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className='text-red-600 focus:text-red-600'
                onSelect={(e) => {
                  e.preventDefault();
                  setShowDeleteAlert(true);
                }}>
                <Trash className='mr-2 h-4 w-4' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      );
    },
  },
];
