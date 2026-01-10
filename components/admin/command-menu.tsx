/** @format */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  LayoutDashboard,
  Truck,
  Users,
  ShoppingBag,
  LogOut,
  Moon,
  Sun,
  Laptop,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { createClient } from '@/lib/supabase/client';

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder='Type a command or search...' />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading='Navigation'>
            <CommandItem
              onSelect={() => runCommand(() => router.push('/dashboard'))}>
              <LayoutDashboard className='mr-2 h-4 w-4' />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push('/shipments'))}>
              <Truck className='mr-2 h-4 w-4' />
              <span>Shipments</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push('/leads'))}>
              <ShoppingBag className='mr-2 h-4 w-4' />
              <span>Leads</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push('/users'))}>
              <Users className='mr-2 h-4 w-4' />
              <span>Users</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push('/settings'))}>
              <Settings className='mr-2 h-4 w-4' />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading='Theme'>
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
              <Sun className='mr-2 h-4 w-4' />
              <span>Light</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
              <Moon className='mr-2 h-4 w-4' />
              <span>Dark</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
              <Laptop className='mr-2 h-4 w-4' />
              <span>System</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading='Settings'>
            <CommandItem onSelect={() => runCommand(handleLogout)}>
              <LogOut className='mr-2 h-4 w-4' />
              <span>Log out</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
