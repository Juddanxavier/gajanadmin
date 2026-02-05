/** @format */

import {
  LayoutDashboard,
  Users,
  Settings,
  Truck,
  BarChart3,
  Bell,
  ShoppingBag,
  Activity,
  Target,
  Mail,
  FileText,
} from 'lucide-react';

export interface NavigationItem {
  title: string;
  href: string;
  icon: any;
  children?: {
    title: string;
    href: string;
    icon?: any;
  }[];
  badge?: boolean | string | number;
}

export interface SidebarGroup {
  label?: string;
  items: NavigationItem[];
}

export const sidebarGroups: SidebarGroup[] = [
  {
    label: 'Main',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'Shipments',
        href: '/shipments',
        icon: Truck,
      },
      {
        title: 'Leads',
        href: '/leads',
        icon: ShoppingBag,
      },
      {
        title: 'Users',
        href: '/users',
        icon: Users,
      },
    ],
  },
  {
    label: 'Analytics',
    items: [
      {
        title: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
      },
    ],
  },
  {
    label: 'Communication',
    items: [
      {
        title: 'Notifications',
        href: '/notifications',
        icon: Bell,
        badge: true, // Enable dynamic badge
        children: [
          {
            title: 'Overview',
            href: '/notifications',
            icon: LayoutDashboard,
          },
          {
            title: 'Email Setup',
            href: '/notifications/email-setup',
            icon: Mail,
          },
          {
            title: 'Logs',
            href: '/notifications/logs',
            icon: FileText,
          },
          {
            title: 'Settings',
            href: '/notifications/settings',
            icon: Settings,
          },
        ],
      },
    ],
  },
  {
    items: [
      {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
      },
      {
        title: 'Help & Support',
        href: '/help',
        icon: FileText,
      },
    ],
  },
];
