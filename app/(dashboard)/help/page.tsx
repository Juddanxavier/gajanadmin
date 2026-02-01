/** @format */

'use client';

import { useState } from 'react';
import { HelpSidebar } from '@/components/help/help-sidebar';
import { HelpSearch } from '@/components/help/help-search';
import { ProductTour } from '@/components/help/product-tour';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { MessageSquare, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

// Guides
import { GettingStartedGuide } from '@/components/help/guides/getting-started-guide';
import { ShipmentsGuide } from '@/components/help/guides/shipments-guide';
import { LeadsGuide } from '@/components/help/guides/leads-guide';
import { AnalyticsGuide } from '@/components/help/guides/analytics-guide';
import { UsersGuide } from '@/components/help/guides/users-guide';
import { NotificationsGuide } from '@/components/help/guides/notifications-guide';
import { SettingsGuide } from '@/components/help/guides/settings-guide';
import { TroubleshootingGuide } from '@/components/help/guides/troubleshooting-guide';

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Map section IDs to components
  const renderContent = () => {
    switch (activeSection) {
      case 'getting-started':
      case 'first-login':
      case 'dashboard-overview':
      case 'first-shipment':
        return <GettingStartedGuide />;
      case 'shipments':
      case 'create-shipment':
      case 'bulk-operations':
      case 'tracking':
      case 'exceptions':
      case 'archiving':
        return <ShipmentsGuide />;
      case 'leads':
      case 'create-lead':
      case 'lead-workflow':
      case 'convert-lead':
      case 'lead-analytics':
        return <LeadsGuide />;
      case 'analytics':
      case 'dashboard-metrics':
      case 'shipment-analytics':
      case 'user-performance':
      case 'custom-reports':
        return <AnalyticsGuide />;
      case 'users':
      case 'roles-permissions':
      case 'invite-users':
      case 'tenant-management':
        return <UsersGuide />;
      case 'notifications':
      case 'email-setup':
      case 'webhooks':
      case 'templates':
      case 'debugging':
        return <NotificationsGuide />;
      case 'settings':
      case 'profile':
      case 'api-keys':
      case 'integrations':
        return <SettingsGuide />;
      case 'troubleshooting':
        return <TroubleshootingGuide />;
      default:
        return <GettingStartedGuide />;
    }
  };

  const getSectionTitle = (id: string) => {
    const titles: Record<string, string> = {
      'getting-started': 'Getting Started',
      shipments: 'Shipments',
      leads: 'Leads',
      analytics: 'Analytics',
      users: 'Users & Teams',
      notifications: 'Notifications',
      settings: 'Settings',
      troubleshooting: 'Troubleshooting',
    };

    // Check main sections first
    if (titles[id]) return titles[id];

    // Check specific subsections mapping (simplified for breadcrumb)
    const subsectionMap: Record<string, string> = {
      'first-login': 'Getting Started',
      'dashboard-overview': 'Getting Started',
      'first-shipment': 'Getting Started',
      'create-shipment': 'Shipments',
      'bulk-operations': 'Shipments',
      tracking: 'Shipments',
      exceptions: 'Shipments',
      archiving: 'Shipments',
      'create-lead': 'Leads',
      'lead-workflow': 'Leads',
      'convert-lead': 'Leads',
      'lead-analytics': 'Leads',
      'dashboard-metrics': 'Analytics',
      'shipment-analytics': 'Analytics',
      'user-performance': 'Analytics',
      'custom-reports': 'Analytics',
      'roles-permissions': 'Users & Teams',
      'invite-users': 'Users & Teams',
      'tenant-management': 'Users & Teams',
      'email-setup': 'Notifications',
      webhooks: 'Notifications',
      templates: 'Notifications',
      debugging: 'Notifications',
      profile: 'Settings',
      'api-keys': 'Settings',
      integrations: 'Settings',
    };

    return subsectionMap[id] || 'Guide';
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className='flex flex-col h-[calc(100vh-4rem)]'>
      {/* Header */}
      <header className='flex items-center justify-between border-b px-6 py-3 bg-background'>
        <div className='flex items-center gap-4'>
          {/* Mobile Menu Trigger */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant='ghost' size='icon' className='md:hidden'>
                <Menu className='h-5 w-5' />
              </Button>
            </SheetTrigger>
            <SheetContent side='left' className='p-0 w-80'>
              <HelpSidebar
                activeSection={activeSection}
                onSectionChange={handleSectionChange}
                className='w-full border-none'
              />
            </SheetContent>
          </Sheet>

          <Breadcrumb className='hidden sm:block'>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href='/dashboard'>Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href='/help'>Help Center</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {getSectionTitle(activeSection)}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className='flex items-center gap-3 w-full max-w-md md:w-auto'>
          <div className='w-full md:w-64'>
            <HelpSearch onResultClick={handleSectionChange} />
          </div>
          <div className='hidden md:block'>
            <ProductTour />
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Sidebar - Desktop */}
        <aside className='hidden md:block'>
          <HelpSidebar
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            className='h-full'
          />
        </aside>

        {/* Content Area */}
        <main className='flex-1 overflow-y-auto p-6 md:p-8 bg-background'>
          <div className='max-w-4xl mx-auto'>
            {renderContent()}

            <div className='mt-12 pt-8 border-t flex items-center justify-between'>
              <div className='text-sm text-muted-foreground'>
                Can't find what you're looking for?
              </div>
              <Button variant='link' className='gap-2'>
                <MessageSquare className='h-4 w-4' /> Contact Support
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
