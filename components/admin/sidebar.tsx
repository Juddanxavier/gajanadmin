/** @format */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Settings,
  Truck,
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  ChevronDown,
  Activity,
  Target,
  Mail,
  FileText,
  List,
} from 'lucide-react';
import { sidebarGroups } from '@/lib/config/navigation';
import { Button } from '@/components/ui/button';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useNotifications } from '@/contexts/notification-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const router = useRouter();
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar?: string;
  } | null>(null);

  React.useEffect(() => {
    const fetchUser = async () => {
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
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300 flex flex-col',
        isCollapsed ? 'w-16' : 'w-64',
      )}>
      <div className='flex h-16 items-center justify-between px-4 border-b border-border shrink-0'>
        {!isCollapsed && (
          <div className='flex items-center gap-2 font-bold text-lg text-primary tracking-tight'>
            <Truck className='h-6 w-6' />
            <span>GajanTracker</span>
          </div>
        )}
        {isCollapsed && (
          <div className='w-full flex justify-center'>
            <Truck className='h-6 w-6 text-primary' />
          </div>
        )}
      </div>

      <div className='flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600 scrollbar-track-transparent'>
        <div className='space-y-4'>
          {sidebarGroups.map((group, groupIndex) => (
            <div key={groupIndex} className='space-y-1'>
              <nav className='space-y-1'>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    item.children?.some((child) => pathname === child.href);
                  const hasChildren = item.children && item.children.length > 0;
                  const showBadge = item.badge === true && unreadCount > 0;
                  const badgeValue = showBadge ? unreadCount : item.badge;

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.href} delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              'relative flex h-9 w-9 items-center justify-center rounded-md transition-colors',
                              isActive
                                ? 'bg-primary text-primary-foreground font-medium shadow-md'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                            )}>
                            <Icon className='h-4 w-4' />
                            {showBadge && (
                              <span className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground'>
                                {unreadCount > 9 ? '9+' : unreadCount}
                              </span>
                            )}
                            <span className='sr-only'>{item.title}</span>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent
                          side='right'
                          className='flex items-center gap-4 bg-popover text-popover-foreground border-border'>
                          {item.title}
                          {showBadge && (
                            <Badge
                              variant='destructive'
                              className='h-5 px-1.5 text-[10px]'>
                              {unreadCount}
                            </Badge>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  // Expanded state
                  if (hasChildren) {
                    const isChildActive = item.children?.some(
                      (child) => pathname === child.href,
                    );

                    return (
                      <Collapsible
                        key={item.title}
                        defaultOpen={isActive}
                        className='group/collapsible'>
                        <CollapsibleTrigger asChild>
                          <div
                            className={cn(
                              'flex items-center w-full justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer hover:bg-accent hover:text-accent-foreground',
                              isActive && !isChildActive
                                ? 'text-foreground font-semibold'
                                : 'text-muted-foreground',
                            )}>
                            <div className='flex items-center gap-3'>
                              <Icon className='h-4 w-4' />
                              <span>{item.title}</span>
                            </div>
                            <div className='flex items-center gap-2'>
                              {showBadge && (
                                <Badge
                                  variant='destructive'
                                  className='h-5 px-2 text-xs rounded-full'>
                                  {unreadCount}
                                </Badge>
                              )}
                              <ChevronDown className='h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180' />
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className='ml-9 mt-1 space-y-1'>
                            {item.children?.map((child) => {
                              const isChildItemActive = pathname === child.href;
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className={cn(
                                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                    isChildItemActive
                                      ? 'bg-primary/10 text-primary border-r-2 border-primary rounded-r-none'
                                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                  )}>
                                  {child.icon && (
                                    <child.icon className='h-4 w-4' />
                                  )}
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
                        'flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      )}>
                      <div className='flex items-center gap-3'>
                        <Icon className='h-4 w-4' />
                        <span>{item.title}</span>
                      </div>
                      {typeof badgeValue !== 'boolean' && badgeValue && (
                        <Badge
                          variant='secondary'
                          className='text-[10px] h-5 px-1.5'>
                          {badgeValue}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* User Footer */}
      <div className='border-t border-border p-3 space-y-2'>
        {user && !isCollapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                className='w-full justify-start px-2 h-12 hover:bg-accent hover:text-accent-foreground'>
                <div className='flex items-center gap-3 w-full'>
                  <Avatar className='h-8 w-8'>
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex flex-col items-start text-left overflow-hidden'>
                    <span className='text-sm font-medium truncate w-32'>
                      {user.name}
                    </span>
                    <span className='text-xs text-muted-foreground truncate w-32'>
                      {user.email}
                    </span>
                  </div>
                  <Settings className='h-4 w-4 ml-auto text-muted-foreground' />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              className='w-56'
              side='right'
              sideOffset={10}>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className='mr-2 h-4 w-4' />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className='text-destructive'>
                <LogOut className='mr-2 h-4 w-4' />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {user && isCollapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='w-full h-10 hover:bg-accent hover:text-accent-foreground'>
                <Avatar className='h-8 w-8'>
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='start'
              className='w-56'
              side='right'
              sideOffset={10}>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className='mr-2 h-4 w-4' />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className='text-destructive'>
                <LogOut className='mr-2 h-4 w-4' />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </aside>
  );
}
