/** @format */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  Package,
  Truck,
  Check,
  AlertTriangle,
  Clock,
  Timer,
} from 'lucide-react';

interface StatsOverviewProps {
  stats: {
    total: number;
    active: number;
    exceptions: number;
    delivered: number;
  };
  performance?: {
    onTimeRate: number;
    avgTransitTime: number;
    totalShipments: number; // unused in card but good to have
    delayedShipments: number; // unused in card
  };
}

export function StatsOverview({ stats, performance }: StatsOverviewProps) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
      {/* Row 1: Volume Metrics */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className='cursor-help'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total Shipments
              </CardTitle>
              <Package className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.total}</div>
              <p className='text-xs text-muted-foreground'>
                Lifetime shipments
              </p>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          <p>Total number of shipments created across all time</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Card className='cursor-help'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Active</CardTitle>
              <Truck className='h-4 w-4 text-blue-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.active}</div>
              <p className='text-xs text-muted-foreground'>
                In transit or pending
              </p>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          <p>Shipments currently in transit or awaiting pickup</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Card className='cursor-help'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Delivered</CardTitle>
              <Check className='h-4 w-4 text-green-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.delivered}</div>
              <p className='text-xs text-muted-foreground'>
                Successfully delivered
              </p>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          <p>Shipments marked as successfully delivered to recipients</p>
        </TooltipContent>
      </Tooltip>

      {/* Row 2: Exception & Performance */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className='cursor-help'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Exceptions</CardTitle>
              <AlertTriangle className='h-4 w-4 text-red-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.exceptions}</div>
              <p className='text-xs text-muted-foreground'>
                Requires attention
              </p>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Shipments with delivery issues or delays requiring immediate
            attention
          </p>
        </TooltipContent>
      </Tooltip>

      {performance && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className='cursor-help'>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    On-Time Rate
                  </CardTitle>
                  <Clock className='h-4 w-4 text-purple-500' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {performance.onTimeRate}%
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Shipments delivered on time
                  </p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Percentage of shipments delivered within the expected timeframe
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className='cursor-help'>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Avg Transit Time
                  </CardTitle>
                  <Timer className='h-4 w-4 text-orange-500' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {performance.avgTransitTime}{' '}
                    <span className='text-sm font-normal text-muted-foreground'>
                      days
                    </span>
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Average delivery time
                  </p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Average number of days from shipment creation to delivery</p>
            </TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  );
}
