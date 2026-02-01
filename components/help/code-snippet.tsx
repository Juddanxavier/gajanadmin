/** @format */

'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CodeSnippetProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export function CodeSnippet({
  code,
  language = 'typescript',
  showLineNumbers = false,
  className,
}: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');

  return (
    <div className={cn('relative group', className)}>
      <div className='flex items-center justify-between rounded-t-lg border border-b-0 bg-muted px-4 py-2'>
        <span className='text-xs font-medium text-muted-foreground uppercase'>
          {language}
        </span>
        <Button
          variant='ghost'
          size='sm'
          onClick={copyToClipboard}
          className='h-6 px-2 text-xs'>
          {copied ? (
            <>
              <Check className='mr-1 h-3 w-3' />
              Copied
            </>
          ) : (
            <>
              <Copy className='mr-1 h-3 w-3' />
              Copy
            </>
          )}
        </Button>
      </div>
      <div className='rounded-b-lg border bg-card'>
        <pre className='overflow-x-auto p-4'>
          <code className='text-sm'>
            {showLineNumbers ? (
              <table className='w-full'>
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={index}>
                      <td className='pr-4 text-right text-muted-foreground select-none w-8'>
                        {index + 1}
                      </td>
                      <td>{line || '\n'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              code
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}
