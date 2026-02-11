/** @format */

import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CommandPalette } from '@/components/command-palette';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: 'GT Express Admin Portal',
    template: '%s | GT Express',
  },
  description:
    'Comprehensive shipment management portal for tracking, managing, and monitoring shipments across multiple carriers with real-time updates.',
  keywords: ['shipment management', 'logistics', 'tracking', 'admin portal'],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'GT Express Admin Portal',
    description: 'Shipment Management & Tracking System',
    type: 'website',
  },
};

const geistSans = Geist({
  variable: '--font-geist-sans',
  display: 'swap',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute='class'
          defaultTheme='dark'
          enableSystem
          disableTransitionOnChange>
          <TooltipProvider>
            {children}
            <CommandPalette />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
