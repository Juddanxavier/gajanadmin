/** @format */

'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TutorialCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  stepNumber?: number;
  className?: string;
}

export function TutorialCard({
  title,
  description,
  icon,
  children,
  defaultExpanded = false,
  stepNumber,
  className,
}: TutorialCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader
        className='cursor-pointer'
        onClick={() => setIsExpanded(!isExpanded)}>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex items-start gap-3 flex-1'>
            {stepNumber && (
              <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm'>
                {stepNumber}
              </div>
            )}
            {icon && !stepNumber && (
              <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                {icon}
              </div>
            )}
            <div className='flex-1'>
              <CardTitle className='text-lg'>{title}</CardTitle>
              {description && (
                <CardDescription className='mt-1'>
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          <Button
            variant='ghost'
            size='sm'
            className='shrink-0'
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}>
            {isExpanded ? (
              <ChevronUp className='h-4 w-4' />
            ) : (
              <ChevronDown className='h-4 w-4' />
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className='pt-0'>
          <div className='prose prose-sm dark:prose-invert max-w-none'>
            {children}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
