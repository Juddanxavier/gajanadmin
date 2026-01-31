/** @format */

'use client';

import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  label?: string; // Optional label to show in tooltip
}

export function CopyButton({
  value,
  label = 'Copy to clipboard',
  className,
  ...props
}: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    if (hasCopied) {
      const timeout = setTimeout(() => {
        setHasCopied(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [hasCopied]);

  const onCopy = () => {
    navigator.clipboard.writeText(value);
    setHasCopied(true);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size='icon'
            variant='ghost'
            className={cn(
              'h-6 w-6 text-muted-foreground hover:text-foreground',
              className,
            )}
            onClick={onCopy}
            {...props}>
            <span className='sr-only'>{label}</span>
            {hasCopied ? (
              <Check className='h-3 w-3 text-green-500' />
            ) : (
              <Copy className='h-3 w-3' />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{hasCopied ? 'Copied!' : label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
