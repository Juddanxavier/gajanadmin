/** @format */

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function StepIndicator({
  steps,
  currentStep,
  className,
}: StepIndicatorProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className='flex items-center justify-between'>
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={index} className='flex items-center flex-1'>
              <div className='flex flex-col items-center'>
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-colors',
                    isCompleted &&
                      'border-primary bg-primary text-primary-foreground',
                    isCurrent && 'border-primary bg-background text-primary',
                    !isCompleted &&
                      !isCurrent &&
                      'border-muted-foreground/30 bg-background text-muted-foreground',
                  )}>
                  {isCompleted ? (
                    <Check className='h-5 w-5' />
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium text-center max-w-[100px]',
                    isCurrent && 'text-primary',
                    !isCurrent && 'text-muted-foreground',
                  )}>
                  {step}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2 transition-colors',
                    isCompleted ? 'bg-primary' : 'bg-muted-foreground/30',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
