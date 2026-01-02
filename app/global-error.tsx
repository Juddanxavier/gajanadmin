'use client';

import { logger } from "@/lib/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
    logger.error('Global layout error', { error: error.message, stack: error.stack });
    
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center h-screen space-y-4 text-center p-4">
            <h1 className="text-3xl font-bold">Critical Error</h1>
            <p className="text-muted-foreground">The application encountered a critical error and cannot render.</p>
            <button
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                onClick={() => reset()}
            >
                Try again
            </button>
        </div>
      </body>
    </html>
  );
}
