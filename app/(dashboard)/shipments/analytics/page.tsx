/** @format */

'use client';

import { useEffect, useState } from 'react';
import { getAnalyticsData } from './actions';
import { ShipmentStatsCards } from '@/components/shipments/shipment-stats-cards';
import { ShipmentTrendsChart } from '@/components/dashboard/shipment-trends-chart';
import Loading from '@/app/(dashboard)/analytics/loading';
import {
  generateMockShipmentTrends,
  generateMockShipmentStats,
} from '@/lib/utils/mock-data-generator';

export default function ShipmentAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Check if mock data is enabled
      const useMockData = localStorage.getItem('use-mock-data') === 'true';

      if (useMockData) {
        // Use mock data
        const mockData = {
          overview: generateMockShipmentStats(),
          volumeData: generateMockShipmentTrends(90),
        };
        console.log('Using mock data:', mockData);
        setData(mockData);
      } else {
        // Use real data
        const result = await getAnalyticsData();
        console.log('Analytics Result:', result);
        if (result.success && result.data) {
          console.log('Setting data:', result.data);
          setData(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to load shipment analytics', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!data) {
    return (
      <div className='p-8 text-center text-muted-foreground'>
        No data available
      </div>
    );
  }

  const { overview, volumeData } = data;
  console.log('Extracted data:', { overview, volumeData });

  // Generate mock trend data if we don't have enough real data
  const getTrendData = () => {
    if (volumeData && volumeData.length >= 7) {
      return volumeData;
    }

    // Generate 30 days of mock data for visualization
    const mockData = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Generate realistic-looking trend data
      const baseTotal = Math.floor(Math.random() * 10) + 5;
      const delivered = Math.floor(baseTotal * (0.7 + Math.random() * 0.2));
      const exception = Math.floor(Math.random() * 2);

      mockData.push({
        date: dateStr,
        total: baseTotal,
        delivered: delivered,
        exception: exception,
      });
    }

    return mockData;
  };

  const trendData = getTrendData();

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>
          Shipment Analytics
        </h1>
        <p className='text-muted-foreground'>
          Shipment performance and delivery metrics
        </p>
      </div>

      {overview && (
        <ShipmentStatsCards stats={overview} trendData={trendData} />
      )}

      <div className='w-full'>
        <ShipmentTrendsChart data={trendData} />
      </div>
    </div>
  );
}
