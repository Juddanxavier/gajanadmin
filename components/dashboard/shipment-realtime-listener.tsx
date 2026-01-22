/** @format */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function ShipmentRealtimeListener() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to changes in the 'shipments' table
    const channel = supabase
      .channel('shipments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'shipments',
        },
        (payload) => {
          console.log('Realtime Shipment Change:', payload);

          // Refresh the current route (re-fetches server components)
          router.refresh();

          // Optional: Show toast for significant updates
          if (
            payload.eventType === 'UPDATE' &&
            payload.new.status !== payload.old.status
          ) {
            toast.info(
              `Shipment ${payload.new.carrier_tracking_code} updated: ${payload.new.status}`
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, supabase]);

  return null; // This component renders nothing
}
