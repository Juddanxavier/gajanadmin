/** @format */

import { LoginForm } from '@/components/login-form';
import { redirect } from 'next/navigation';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const error =
    params.error === 'unauthorized'
      ? 'You do not have permission to access the admin portal (Admin/Staff only).'
      : typeof params.error === 'string'
        ? params.error
        : undefined;

  return (
    <div className='flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-muted/30'>
      <div className='w-full max-w-sm'>
        <LoginForm error={error} />
      </div>
    </div>
  );
}
