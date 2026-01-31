/** @format */

import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';

export default function LeadsLoading() {
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-32' />
          <Skeleton className='h-4 w-64' />
        </div>
      </div>

      <div className='w-full'>
        <div className='mb-4 flex gap-2'>
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className='h-9 w-24 rounded-md' />
          ))}
        </div>

        <Card className='border-0 shadow-none sm:border sm:shadow-sm'>
          <CardContent className='p-0'>
            <div className='space-y-4 p-4'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          </CardContent>
          <CardFooter className='p-4 border-t flex justify-between'>
            <Skeleton className='h-8 w-24' />
            <div className='flex gap-2'>
              <Skeleton className='h-8 w-8' />
              <Skeleton className='h-8 w-8' />
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
