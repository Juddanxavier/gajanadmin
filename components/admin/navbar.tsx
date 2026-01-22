/** @format */

'use client';

import {
  Search,
  Menu,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Globe,
} from 'lucide-react';
import Link from 'next/link';
import { NotificationBell } from '../notifications/notification-bell';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Input } from '../ui/input';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { GlobalSearch } from '@/components/admin/global-search';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { getCurrentTenantDetails } from '@/app/(dashboard)/users/actions';
import { CountryFlag } from '@/components/ui/country-flag';

interface NavbarProps {
  onSidebarToggle?: () => void;
  isSidebarCollapsed?: boolean;
}

export default function Navbar({
  onSidebarToggle,
  isSidebarCollapsed,
}: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar?: string;
  } | null>(null);
  const [tenant, setTenant] = useState<{ name: string; code: string } | null>(
    null,
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const fetchData = async () => {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        setUser({
          name:
            authUser.user_metadata?.full_name ||
            authUser.email?.split('@')[0] ||
            'User',
          email: authUser.email || '',
          avatar: authUser.user_metadata?.avatar_url,
        });

        // Fetch Tenant
        const tenantDetails = await getCurrentTenantDetails();

        if (tenantDetails) {
          setTenant(tenantDetails);
        } else {
          // If no tenant is assigned, assume Global Admin
          setTenant({ name: 'Global Admin', code: 'GLOBAL' });
        }
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className='sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='flex h-16 items-center gap-4 px-4'>
        {/* Left Section */}
        <div className='flex items-center gap-3 flex-1'>
          {/* Desktop Sidebar Toggle */}
          {onSidebarToggle && (
            <Button
              variant='ghost'
              size='icon'
              onClick={onSidebarToggle}
              className='hidden md:flex shrink-0'>
              <Menu className='h-5 w-5' />
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='md:hidden shrink-0'>
                <Menu className='h-5 w-5' />
              </Button>
            </SheetTrigger>
            <SheetContent side='left' className='w-64 p-0'>
              <div className='flex h-full flex-col bg-sidebar'>
                <div className='flex h-16 items-center border-b px-4'>
                  <h2 className='text-lg font-semibold text-sidebar-foreground'>
                    Admin Panel
                  </h2>
                </div>
                <nav className='flex-1 space-y-1 p-2'>
                  <Link
                    href='/dashboard'
                    className='flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'>
                    Dashboard
                  </Link>
                  <Link
                    href='/users'
                    className='flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'>
                    Users
                  </Link>
                  <Link
                    href='/settings'
                    className='flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'>
                    Settings
                  </Link>
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          {/* Breadcrumbs / Tenant Display */}
          <nav className='hidden sm:flex items-center space-x-4 text-sm text-muted-foreground'>
            <AdminBreadcrumbs />
            {tenant && (
              <div className='flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full border border-border/50'>
                {tenant.code === 'GLOBAL' ? (
                  <Globe className='h-3 w-4' />
                ) : (
                  <CountryFlag countryCode={tenant.code} className='h-3 w-4' />
                )}
                <span className='font-medium text-foreground'>
                  {tenant.name}
                </span>
              </div>
            )}
          </nav>
        </div>

        {/* Center Section: Search Bar */}
        <div className='flex-1 max-w-md hidden lg:block'>
          <GlobalSearch />
        </div>

        {/* Right Section: Actions */}
        <div className='flex items-center gap-2 flex-1 justify-end'>
          {/* Theme Toggle */}
          <Button
            variant='ghost'
            size='icon'
            onClick={toggleTheme}
            className='relative shrink-0'>
            {mounted && (
              <>
                {theme === 'dark' ? (
                  <Sun className='h-5 w-5' />
                ) : (
                  <Moon className='h-5 w-5' />
                )}
              </>
            )}
            {!mounted && <Moon className='h-5 w-5' />}
          </Button>

          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='relative h-9 gap-2 px-2'>
                <Avatar className='h-7 w-7'>
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className='hidden md:inline-block text-sm font-medium'>
                  {user?.name || 'Loading...'}
                </span>
                <ChevronDown className='h-4 w-4 text-muted-foreground hidden md:block' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-56'>
              <DropdownMenuLabel className='font-normal'>
                <div className='flex flex-col space-y-1'>
                  <p className='text-sm font-medium leading-none'>
                    {user?.name || 'User'}
                  </p>
                  <p className='text-xs leading-none text-muted-foreground'>
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href='/profile' className='cursor-pointer'>
                  <User className='mr-2 h-4 w-4' />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href='/settings' className='cursor-pointer'>
                  <Settings className='mr-2 h-4 w-4' />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className='cursor-pointer text-destructive focus:text-destructive'>
                <LogOut className='mr-2 h-4 w-4' />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
