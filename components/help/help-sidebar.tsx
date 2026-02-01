/** @format */

'use client';

import { cn } from '@/lib/utils';
import {
  BookOpen,
  Truck,
  Users,
  BarChart3,
  Bell,
  Settings,
  AlertTriangle,
  Code,
  Rocket,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface HelpSection {
  id: string;
  title: string;
  icon: React.ElementType;
  subsections?: {
    id: string;
    title: string;
  }[];
}

const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Rocket,
    subsections: [
      { id: 'first-login', title: 'First Login & Setup' },
      { id: 'dashboard-overview', title: 'Dashboard Overview' },
      { id: 'first-shipment', title: 'Creating Your First Shipment' },
    ],
  },
  {
    id: 'shipments',
    title: 'Shipments',
    icon: Truck,
    subsections: [
      { id: 'create-shipment', title: 'Creating Shipments' },
      { id: 'bulk-operations', title: 'Bulk Operations' },
      { id: 'tracking', title: 'Tracking & Auto-Sync' },
      { id: 'exceptions', title: 'Managing Exceptions' },
      { id: 'archiving', title: 'Archiving & Data Management' },
    ],
  },
  {
    id: 'leads',
    title: 'Leads',
    icon: UserPlus,
    subsections: [
      { id: 'create-lead', title: 'Creating Leads' },
      { id: 'lead-workflow', title: 'Lead Qualification' },
      { id: 'convert-lead', title: 'Converting to Shipments' },
      { id: 'lead-analytics', title: 'Lead Analytics' },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics & Reporting',
    icon: BarChart3,
    subsections: [
      { id: 'dashboard-metrics', title: 'Dashboard Metrics' },
      { id: 'shipment-analytics', title: 'Shipment Analytics' },
      { id: 'user-performance', title: 'User Performance' },
      { id: 'custom-reports', title: 'Custom Reports' },
    ],
  },
  {
    id: 'users',
    title: 'Users & Teams',
    icon: Users,
    subsections: [
      { id: 'roles-permissions', title: 'Roles & Permissions' },
      { id: 'invite-users', title: 'Inviting Team Members' },
      { id: 'tenant-management', title: 'Tenant Management' },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    subsections: [
      { id: 'email-setup', title: 'Email Configuration' },
      { id: 'webhooks', title: 'Webhook Setup' },
      { id: 'templates', title: 'Notification Templates' },
      { id: 'debugging', title: 'Debugging Issues' },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    subsections: [
      { id: 'profile', title: 'Profile Settings' },
      { id: 'api-keys', title: 'API Keys' },
      { id: 'integrations', title: 'Integrations' },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: AlertTriangle,
  },
  {
    id: 'api',
    title: 'API & Integrations',
    icon: Code,
  },
];

interface HelpSidebarProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  className?: string;
}

export function HelpSidebar({
  activeSection,
  onSectionChange,
  className,
}: HelpSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'getting-started',
  ]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId],
    );
  };

  return (
    <div className={cn('w-64 border-r bg-muted/30', className)}>
      <ScrollArea className='h-[calc(100vh-12rem)]'>
        <div className='space-y-1 p-4'>
          <div className='mb-4'>
            <h3 className='mb-2 px-2 text-lg font-semibold tracking-tight'>
              Help Topics
            </h3>
            <p className='px-2 text-xs text-muted-foreground'>
              Browse guides and tutorials
            </p>
          </div>

          {helpSections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections.includes(section.id);
            const isActive = activeSection === section.id;
            const hasSubsections =
              section.subsections && section.subsections.length > 0;

            return (
              <div key={section.id} className='space-y-1'>
                <Button
                  variant={isActive && !hasSubsections ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-2',
                    isActive && !hasSubsections && 'bg-secondary',
                  )}
                  onClick={() => {
                    if (hasSubsections) {
                      toggleSection(section.id);
                    } else {
                      onSectionChange(section.id);
                    }
                  }}>
                  <Icon className='h-4 w-4' />
                  <span className='flex-1 text-left'>{section.title}</span>
                  {hasSubsections && (
                    <svg
                      className={cn(
                        'h-4 w-4 transition-transform',
                        isExpanded && 'rotate-90',
                      )}
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 5l7 7-7 7'
                      />
                    </svg>
                  )}
                </Button>

                {hasSubsections && isExpanded && (
                  <div className='ml-6 space-y-1 border-l pl-2'>
                    {section.subsections!.map((subsection) => {
                      const isSubActive = activeSection === subsection.id;
                      return (
                        <Button
                          key={subsection.id}
                          variant={isSubActive ? 'secondary' : 'ghost'}
                          size='sm'
                          className={cn(
                            'w-full justify-start text-sm',
                            isSubActive && 'bg-secondary',
                          )}
                          onClick={() => onSectionChange(subsection.id)}>
                          {subsection.title}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
