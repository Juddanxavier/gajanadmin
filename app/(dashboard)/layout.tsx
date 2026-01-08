/** @format */

'use client';

import Navbar from '@/components/admin/navbar';
import Sidebar from '@/components/admin/sidebar';
import { AuthGuard } from '@/components/admin/auth-guard';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { NotificationProvider } from '@/contexts/notification-context';

import { CommandMenu } from '@/components/admin/command-menu';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load sidebar state from localStorage
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setIsSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  const handleSidebarToggle = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    if (mounted) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    }
  };

  return (
    <AuthGuard>
      <NotificationProvider>
        <div className='relative min-h-screen'>
          <CommandMenu />
          {/* Sidebar - Hidden on mobile */}
          <div className='hidden md:block'>
            <Sidebar
              isCollapsed={isSidebarCollapsed}
              onToggle={handleSidebarToggle}
            />
          </div>

          {/* Main Content */}
          <div
            className={cn(
              'min-h-screen transition-all duration-300',
              isSidebarCollapsed ? 'md:pl-16' : 'md:pl-64'
            )}>
            {/* Navbar */}
            <Navbar
              onSidebarToggle={handleSidebarToggle}
              isSidebarCollapsed={isSidebarCollapsed}
            />

            {/* Page Content */}
            <main className='p-4 sm:p-6 md:p-8'>
              <div className='mx-auto max-w-7xl'>{children}</div>
            </main>
          </div>
        </div>
      </NotificationProvider>
    </AuthGuard>
  );
}
