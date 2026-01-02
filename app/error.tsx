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
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center">
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <p className="text-muted-foreground max-w-md">
        An unexpected error occurred. Our team has been notified.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => window.location.href = '/'}>
            Go Home
        </Button>
        <Button
            variant="outline"
            onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
            }
        >
            Try again
        </Button>
      </div>
    </div>
  );
}
