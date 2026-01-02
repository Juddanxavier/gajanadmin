"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoadingProps {
  className?: string;
  message?: string;
  fullScreen?: boolean;
}

export function PageLoading({ 
  className, 
  message = "Loading...",
  fullScreen = false 
}: PageLoadingProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center py-12", className)}>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
}

// Skeleton variant for inline loading states
export function PageLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-32 w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-32 w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-32 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
