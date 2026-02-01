/** @format */

'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface SearchResult {
  id: string;
  title: string;
  section: string;
  description: string;
}

const searchableContent: SearchResult[] = [
  // Getting Started
  {
    id: 'first-login',
    title: 'First Login & Setup',
    section: 'Getting Started',
    description: 'Set up your profile and configure initial settings',
  },
  {
    id: 'dashboard-overview',
    title: 'Dashboard Overview',
    section: 'Getting Started',
    description: 'Understanding your dashboard metrics and widgets',
  },
  {
    id: 'first-shipment',
    title: 'Creating Your First Shipment',
    section: 'Getting Started',
    description: 'Step-by-step guide to create your first shipment',
  },

  // Shipments
  {
    id: 'create-shipment',
    title: 'Creating Shipments',
    section: 'Shipments',
    description: 'How to create single and bulk shipments',
  },
  {
    id: 'bulk-operations',
    title: 'Bulk Operations',
    section: 'Shipments',
    description: 'Import and manage multiple shipments at once',
  },
  {
    id: 'tracking',
    title: 'Tracking & Auto-Sync',
    section: 'Shipments',
    description: 'Understanding automatic tracking updates',
  },
  {
    id: 'exceptions',
    title: 'Managing Exceptions',
    section: 'Shipments',
    description: 'Handle shipment exceptions and issues',
  },
  {
    id: 'archiving',
    title: 'Archiving & Data Management',
    section: 'Shipments',
    description: 'Archive old shipments and manage data',
  },

  // Leads
  {
    id: 'create-lead',
    title: 'Creating Leads',
    section: 'Leads',
    description: 'Add and import new leads',
  },
  {
    id: 'lead-workflow',
    title: 'Lead Qualification',
    section: 'Leads',
    description: 'Qualify and manage lead pipeline',
  },
  {
    id: 'convert-lead',
    title: 'Converting to Shipments',
    section: 'Leads',
    description: 'Convert qualified leads to shipments',
  },
  {
    id: 'lead-analytics',
    title: 'Lead Analytics',
    section: 'Leads',
    description: 'Track lead conversion and performance',
  },

  // Analytics
  {
    id: 'dashboard-metrics',
    title: 'Dashboard Metrics',
    section: 'Analytics',
    description: 'Understanding key performance indicators',
  },
  {
    id: 'shipment-analytics',
    title: 'Shipment Analytics',
    section: 'Analytics',
    description: 'Analyze shipment trends and patterns',
  },
  {
    id: 'user-performance',
    title: 'User Performance',
    section: 'Analytics',
    description: 'Track team member performance',
  },
  {
    id: 'custom-reports',
    title: 'Custom Reports',
    section: 'Analytics',
    description: 'Create and export custom reports',
  },

  // Users
  {
    id: 'roles-permissions',
    title: 'Roles & Permissions',
    section: 'Users',
    description: 'Understanding user roles and access control',
  },
  {
    id: 'invite-users',
    title: 'Inviting Team Members',
    section: 'Users',
    description: 'Add new team members to your workspace',
  },
  {
    id: 'tenant-management',
    title: 'Tenant Management',
    section: 'Users',
    description: 'Managing multiple workspaces',
  },

  // Notifications
  {
    id: 'email-setup',
    title: 'Email Configuration',
    section: 'Notifications',
    description: 'Configure email notification settings',
  },
  {
    id: 'webhooks',
    title: 'Webhook Setup',
    section: 'Notifications',
    description: 'Set up webhooks for real-time updates',
  },
  {
    id: 'templates',
    title: 'Notification Templates',
    section: 'Notifications',
    description: 'Customize notification templates',
  },
  {
    id: 'debugging',
    title: 'Debugging Issues',
    section: 'Notifications',
    description: 'Troubleshoot notification problems',
  },

  // Settings
  {
    id: 'profile',
    title: 'Profile Settings',
    section: 'Settings',
    description: 'Manage your profile and preferences',
  },
  {
    id: 'api-keys',
    title: 'API Keys',
    section: 'Settings',
    description: 'Generate and manage API keys',
  },
  {
    id: 'integrations',
    title: 'Integrations',
    section: 'Settings',
    description: 'Connect third-party services',
  },

  // Troubleshooting & API
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    section: 'Troubleshooting',
    description: 'Common issues and solutions',
  },
  {
    id: 'api',
    title: 'API & Integrations',
    section: 'API',
    description: 'API documentation and integration guides',
  },
];

interface HelpSearchProps {
  onResultClick: (sectionId: string) => void;
}

export function HelpSearch({ onResultClick }: HelpSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const filteredResults = query
    ? searchableContent.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase()) ||
          item.section.toLowerCase().includes(query.toLowerCase()),
      )
    : searchableContent;

  const handleSelect = (sectionId: string) => {
    setOpen(false);
    setQuery('');
    onResultClick(sectionId);
  };

  return (
    <>
      <Button
        variant='outline'
        className='relative w-full justify-start text-sm text-muted-foreground'
        onClick={() => setOpen(true)}>
        <Search className='mr-2 h-4 w-4' />
        <span>Search help topics...</span>
        <kbd className='pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex'>
          <span className='text-xs'>⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder='Search help topics...'
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading='Help Topics'>
            {filteredResults.map((result) => (
              <CommandItem
                key={result.id}
                value={result.id}
                onSelect={() => handleSelect(result.id)}>
                <div className='flex flex-col'>
                  <div className='font-medium'>{result.title}</div>
                  <div className='text-xs text-muted-foreground'>
                    {result.section} • {result.description}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
