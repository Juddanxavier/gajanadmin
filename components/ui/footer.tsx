/** @format */

'use client';

import { Heart } from 'lucide-react';
import packageJson from '@/package.json';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const version = packageJson.version || '1.0.0';

  return (
    <footer className='border-t bg-background mt-auto'>
      <div className='container mx-auto px-4 py-3'>
        {/* Bottom Bar */}
        <div className='flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-muted-foreground'>
          <div className='flex items-center gap-2'>
            <p>© {currentYear} GT Express. All rights reserved.</p>
            <span className='hidden sm:inline'>•</span>
            <p className='hidden sm:block'>v{version}</p>
          </div>
          <p className='inline-flex items-center gap-1'>
            Made with <Heart className='h-3 w-3 text-red-500 fill-red-500' />{' '}
            for efficient shipment management
          </p>
        </div>
      </div>
    </footer>
  );
}
