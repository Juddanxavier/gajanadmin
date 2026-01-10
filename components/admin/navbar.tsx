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
import { CountryFlag } from '@/components/ui/country-flag';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Input } from '../ui/input';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { GlobalSearch } from '@/components/admin/global-search';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';

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
  const [currentTenant, setCurrentTenant] = useState<{
    name: string;
    country_code: string;
  } | null>(null);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
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

        // Check if Global Admin
        const { data: isAdmin } = await supabase.rpc('is_admin', {
          user_uuid: authUser.id,
        });
        if (isAdmin) {
          setIsGlobalAdmin(true);
        } else {
          // Fetch tenant info only if not global admin (or fetch anyway but prioritize global badge?)
          // Actually, global admins might want to see context. But request is "in place of tenant flag for global admin".
          // Let's fetch tenant data regardless, but UI logic will prioritize Global Badge.
          const { data: tenantData } = await supabase.rpc('get_user_tenants', {
            user_uuid: authUser.id,
          });

          if (tenantData && tenantData.length > 0) {
            setCurrentTenant({
              name: tenantData[0].tenant_name,
              country_code: tenantData[0].country_code || 'IN',
            });
          }
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

            {isGlobalAdmin ? (
              <>
                <Badge>
                  <Globe className='h-3 w-3 text-primary-foreground' />
                  <span className='text-primary-foreground font-normal tracking-wide text-[12px] capitalize'>
                    Global Admin
                  </span>
                </Badge>
              </>
            ) : (
              currentTenant && (
                <>
                  <div className='h-4 w-px bg-border' />
                  <div className='flex items-center gap-1.5 bg-muted/50 px-1.5 h-5 rounded-md border border-border/50 transition-all hover:bg-muted'>
                    <CountryFlag
                      countryCode={currentTenant.country_code}
                      className='h-2.5 w-3.5 rounded-[1px]'
                    />
                    <span className='text-foreground font-semibold tracking-tight text-[10px]'>
                      {currentTenant.name}
                    </span>
                  </div>
                </>
              )
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
