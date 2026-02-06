/** @format */

'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Circle,
  Clock,
  MapPin,
  Package,
  Truck,
} from 'lucide-react';
import { format } from 'date-fns';

interface TimelineEvent {
  date: string;
  description: string;
  location?: string;
  status?: string;
  icon?: any;
}

interface ShipmentTimelineProps {
  events?: any[];
  rawResponse?: any;
}

export function ShipmentTimeline({
  events,
  rawResponse,
}: ShipmentTimelineProps) {
  // normalize events from various sources
  let parsedEvents: TimelineEvent[] = [];

  if (events && events.length > 0) {
    parsedEvents = events.map((e) => ({
      date: e.occurred_at,
      description: e.description || e.status,
      location: e.location,
      status: e.status,
    }));
  }
  // 3. Fallback: Parse from raw_response (if Track123 structure)
  if (parsedEvents.length === 0 && rawResponse) {
    let rawEvents = [];

    // Check for standard Track123 structure (data.accepted.content...)
    // OR the structure user provided: localLogisticsInfo.trackingDetails
    if (rawResponse.localLogisticsInfo?.trackingDetails) {
      rawEvents = rawResponse.localLogisticsInfo.trackingDetails;
    } else if (rawResponse.tracking_events) {
      rawEvents = rawResponse.tracking_events;
    } else if (rawResponse.data && Array.isArray(rawResponse.data)) {
      rawEvents = rawResponse.data;
    } else if (rawResponse.data?.accepted?.[0]?.track?.z1?.events) {
      rawEvents = rawResponse.data.accepted[0].track.z1.events;
    }

    if (Array.isArray(rawEvents)) {
      parsedEvents = rawEvents.map((e: any) => ({
        date: e.eventTime || e.checkpoint_date || e.time || e.date,
        location: e.address || e.location || e.checkpoint_delivery_status || '',
        status:
          e.transitSubStatus ||
          e.eventDetail ||
          e.tracking_detail ||
          e.status ||
          e.message ||
          'Unknown',
        description: e.eventDetail || e.tracking_detail || e.message || '',
      }));
    }
  }

  // Sort by date descending (newest first)
  parsedEvents.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  if (parsedEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Tracking History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center p-8 text-center text-muted-foreground'>
            <Package className='h-12 w-12 mb-4 opacity-20' />
            <p>No tracking events available yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg'>Tracking History</CardTitle>
      </CardHeader>
      <CardContent className='px-6'>
        <div className='relative border-l border-gray-200 dark:border-gray-800 ml-3 space-y-8 pb-8'>
          {parsedEvents.map((event, index) => {
            const isFirst = index === 0;
            const date = new Date(event.date);

            let Icon = Circle;
            let iconColor = 'text-gray-400';
            let bgColor = 'bg-gray-100 dark:bg-gray-800';

            if (event.description.toLowerCase().includes('delivered')) {
              Icon = CheckCircle2;
              iconColor = 'text-green-600';
              bgColor = 'bg-green-100 dark:bg-green-900/20';
            } else if (
              event.description.toLowerCase().includes('transit') ||
              event.description.toLowerCase().includes('way')
            ) {
              Icon = Truck;
              iconColor = 'text-blue-600';
              bgColor = 'bg-blue-100 dark:bg-blue-900/20';
            } else if (isFirst) {
              Icon = Clock;
              iconColor = 'text-primary';
              bgColor = 'bg-primary/10';
            }

            return (
              <div key={index} className='relative pl-8'>
                {/* Timeline Dot */}
                <span
                  className={cn(
                    'absolute -left-4 top-1 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-950',
                    bgColor,
                  )}>
                  <Icon className={cn('h-4 w-4', iconColor)} />
                </span>

                {/* Content */}
                <div className='flex flex-col gap-1'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium text-muted-foreground min-w-[120px]'>
                      {isNaN(date.getTime())
                        ? 'Invalid Date'
                        : format(date, 'MMM d, yyyy h:mm a')}
                    </span>
                    {event.location && (
                      <Badge variant='outline' className='text-xs font-normal'>
                        <MapPin className='h-3 w-3 mr-1' />
                        {event.location}
                      </Badge>
                    )}
                  </div>

                  <p className='font-medium text-foreground text-base'>
                    {event.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
