/** @format */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { signOutAndRedirect, checkUserAccess } from '@/app/actions/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const { authorized, isAuthenticated } = await checkUserAccess();

      if (!isAuthenticated) {
        // Not authenticated
        await signOutAndRedirect('/login');
        return;
      }

      if (!authorized) {
        // Not authorized (Role mismatch)
        await signOutAndRedirect('/login?error=unauthorized');
        return;
      }

      // User is authorized
      setIsAuthorized(true);
    } catch (error) {
      console.error('[AuthGuard] Error:', error);
      await signOutAndRedirect('/login?error=auth_failed');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center space-y-4'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto text-primary' />
          <p className='text-sm text-muted-foreground'>Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
