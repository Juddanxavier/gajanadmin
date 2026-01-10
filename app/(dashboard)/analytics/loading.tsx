/** @format */

import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className='space-y-6'>
      <div>
        <Skeleton className='h-8 w-[200px]' />
        <Skeleton className='h-4 w-[300px] mt-2' />
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Skeleton className='h-[120px]' />
        <Skeleton className='h-[120px]' />
        <Skeleton className='h-[120px]' />
        <Skeleton className='h-[120px]' />
      </div>
    </div>
  );
}
