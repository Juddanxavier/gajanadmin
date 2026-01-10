/** @format */

'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export async function getAnalyticsData(dateRange?: { from: Date; to: Date }) {
  const supabase = createAdminClient();

  try {
    console.log('[Analytics] Fetching data, date range:', dateRange);

    // Build date filter
    let query = supabase.from('shipments').select('*').is('deleted_at', null); // Exclude soft-deleted shipments

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());
    }

    const { data: shipments, error } = await query;

    if (error) {
      console.error('[Analytics] Query error:', error);
      throw error;
    }

    console.log('[Analytics] Found', shipments?.length || 0, 'shipments');

    // If no shipments, return empty data structure
    if (!shipments || shipments.length === 0) {
      return {
        success: true,
        data: {
          overview: {
            total: 0,
            delivered: 0,
            inTransit: 0,
            pending: 0,
            exception: 0,
            deliveryRate: 0,
            avgDeliveryTime: '0',
          },
          carrierPerformance: [],
          volumeData: [],
        },
      };
    }

    // Calculate metrics
    const total = shipments.length;
    const delivered = shipments.filter((s) => s.status === 'delivered').length;
    const inTransit = shipments.filter((s) => s.status === 'in_transit').length;
    const pending = shipments.filter((s) => s.status === 'pending').length;
    const exception = shipments.filter((s) => s.status === 'exception').length;

    // Delivery rate
    const deliveryRate =
      total > 0 ? ((delivered / total) * 100).toFixed(1) : '0';

    // Average delivery time (for delivered shipments)
    const deliveredShipments = shipments.filter(
      (s) => s.status === 'delivered' && s.created_at && s.updated_at
    );
    const avgDeliveryTime =
      deliveredShipments.length > 0
        ? deliveredShipments.reduce((sum, s) => {
            const created = new Date(s.created_at).getTime();
            const delivered = new Date(s.updated_at).getTime();
            return sum + (delivered - created);
          }, 0) /
          deliveredShipments.length /
          (1000 * 60 * 60 * 24) // Convert to days
        : 0;

    // Carrier performance
    const carrierStats = shipments.reduce((acc: any, s) => {
      const carrier = s.carrier_id || 'unknown';
      if (!acc[carrier]) {
        acc[carrier] = { total: 0, delivered: 0, exception: 0 };
      }
      acc[carrier].total++;
      if (s.status === 'delivered') acc[carrier].delivered++;
      if (s.status === 'exception') acc[carrier].exception++;
      return acc;
    }, {});

    const carrierPerformance = Object.entries(carrierStats).map(
      ([carrier, stats]: [string, any]) => ({
        carrier,
        total: stats.total,
        delivered: stats.delivered,
        exception: stats.exception,
        deliveryRate: ((stats.delivered / stats.total) * 100).toFixed(1),
      })
    );

    // Daily Trends (last 90 days or based on range)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const startDate = dateRange ? dateRange.from : ninetyDaysAgo;

    const dailyTrends = shipments
      .filter((s) => new Date(s.created_at) >= startDate)
      .reduce((acc: any, s) => {
        const date = new Date(s.created_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, total: 0, delivered: 0, exception: 0 };
        }
        acc[date].total++;
        if (s.status === 'delivered') acc[date].delivered++;
        if (s.status === 'exception') acc[date].exception++;
        return acc;
      }, {});

    const volumeData = Object.values(dailyTrends).sort((a: any, b: any) =>
      a.date.localeCompare(b.date)
    );

    console.log('[Analytics] Processed data:', {
      total,
      carrierCount: carrierPerformance.length,
      volumeDataPoints: volumeData.length,
    });

    return {
      success: true,
      data: {
        overview: {
          total,
          delivered,
          inTransit,
          pending,
          exception,
          deliveryRate: parseFloat(deliveryRate),
          avgDeliveryTime: avgDeliveryTime.toFixed(1),
        },
        carrierPerformance,
        volumeData,
      },
    };
  } catch (error: any) {
    console.error('[Analytics] Error:', error);
    return { success: false, error: error.message };
  }
}
