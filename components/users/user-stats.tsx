/** @format */

'use client';

import { Users, UserCheck, Shield, Building2 } from 'lucide-react';
import { UserStats } from '@/lib/types';
import { motion } from 'framer-motion';
import { StatCard } from '@/components/dashboard/stat-card';

interface UserStatsCardsProps {
  stats: UserStats;
  trendData?: {
    date?: string;
    totalUsers?: number;
    activeUsers?: number;
    admins?: number;
    tenants?: number;
  }[];
}

export function UserStatsCards({ stats, trendData = [] }: UserStatsCardsProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  // Define colors for stats
  const colors = [
    'text-chart-1',
    'text-chart-2',
    'text-chart-3',
    'text-chart-4',
  ];
  const chartColors = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
  ];

  const statCards = [
    {
      title: 'Total Users',
      value: stats.total.toString(),
      description: 'All registered users',
      icon: <Users className='h-4 w-4' />,
      color: colors[0],
      chartConfig: { totalUsers: { label: 'Total', color: chartColors[0] } },
      dataKey: 'totalUsers',
    },
    {
      title: 'Active Users',
      value: stats.active.toString(),
      description: 'Signed in last 30 days',
      icon: <UserCheck className='h-4 w-4' />,
      color: colors[1],
      chartConfig: { activeUsers: { label: 'Active', color: chartColors[1] } },
      dataKey: 'activeUsers',
    },
    {
      title: 'Admins',
      value: stats.byRole.admin.toString(),
      description: `${stats.byRole.staff} staff, ${stats.byRole.customer} customers`,
      icon: <Shield className='h-4 w-4' />,
      color: colors[2],
      chartConfig: { admins: { label: 'Admins', color: chartColors[2] } },
      dataKey: 'admins',
    },
    {
      title: 'By Tenant',
      value: Object.keys(stats.byTenant).length.toString(),
      description: 'Active tenants',
      icon: <Building2 className='h-4 w-4' />,
      color: colors[3],
      chartConfig: { tenants: { label: 'Tenants', color: chartColors[3] } },
      dataKey: 'tenants',
    },
  ];

  return (
    <motion.div
      variants={container}
      initial='hidden'
      animate='show'
      className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {statCards.map((stat) => (
        <motion.div key={stat.title} variants={item}>
          <StatCard
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            color={stat.color}
            trendData={trendData}
            chartConfig={stat.chartConfig}
            dataKey={stat.dataKey}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
