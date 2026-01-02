'use client';

import { Copy } from 'lucide-react';
import { useState } from 'react';

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      className="text-xs text-primary hover:underline flex items-center gap-1"
      onClick={handleCopy}
    >
      <Copy className="h-3 w-3" />
      {copied ? 'Copied!' : 'Copy SQL'}
    </button>
  );
}
