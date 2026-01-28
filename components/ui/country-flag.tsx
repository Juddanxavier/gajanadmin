/** @format */

import * as React from 'react';
import * as Flags from 'country-flag-icons/react/3x2';
import { cn } from '@/lib/utils';

interface CountryFlagProps extends React.HTMLAttributes<HTMLDivElement> {
  countryCode: string;
  className?: string;
}

export function CountryFlag({
  countryCode,
  className,
  ...props
}: CountryFlagProps) {
  // Handle common aliases
  let code = countryCode ? countryCode.toUpperCase() : '';
  if (code === 'UK') code = 'GB';
  if (code === 'DUBAI') code = 'AE';
  if (code === 'NETHER') code = 'NL';
  if (code === 'NEWZEALAND') code = 'NZ';
  if (code === 'PHILIPINES') code = 'PH';
  // @ts-ignore - Flags match country codes but TS might complain about indexing
  const FlagComponent = Flags[code];

  if (!FlagComponent) {
    // Fallback if flag not found (maybe text or just null)
    return (
      <span
        className={cn(
          'inline-block w-6 h-4 bg-muted text-[10px] text-center leading-4',
          className,
        )}>
        {code || '??'}
      </span>
    );
  }

  return (
    <div
      className={cn(
        'w-6 h-4 inline-block overflow-hidden shadow-sm rounded-sm',
        className,
      )}
      {...props}>
      <FlagComponent title={code} className='w-full h-full object-cover' />
    </div>
  );
}
