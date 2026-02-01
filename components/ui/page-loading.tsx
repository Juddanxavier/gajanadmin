/** @format */

'use client';

import { Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageLoadingProps {
  className?: string;
  message?: string;
  fullScreen?: boolean;
}

export function PageLoading({
  className,
  message = 'Loading...',
  fullScreen = false,
}: PageLoadingProps) {
  // Premium Spinner Component
  const Spinner = () => (
    <div className='relative flex items-center justify-center h-16 w-16'>
      {/* Outer spinning ring */}
      <div className='absolute inset-0 animate-spin rounded-full border-4 border-primary/20 border-t-primary h-full w-full' />

      {/* Inner static/pulsing logo */}
      <div className='relative z-10 bg-background rounded-full p-2'>
        <Truck className='h-6 w-6 text-primary animate-pulse' />
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className='fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md'>
        <div className='flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-300'>
          <Spinner />
          {message && (
            <p className='text-sm font-medium text-muted-foreground animate-pulse'>
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <div className='flex flex-col items-center gap-6'>
        <Spinner />
        {message && (
          <p className='text-sm font-medium text-muted-foreground'>{message}</p>
        )}
      </div>
    </div>
  );
}

// Skeleton variant for inline loading states
export function PageLoadingSkeleton() {
  return (
    <div className='space-y-4 w-full animate-pulse'>
      <div className='flex items-center justify-between'>
        <div className='h-8 w-1/3 rounded bg-muted' />
        <div className='h-8 w-24 rounded bg-muted' />
      </div>
      <div className='space-y-3'>
        <div className='h-40 w-full rounded-xl bg-muted/50 border border-muted' />
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='h-32 rounded-xl bg-muted/50' />
          <div className='h-32 rounded-xl bg-muted/50' />
        </div>
      </div>
    </div>
  );
}
