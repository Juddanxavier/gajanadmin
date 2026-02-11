/** @format */

'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Truck, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface RecentActivityProps {
  initialData: any[]; // Type properly if possible
}

export function RecentActivity({ initialData }: RecentActivityProps) {
  const [activities, setActivities] = useState(initialData);

  // Shipment logic removed
  useEffect(() => {
    // Future: Subscribe to Leads or Users
  }, []);

  return (
    <Card className='h-fit shadow-md hover:shadow-lg transition-all'>
      {' '}
      {/* Fixed height for consistency */}
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Live updates of shipment status changes
        </CardDescription>
      </CardHeader>
      <CardContent className='flex-1 overflow-hidden'>
        <div className='space-y-4'>
          <AnimatePresence initial={false}>
            {activities.length === 0 ? (
              <p className='text-sm text-muted-foreground text-center py-4'>
                No recent activity.
              </p>
            ) : (
              activities.map((s: any) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className='flex items-center gap-4 border-b last:border-0 pb-3 last:pb-0'>
                  <div className='h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center'>
                    <Truck className='h-4 w-4 text-blue-600' />
                  </div>
                  <div className='flex-1 space-y-1'>
                    <Link
                      href={`/shipments/${s.id}`}
                      className='hover:underline'>
                      <p className='text-sm font-medium leading-none'>
                        {s.carrier_tracking_code}
                      </p>
                    </Link>
                    <p className='text-xs text-muted-foreground'>
                      {s.latest_location || 'Location unknown'} •{' '}
                      <span className='capitalize font-semibold'>
                        {(s.status || 'unknown').replace('_', ' ')}
                      </span>
                    </p>
                  </div>
                  <div className='text-xs text-muted-foreground font-mono'>
                    {s.updated_at
                      ? formatDistanceToNow(new Date(s.updated_at), {
                          addSuffix: true,
                        })
                      : 'Just now'}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
        {/* {activities.length > 0 && (
          <div className='mt-4 pt-2 border-t flex justify-end'>
            <Link
              href='/shipments'
              className='text-sm text-primary flex items-center hover:underline'>
              View All <ArrowRight className='ml-1 h-3 w-3' />
            </Link>
          </div>
        )} */}
      </CardContent>
    </Card>
  );
}
