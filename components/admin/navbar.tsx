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
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
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
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { sidebarGroups } from '@/lib/config/navigation';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';

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
  const pathname = usePathname();
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
          setTenant({ name: 'Global Admin', code: 'GLOBAL' });
        }
      }

      // Listen for auth changes (e.g. profile update)
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser({
            name:
              session.user.user_metadata?.full_name ||
              session.user.email?.split('@')[0] ||
              'User',
            email: session.user.email || '',
            avatar: session.user.user_metadata?.avatar_url,
          });
        }
      });

      return () => {
        subscription.unsubscribe();
      };
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={onSidebarToggle}
                  aria-label={
                    isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
                  }
                  className='hidden md:flex shrink-0'>
                  <Menu className='h-5 w-5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                </p>
              </TooltipContent>
            </Tooltip>
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
                <div className='flex-1 overflow-y-auto px-2 py-2'>
                  {sidebarGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className='mb-4'>
                      {group.label && (
                        <h4 className='mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70'>
                          {group.label}
                        </h4>
                      )}
                      <div className='space-y-1'>
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive =
                            pathname === item.href ||
                            item.children?.some(
                              (child) => pathname === child.href,
                            );
                          const hasChildren =
                            item.children && item.children.length > 0;

                          if (hasChildren) {
                            return (
                              <Collapsible
                                key={item.title}
                                defaultOpen={isActive}
                                className='group/collapsible'>
                                <CollapsibleTrigger asChild>
                                  <div
                                    className={cn(
                                      'flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                      isActive
                                        ? 'text-foreground'
                                        : 'text-muted-foreground',
                                    )}>
                                    <div className='flex items-center gap-3'>
                                      <Icon className='h-4 w-4' />
                                      <span>{item.title}</span>
                                    </div>
                                    <ChevronDown className='h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180' />
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className='ml-9 mt-1 space-y-1 border-l pl-2'>
                                    {item.children?.map((child) => {
                                      const isChildActive =
                                        pathname === child.href;
                                      return (
                                        <Link
                                          key={child.href}
                                          href={child.href}
                                          className={cn(
                                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                            isChildActive
                                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                              : 'text-muted-foreground',
                                          )}>
                                          {child.title}
                                        </Link>
                                      );
                                    })}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            );
                          }

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                isActive
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                  : 'text-muted-foreground',
                              )}>
                              <Icon className='h-4 w-4' />
                              <span>{item.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Breadcrumbs / Tenant Display */}
          <nav className='hidden sm:flex items-center space-x-4 text-sm text-muted-foreground'>
            <AdminBreadcrumbs />
          </nav>
        </div>

        {/* Center Section: Search Bar */}
        <div className='flex-1 max-w-md hidden lg:block' data-tour='search-bar'>
          <GlobalSearch />
        </div>

        {/* Right Section: Actions */}
        <div className='flex items-center gap-2 flex-1 justify-end'>
          {tenant && (
            <div className='hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 bg-muted/50 rounded-full border border-border/50 mr-2 text-xs'>
              {tenant.code === 'GLOBAL' ? (
                <Globe className='h-3 w-3' />
              ) : (
                <CountryFlag countryCode={tenant.code} className='h-3 w-4' />
              )}
              <span className='font-medium text-foreground'>{tenant.name}</span>
            </div>
          )}
          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                onClick={toggleTheme}
                aria-label='Toggle theme'
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
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle {theme === 'dark' ? 'light' : 'dark'} mode</p>
            </TooltipContent>
          </Tooltip>

          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-tour='profile-menu'>
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
