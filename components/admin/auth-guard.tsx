"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

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
      const supabase = createClient();
      
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        // Not authenticated - redirect to login
        await supabase.auth.signOut();
        router.push('/login');
        return;
      }

      // Check user role
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      // Check if any returned role matches admin or staff
      const hasAccess = userRoles?.some((ur: any) => 
        ['admin', 'staff'].includes(ur.role)
      );

      if (roleError || !hasAccess) {
        // User doesn't have admin or staff role - sign out and redirect
        // Only sign out if we want to force re-login. 
        // For unauthorized page redirect, maybe keeping session is better so they can see "Not authorized" page with their email?
        // But requested flow was redirect to login?error=unauthorized which implies signout often.
        // Step 235 says "redirected to this link", implying /login?error...
        await supabase.auth.signOut();
        router.push('/login?error=unauthorized');
        return;
      }

      // User is authorized
      setIsAuthorized(true);
    } catch (error) {
      console.error('[AuthGuard] Error:', error);
      router.push('/login?error=auth_failed');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
