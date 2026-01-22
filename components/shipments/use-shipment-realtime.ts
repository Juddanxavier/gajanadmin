/** @format */

'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useShipmentRealtime(onUpdate?: () => void) {
  const router = useRouter();
  const supabase = createClient();

  // Keep the latest callback in a ref to avoid effect re-execution
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    const channel = supabase
      .channel('shipments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments',
        },
        (payload) => {
          // Trigger data refresh using the latest callback
          if (onUpdateRef.current) {
            onUpdateRef.current();
          }
          // Trigger server component refresh
          router.refresh();

          // Optional: Notify user
          if (payload.eventType === 'INSERT') {
            toast.info('New shipment created');
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // console.log('Listening for shipment updates...');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]); // Dependency on stable objects only
}
