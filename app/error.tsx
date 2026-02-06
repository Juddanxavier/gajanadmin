/** @format */

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('CRITICAL: Unhandled App Error Object:', error);
    logger.error('Unhandled app error', error);
  }, [error]);

  return (
    <div className='flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center'>
      <h2 className='text-2xl font-bold'>Something went wrong!</h2>
      <p className='text-muted-foreground max-w-md'>
        An unexpected error occurred. Our team has been notified.
      </p>
      {process.env.NODE_ENV === 'development' && (
        <div className='bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-md text-left text-sm font-mono overflow-auto max-w-2xl w-full'>
          <p className='font-bold mb-2'>Error Details:</p>
          <p>{error.message}</p>
          {error.digest && (
            <p className='text-xs mt-2 opacity-70'>Digest: {error.digest}</p>
          )}
        </div>
      )}
      <div className='flex gap-4'>
        <Button onClick={() => (window.location.href = '/')}>Go Home</Button>
        <Button
          variant='outline'
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }>
          Try again
        </Button>
      </div>
    </div>
  );
}
