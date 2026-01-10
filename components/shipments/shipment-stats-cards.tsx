/** @format */

'use client';

import {
  Package,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Truck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { StatCard } from '@/components/dashboard/stat-card';

interface ShipmentStatsCardsProps {
  stats: {
    total: number;
    delivered: number;
    inTransit: number;
    pending: number;
    exception: number;
    deliveryRate: number;
    avgDeliveryTime: number;
  };
  trendData?: {
    date: string;
    total: number;
    delivered: number;
    exception: number;
  }[];
}

export function ShipmentStatsCards({
  stats,
  trendData = [],
}: ShipmentStatsCardsProps) {
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
    'text-chart-5',
    'text-destructive',
  ];
  const chartColors = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-5)',
    'var(--destructive)',
  ];

  const statCards = [
    {
      title: 'Total Shipments',
      value: stats.total.toString(),
      description: 'All time shipments',
      icon: <Package className='h-4 w-4' />,
      color: colors[0],
      chartConfig: { total: { label: 'Total', color: chartColors[0] } },
      dataKey: 'total',
    },
    {
      title: 'Delivered',
      value: stats.delivered.toString(),
      description: `${stats.deliveryRate}% success rate`,
      icon: <CheckCircle2 className='h-4 w-4' />,
      color: colors[1],
      chartConfig: { delivered: { label: 'Delivered', color: chartColors[1] } },
      dataKey: 'delivered',
    },
    {
      title: 'In Transit',
      value: stats.inTransit.toString(),
      description: 'Currently shipping',
      icon: <Truck className='h-4 w-4' />,
      color: colors[2],
      chartConfig: { total: { label: 'In Transit', color: chartColors[2] } },
      dataKey: 'total',
    },
    {
      title: 'Exceptions',
      value: stats.exception.toString(),
      description: 'Attention needed',
      icon: <AlertTriangle className='h-4 w-4' />,
      color: colors[3],
      chartConfig: {
        exception: { label: 'Exceptions', color: chartColors[3] },
      },
      dataKey: 'exception',
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
