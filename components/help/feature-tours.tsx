/** @format */

'use client';

import { useEffect, useRef } from 'react';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { Button } from '@/components/ui/button';
import { PlayCircle } from 'lucide-react';

interface FeatureTourProps {
  feature: 'shipments' | 'leads' | 'analytics' | 'settings' | 'users';
}

const tourConfigs: Record<string, DriveStep[]> = {
  shipments: [
    {
      element: '[data-tour="create-shipment"]',
      popover: {
        title: 'Create Your First Shipment',
        description: 'Click here to start tracking a new package.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tour="bulk-import"]',
      popover: {
        title: 'Bulk Import',
        description: 'Have many shipments? Import them all at once via CSV.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tour="shipment-filters"]',
      popover: {
        title: 'Filter & Search',
        description: 'Find specific shipments by status, carrier, or customer.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="shipment-table"]',
      popover: {
        title: 'Shipment List',
        description: 'View and manage all your active shipments here.',
        side: 'top',
        align: 'center',
      },
    },
  ],
  leads: [
    {
      element: '[data-tour="create-lead"]',
      popover: {
        title: 'Add New Lead',
        description: 'Manually add a potential customer to your pipeline.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tour="kanban-view"]',
      popover: {
        title: 'Pipeline View',
        description:
          'Visualize your sales process and drag leads between stages.',
        side: 'bottom',
        align: 'start',
      },
    },
  ],
  // Add more configurations as needed
};

export function FeatureTourButton({ feature }: FeatureTourProps) {
  const driverObj = useRef<any>(null);

  const startTour = () => {
    const steps = tourConfigs[feature];
    if (!steps) return;

    driverObj.current = driver({
      showProgress: true,
      animate: true,
      steps: steps,
    });

    driverObj.current.drive();
  };

  return (
    <Button
      onClick={startTour}
      variant='outline'
      size='sm'
      className='gap-2 hidden md:flex'>
      <PlayCircle size={14} />
      Take Tour
    </Button>
  );
}
