"use client";

import React from 'react';
import * as Flags from 'country-flag-icons/react/3x2';
import { cn } from "@/lib/utils";

interface CountryFlagProps extends React.HTMLAttributes<HTMLSpanElement> {
  countryCode: string;
}

export const CountryFlag = ({ countryCode, className, ...props }: CountryFlagProps) => {
  if (!countryCode) return null;
  
  // country-flag-icons exports components with valid ISO 3166-1 alpha-2 codes (uppercase)
  // We explicitly cast to any to key into the module safely at runtime
  const FlagComponent = (Flags as any)[countryCode.toUpperCase()];

  if (!FlagComponent) {
    return (
      <span className={cn("inline-flex items-center justify-center font-mono text-[10px] bg-muted text-muted-foreground w-6 h-4 rounded-sm", className)} {...props}>
        {countryCode.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <span className={cn("inline-block w-6 h-4 rounded-sm overflow-hidden shadow-sm", className)} {...props} title={countryCode.toUpperCase()}>
      <FlagComponent className="w-full h-full object-cover" />
    </span>
  );
};
