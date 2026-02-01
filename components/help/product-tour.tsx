/** @format */

'use client';

import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { Button } from '@/components/ui/button';
import { PlayCircle } from 'lucide-react';

export function ProductTour() {
  const driverObj = useRef<any>(null);

  useEffect(() => {
    driverObj.current = driver({
      showProgress: true,
      animate: true,
      steps: [
        {
          element: 'aside',
          popover: {
            title: 'Welcome to GT Express!',
            description:
              'This sidebar is your main navigation hub. Access Shipments, Leads, Analytics, and Settings from here.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '[href="/dashboard"]',
          popover: {
            title: 'Dashboard',
            description:
              'Your command center. View real-time metrics, active shipments, and performance trends at a glance.',
            side: 'right',
            align: 'center',
          },
        },
        {
          element: '[href="/shipments"]',
          popover: {
            title: 'Shipments Management',
            description:
              'Track and manage all your deliveries. Create new shipments, import in bulk, and monitor statuses.',
            side: 'right',
            align: 'center',
          },
        },
        {
          element: '[href="/leads"]',
          popover: {
            title: 'Lead Pipeline',
            description:
              'Manage potential customers and convert them into active shipments using our lead workflow.',
            side: 'right',
            align: 'center',
          },
        },
        {
          element: '[href="/analytics"]',
          popover: {
            title: 'Analytics',
            description:
              'Deep dive into your data. Analyze delivery performance, user productivity, and shipping costs.',
            side: 'right',
            align: 'center',
          },
        },
        {
          element: '[data-tour="search-bar"]',
          popover: {
            title: 'Global Search',
            description:
              'Quickly find users, tracking numbers, or lead details from anywhere in the app.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '[data-tour="notifications"]',
          popover: {
            title: 'Notifications',
            description:
              'Stay updated with alerts for tracking updates, system messages, and mentions.',
            side: 'bottom',
            align: 'end',
          },
        },
        {
          element: '[data-tour="profile-menu"]',
          popover: {
            title: 'Your Profile',
            description:
              'Manage your account settings, switch tenants, or toggle dark mode.',
            side: 'left',
            align: 'start',
          },
        },
        {
          element: '[href="/help"]',
          popover: {
            title: 'Help Center',
            description:
              'Stuck? Come back here anytime for guides, tutorials, and support.',
            side: 'right',
            align: 'center',
          },
        },
      ],
    });
  }, []);

  const startTour = () => {
    if (driverObj.current) {
      driverObj.current.drive();
    }
  };

  return (
    <Button onClick={startTour} className='gap-2'>
      <PlayCircle size={16} />
      Start Interactive Tour
    </Button>
  );
}
