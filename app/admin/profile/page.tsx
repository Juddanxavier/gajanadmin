import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProfileClient from './profile-client';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Profile | Admin',
  description: 'Manage your profile and account settings',
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileClient userId={user.id} userEmail={user.email || ''} />
      </Suspense>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
