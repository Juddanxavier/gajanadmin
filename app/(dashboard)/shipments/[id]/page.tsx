/** @format */

import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  RefreshCw,
  Edit,
  Archive,
  Trash,
  Package,
  MapPin,
  User,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getShipmentById } from '../actions';
import { formatDistanceToNow, format } from 'date-fns';
import { ShipmentTimeline } from '@/components/shipments/shipment-timeline';
import { ShipmentMap } from '@/components/shipments/shipment-map';
import { ShipmentNotifications } from '@/components/shipments/shipment-notifications';
import { getNotificationHistory } from '../actions';

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  in_transit: 'bg-blue-100 text-blue-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  exception: 'bg-red-100 text-red-800',
  expired: 'bg-orange-100 text-orange-800',
  failed: 'bg-red-100 text-red-800',
};

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getShipmentById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const shipment = result.data;
  const trackingEvents = shipment.tracking_events || [];

  const notificationHistory = await getNotificationHistory(id);
  const notifications = notificationHistory.success
    ? notificationHistory.data
    : [];

  return (
    <div className='space-y-6 max-w-7xl mx-auto'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link href='/shipments'>
              <ArrowLeft className='h-5 w-5' />
            </Link>
          </Button>
          <div>
            <h1 className='text-3xl font-bold tracking-tight font-mono'>
              {shipment.white_label_code}
            </h1>
            <div className='flex items-center gap-2 mt-1'>
              <Badge
                className={
                  statusColors[shipment.status] || 'bg-gray-100 text-gray-800'
                }>
                {shipment.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <span className='text-muted-foreground text-sm'>
                {formatDistanceToNow(new Date(shipment.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className='flex gap-2'>
          <Button variant='outline' size='sm' asChild>
            <Link href={`/shipments?refresh=${shipment.id}`}>
              <RefreshCw className='mr-2 h-4 w-4' />
              Refresh Data
            </Link>
          </Button>
          <Button variant='outline' size='sm' asChild>
            <Link href={`/shipments/${shipment.id}/edit`}>
              <Edit className='mr-2 h-4 w-4' />
              Edit
            </Link>
          </Button>
          <Button
            variant='outline'
            size='sm'
            className='text-red-600 hover:text-red-700'>
            <Trash className='mr-2 h-4 w-4' />
            Delete
          </Button>
        </div>
      </div>

      {/* Top Section: Route & Map + Sidebar Stats */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Map Section */}
        <div className='lg:col-span-2 relative h-[400px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'>
          <ShipmentMap
            originCountry={
              shipment.origin_country ||
              shipment.raw_response?.shipFrom ||
              shipment.raw_response?.originCountry
            }
            destinationCountry={
              shipment.destination_country ||
              shipment.raw_response?.shipTo ||
              shipment.raw_response?.destinationCountry
            }
          />

          {/* Overlay Info */}
          <div className='absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur p-4 rounded-lg border shadow-sm flex items-center justify-between z-10'>
            <div className='flex items-center gap-3'>
              <div className='h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600'>
                <MapPin className='h-4 w-4' />
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Origin</p>
                <p className='font-semibold'>
                  {(() => {
                    const code =
                      shipment.origin_country ||
                      shipment.raw_response?.shipFrom;
                    if (!code) return 'Pending';
                    try {
                      return new Intl.DisplayNames(['en'], {
                        type: 'region',
                      }).of(code);
                    } catch (e) {
                      return code;
                    }
                  })()}
                </p>
              </div>
            </div>
            <div className='h-px w-12 bg-border hidden sm:block' />
            <div className='flex items-center gap-3'>
              <div className='h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600'>
                <MapPin className='h-4 w-4' />
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Destination</p>
                <p className='font-semibold'>
                  {(() => {
                    const code =
                      shipment.destination_country ||
                      shipment.raw_response?.shipTo;
                    if (!code) return 'Pending';
                    try {
                      return new Intl.DisplayNames(['en'], {
                        type: 'region',
                      }).of(code);
                    } catch (e) {
                      return code;
                    }
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Grid Stats (Sidebar) */}
        <div className='lg:col-span-1 grid grid-cols-1 grid-rows-3 gap-4 h-[400px]'>
          {/* Tracking Code */}
          <Card className='bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900'>
            <CardHeader className='p-4 pb-2'>
              <CardTitle className='text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2'>
                <Package className='h-4 w-4' /> Tracking Code
              </CardTitle>
            </CardHeader>
            <CardContent className='p-4 pt-0'>
              <div className='flex items-center justify-between'>
                <p className='font-mono text-lg font-bold text-slate-700 dark:text-slate-200 truncate'>
                  {shipment.carrier_tracking_code}
                </p>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-blue-100/50'
                  asChild>
                  <Link href={`/shipments?refresh=${shipment.id}`}>
                    <RefreshCw className='h-3 w-3' />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Weight & Dim */}
          <Card className='bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-100 dark:border-orange-900'>
            <CardHeader className='p-4 pb-2'>
              <CardTitle className='text-sm font-medium text-orange-600 dark:text-orange-400 flex items-center gap-2'>
                <Package className='h-4 w-4' /> Package Info
              </CardTitle>
            </CardHeader>
            <CardContent className='p-4 pt-0 space-y-1'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Weight:</span>
                <span className='font-medium'>
                  {shipment.package_weight
                    ? `${shipment.package_weight} kg`
                    : shipment.raw_response?.extraInfo?.weight?.value
                      ? `${shipment.raw_response.extraInfo.weight.value} ${shipment.raw_response.extraInfo.weight.unit || 'kg'}`
                      : '---'}
                </span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Dim:</span>
                <span className='font-medium'>
                  {shipment.package_dimensions &&
                  typeof shipment.package_dimensions === 'object'
                    ? `${shipment.package_dimensions.length}x${shipment.package_dimensions.width}x${shipment.package_dimensions.height}`
                    : shipment.raw_response?.extraInfo?.dimensions
                      ? `${shipment.raw_response.extraInfo.dimensions.length}x${shipment.raw_response.extraInfo.dimensions.width}x${shipment.raw_response.extraInfo.dimensions.height}`
                      : '---'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Customer */}
          <Card className='bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-100 dark:border-purple-900'>
            <CardHeader className='p-4 pb-2'>
              <CardTitle className='text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-2'>
                <User className='h-4 w-4' /> Customer
              </CardTitle>
            </CardHeader>
            <CardContent className='p-4 pt-0'>
              <p className='font-medium text-slate-700 dark:text-slate-200 truncate'>
                {shipment.customer_details?.name ||
                  shipment.raw_response?.receiverName ||
                  'Guest'}
              </p>
              <p className='text-xs text-muted-foreground truncate'>
                {shipment.customer_details?.email ||
                  shipment.raw_response?.receiverEmail ||
                  'No Email'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-3'>
        {/* Main Content */}
        <div className='md:col-span-2'>
          <ShipmentTimeline
            events={trackingEvents}
            rawResponse={shipment.raw_response}
          />
        </div>

        {/* Sidebar / Additional Info */}
        <div className='space-y-6'>
          {shipment.notes && (
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-sm whitespace-pre-wrap'>{shipment.notes}</p>
              </CardContent>
            </Card>
          )}

          <ShipmentNotifications notifications={notifications || []} />

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Raw Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='bg-slate-950 text-slate-50 p-4 rounded-lg overflow-auto max-h-[300px] text-xs font-mono'>
                <pre>
                  {JSON.stringify(
                    shipment.raw_response || 'No API response',
                    null,
                    2,
                  )}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
