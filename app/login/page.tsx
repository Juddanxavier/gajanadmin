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
      <div className='w-full max-w-sm flex flex-col gap-6 relative'>
        {/* Branding Header */}
        <div className='flex flex-col items-center gap-2 text-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground'>
            {/* Simple Logo Icon */}
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='h-7 w-7'>
              <path d='M16.5 9.4 7.5 4.21' />
              <path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' />
              <path d='M3.27 6.96 12 12.01l8.73-5.05' />
              <path d='M12 22.08V12' />
            </svg>
          </div>
          <div className='space-y-1'>
            <h1 className='text-2xl font-bold tracking-tight'>Gajan Traders</h1>
            <p className='text-sm text-muted-foreground font-medium uppercase tracking-wider'>
              Admin Portal
            </p>
          </div>
        </div>

        <LoginForm error={error} />

        {/* Footer Warning */}
        <p className='text-center text-xs text-muted-foreground mt-4 px-4 w-full'>
          Authorized Personnel Only. <br />
          All activities are monitored and logged.
        </p>
      </div>
    </div>
  );
}
