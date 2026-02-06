/** @format */

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { Metadata } from 'next';

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  in_transit: 'bg-blue-100 text-blue-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  exception: 'bg-red-100 text-red-800',
  expired: 'bg-orange-100 text-orange-800',
  failed: 'bg-red-100 text-red-800',
};

export async function generateMetadata({
  params,
}: {
  params: { trackingCode: string };
}): Promise<Metadata> {
  return {
    title: `Track Shipment ${params.trackingCode}`,
    description: `Track your shipment with tracking code ${params.trackingCode}`,
  };
}

export default async function PublicTrackingPage({
  params,
}: {
  params: { trackingCode: string };
}) {
  const supabase = await createClient();

  // Fetch shipment by white label code (no auth required)
  const { data: shipment, error } = await supabase
    .from('shipments')
    .select(
      `
      *,
      tenants(id, name, slug),
      carriers(code, name_en, logo_url),
      tracking_events(*)
    `,
    )
    .eq('white_label_code', params.trackingCode)
    .is('deleted_at', null)
    .single();

  if (error || !shipment) {
    notFound();
  }

  // Fetch tenant branding settings
  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .eq('tenant_id', shipment.tenant_id)
    .single();

  const brandColor = settings?.brand_color || '#3b82f6';
  const companyLogo = settings?.logo_url;
  const companyName = shipment.tenants.name;

  const trackingEvents = shipment.tracking_events || [];
  const sortedEvents = [...trackingEvents].sort(
    (a, b) =>
      new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
  );

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
      {/* Header with Tenant Branding */}
      <div
        className='border-b bg-white shadow-sm'
        style={{ borderTopColor: brandColor, borderTopWidth: '4px' }}>
        <div className='container mx-auto px-4 py-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              {companyLogo && (
                <img
                  src={companyLogo}
                  alt={companyName}
                  className='h-12 w-auto object-contain'
                />
              )}
              <div>
                <h1 className='text-2xl font-bold'>{companyName}</h1>
                <p className='text-sm text-muted-foreground'>
                  Shipment Tracking
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='container mx-auto px-4 py-8 max-w-4xl'>
        {/* Tracking Code Header */}
        <Card className='mb-6'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground mb-1'>
                  Tracking Number
                </p>
                <h2 className='text-2xl font-bold font-mono'>
                  {shipment.white_label_code}
                </h2>
              </div>
              <Badge
                className={`${statusColors[shipment.status]} text-base px-4 py-1`}>
                {shipment.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Current Status Card */}
        <Card
          className='mb-6'
          style={{ borderLeftColor: brandColor, borderLeftWidth: '4px' }}>
          <CardContent className='pt-6'>
            <div className='flex items-start gap-4'>
              <div
                className='rounded-full p-3'
                style={{ backgroundColor: `${brandColor}15` }}>
                {shipment.status === 'delivered' ? (
                  <CheckCircle2
                    className='h-6 w-6'
                    style={{ color: brandColor }}
                  />
                ) : (
                  <Package className='h-6 w-6' style={{ color: brandColor }} />
                )}
              </div>
              <div className='flex-1'>
                <h3 className='font-semibold text-lg mb-1'>
                  {shipment.substatus ||
                    shipment.status.replace('_', ' ').toUpperCase()}
                </h3>
                {shipment.latest_location && (
                  <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                    <MapPin className='h-4 w-4' />
                    <span>{shipment.latest_location}</span>
                  </div>
                )}
                {shipment.estimated_delivery &&
                  shipment.status !== 'delivered' && (
                    <div className='flex items-center gap-2 text-sm'>
                      <Calendar className='h-4 w-4 text-muted-foreground' />
                      <span>
                        Estimated delivery:{' '}
                        <strong>
                          {format(new Date(shipment.estimated_delivery), 'PPP')}
                        </strong>
                      </span>
                    </div>
                  )}
                {shipment.actual_delivery_date && (
                  <div className='flex items-center gap-2 text-sm text-green-600'>
                    <CheckCircle2 className='h-4 w-4' />
                    <span>
                      Delivered on{' '}
                      <strong>
                        {format(new Date(shipment.actual_delivery_date), 'PPP')}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tracking Timeline */}
        <Card>
          <CardHeader>
            <h3 className='text-lg font-semibold'>Tracking History</h3>
          </CardHeader>
          <CardContent>
            {sortedEvents.length > 0 ? (
              <div className='space-y-4'>
                {sortedEvents.map((event: any, index: number) => (
                  <div key={event.id} className='flex gap-4'>
                    <div className='flex flex-col items-center'>
                      <div
                        className={`h-3 w-3 rounded-full border-2`}
                        style={{
                          backgroundColor: index === 0 ? brandColor : 'white',
                          borderColor: index === 0 ? brandColor : '#d1d5db',
                        }}
                      />
                      {index < sortedEvents.length - 1 && (
                        <div className='w-px flex-1 bg-gray-200 min-h-8' />
                      )}
                    </div>
                    <div className='flex-1 pb-4'>
                      <div className='flex items-start justify-between'>
                        <div>
                          <p className='font-medium'>
                            {event.description ||
                              event.status.replace('_', ' ')}
                          </p>
                          {event.location && (
                            <p className='text-sm text-muted-foreground flex items-center gap-1 mt-1'>
                              <MapPin className='h-3 w-3' />
                              {event.location}
                            </p>
                          )}
                        </div>
                        <div className='text-right text-sm text-muted-foreground'>
                          <p>{format(new Date(event.occurred_at), 'PPP')}</p>
                          <p className='text-xs'>
                            {format(new Date(event.occurred_at), 'p')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-8 text-muted-foreground'>
                <Package className='mx-auto h-12 w-12 mb-2 opacity-50' />
                <p>No tracking updates available yet</p>
                <p className='text-sm'>Please check back later</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shipment Details */}
        <Card className='mt-6'>
          <CardHeader>
            <h3 className='text-lg font-semibold'>Shipment Details</h3>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 md:grid-cols-2'>
              <div>
                <p className='text-sm text-muted-foreground'>Carrier</p>
                <div className='flex items-center gap-2 mt-1'>
                  {shipment.carriers?.logo_url && (
                    <img
                      src={shipment.carriers.logo_url}
                      alt={shipment.carriers.name_en}
                      className='h-5 w-5 object-contain'
                    />
                  )}
                  <p className='font-medium'>{shipment.carriers?.name_en}</p>
                </div>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>
                  Carrier Tracking Number
                </p>
                <p className='font-mono mt-1'>
                  {shipment.carrier_tracking_code}
                </p>
              </div>
              {shipment.destination_country && (
                <div>
                  <p className='text-sm text-muted-foreground'>Destination</p>
                  <p className='font-medium mt-1'>
                    {shipment.destination_city &&
                      `${shipment.destination_city}, `}
                    {shipment.destination_country}
                  </p>
                </div>
              )}
              <div>
                <p className='text-sm text-muted-foreground'>Shipment Date</p>
                <p className='font-medium mt-1'>
                  {format(new Date(shipment.created_at), 'PPP')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className='text-center mt-8 text-sm text-muted-foreground'>
          <p>
            For questions about your shipment, please contact{' '}
            {settings?.company_address || companyName}
          </p>
          {shipment.last_synced_at && (
            <p className='mt-2'>
              Last updated{' '}
              {formatDistanceToNow(new Date(shipment.last_synced_at), {
                addSuffix: true,
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
