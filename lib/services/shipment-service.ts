/** @format */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  CreateShipmentParams,
  ShipmentProvider,
  TrackingResult,
  ShipmentStatus,
  Carrier,
  TrackingCheckpoint,
} from '@/lib/tracking/types';
import { Track123Provider } from '@/lib/tracking/providers/track123';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTrack123ApiKey } from '@/lib/settings/service';
import { env } from '@/lib/env';

export interface GetShipmentsParams {
  page?: number;
  pageSize?: number;
  filters?: {
    status?: string;
    provider?: string;
    search?: string;
    tenantIds?: string[];
  };
  sortBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export class ShipmentService {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client || createAdminClient();
  }

  private async getProvider(
    name: string = 'track123',
    tenantId?: string,
  ): Promise<ShipmentProvider> {
    switch (name) {
      case 'track123': {
        const apiKey = tenantId ? await getTrack123ApiKey(tenantId) : null;
        return new Track123Provider(apiKey || undefined);
      }
      default:
        throw new Error(`Provider ${name} not supported`);
    }
  }

  async createShipment(
    params: CreateShipmentParams & {
      userId?: string;
      invoiceDetails?: any;
      provider?: string;
    },
  ) {
    const providerName = params.provider || 'track123';

    // 1. Check for existing shipment (including soft-deleted)
    const { data: existing } = await this.client
      .from('shipments')
      .select('*')
      .eq('carrier_tracking_code', params.tracking_number)
      .eq('provider', providerName)
      .maybeSingle();

    if (existing) {
      if (existing.deleted_at) {
        console.log(
          `[ShipmentService] Restoring soft-deleted shipment ${params.tracking_number}`,
        );
        const { data: restored, error: restoreError } = await this.client
          .from('shipments')
          .update({
            deleted_at: null,
            updated_at: new Date().toISOString(),
            customer_details: {
              name: params.customer_name,
              email: params.customer_email,
              phone: params.customer_phone,
            },
            invoice_details: params.invoiceDetails,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (restoreError)
          throw new Error(
            `Failed to restore shipment: ${restoreError.message}`,
          );
        return restored;
      } else {
        console.log(
          `[ShipmentService] Shipment ${params.tracking_number} already exists (active).`,
        );
        throw new Error(
          `Tracking code ${params.tracking_number} already exists in the system.`,
        );
      }
    }

    const provider = await this.getProvider(providerName, params.tenantId);
    const trackingResult = await provider.createTracker(params);

    const { data: shipment, error } = await this.client
      .from('shipments')
      .insert({
        white_label_code: params.whiteLabelCode || `TRK-${Date.now()}`,
        carrier_tracking_code: params.tracking_number,
        carrier_id:
          trackingResult.carrier_code || params.carrier_code || 'unknown',
        provider: providerName,
        status: trackingResult.status,
        estimated_delivery: trackingResult.estimated_delivery,
        latest_location: trackingResult.latest_location,
        customer_details: {
          name: params.customer_name,
          email: params.customer_email,
          phone: params.customer_phone,
        },
        user_id: params.userId,
        tenant_id: params.tenantId,
        invoice_details: params.invoiceDetails,
        last_synced_at: new Date().toISOString(),
        raw_response: trackingResult.raw_response,
        origin_country: trackingResult.origin_country,
        destination_country: trackingResult.destination_country,
      })
      .select()
      .single();

    if (error) throw new Error(`DB Insert Error: ${error.message}`);

    if (trackingResult.checkpoints && trackingResult.checkpoints.length > 0) {
      await this.saveEvents(shipment.id, trackingResult.checkpoints);
    }

    // Trigger Initial Notification
    if (shipment) {
      try {
        const { NotificationService } =
          await import('@/lib/notifications/service');
        const notifier = new NotificationService();
        await notifier.notifyStatusChange({
          shipmentId: shipment.id,
          trackingCode: shipment.carrier_tracking_code,
          status: shipment.status,
          oldStatus: undefined, // New shipment
          customerName: shipment.customer_details?.name,
          customerEmail: shipment.customer_details?.email,
          customerPhone: shipment.customer_details?.phone,
          location: shipment.latest_location,
        });
      } catch (e) {
        console.error('Failed to trigger initial notification:', e);
      }
    }

    return shipment;
  }

  async getShipments({
    page = 1,
    pageSize = 10,
    filters = {},
    sortBy,
  }: GetShipmentsParams) {
    let query = this.client
      .from('shipments')
      .select('*, carrier:carriers(name_en, name_cn)', { count: 'exact' });

    // Exclude soft-deleted
    query = query.is('deleted_at', null);

    // Filters
    if (filters.tenantIds && filters.tenantIds.length > 0) {
      query = query.in('tenant_id', filters.tenantIds);
    }
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.provider) query = query.eq('provider', filters.provider);
    if (filters.search)
      query = query.ilike('carrier_tracking_code', `%${filters.search}%`);

    // Sorting
    if (sortBy) {
      query = query.order(sortBy.field, {
        ascending: sortBy.direction === 'asc',
      });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Pagination
    if (pageSize > 0) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      pageCount: pageSize > 0 ? Math.ceil((count || 0) / pageSize) : 1,
    };
  }

  async syncShipment(shipmentId: string, overrideCarrierCode?: string) {
    const { data: shipment, error } = await this.client
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .single();

    if (error || !shipment) throw new Error('Shipment not found');

    const provider = await this.getProvider(
      shipment.provider,
      shipment.tenant_id,
    );
    const carrierToUse = overrideCarrierCode || shipment.carrier_id;

    try {
      const result = await provider.getTracking(
        shipment.carrier_tracking_code,
        carrierToUse,
      );

      if (overrideCarrierCode) {
        result.carrier_code = overrideCarrierCode;
      }

      await this.updateShipmentFromTrackingResult(shipment.id, result);
      return result;
    } catch (e) {
      console.error(`Sync failed for ${shipment.carrier_tracking_code}`, e);
      throw e;
    }
  }

  async updateShipment(
    shipmentId: string,
    updates: Partial<CreateShipmentParams> & { status?: string },
  ) {
    const updatePayload: any = {};
    if (updates.carrier_code) updatePayload.carrier_id = updates.carrier_code;
    if (
      updates.customer_name ||
      updates.customer_email ||
      updates.customer_phone
    ) {
      updatePayload.customer_details = {
        name: updates.customer_name,
        email: updates.customer_email,
        phone: updates.customer_phone,
      };
    }
    if (updates.status) updatePayload.status = updates.status;

    const { data, error } = await this.client
      .from('shipments')
      .update(updatePayload)
      .eq('id', shipmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteShipment(shipmentId: string, soft = true) {
    if (soft) {
      const { error } = await this.client
        .from('shipments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', shipmentId);
      if (error) throw error;
    } else {
      // Get shipment details first to stop tracking
      const { data: shipment } = await this.client
        .from('shipments')
        .select('carrier_tracking_code, carrier_id, provider, tenant_id')
        .eq('id', shipmentId)
        .single();

      if (shipment) {
        try {
          const provider = await this.getProvider(
            shipment.provider,
            shipment.tenant_id,
          );
          if (provider.stopTracking) {
            await provider.stopTracking(
              shipment.carrier_tracking_code,
              shipment.carrier_id,
            );
          }
        } catch (e) {
          console.warn(
            `[ShipmentService] Failed to stop tracking remotely for ${shipment.carrier_tracking_code}`,
            e,
          );
          // Continue with local delete even if remote fails
        }
      }

      const { error } = await this.client
        .from('shipments')
        .delete()
        .eq('id', shipmentId);
      if (error) throw error;
    }
    return true;
  }

  async bulkDeleteShipments(shipmentIds: string[], soft = true) {
    if (!shipmentIds.length) return { success: [], failed: [] };

    const success = [];
    const failed = [];

    for (const id of shipmentIds) {
      try {
        await this.deleteShipment(id, soft);
        success.push(id);
      } catch (error) {
        console.error(`Failed to delete shipment ${id}:`, error);
        failed.push(id);
      }
    }
    return { success, failed };
  }

  async getStats(filters: { tenantIds?: string[] } = {}) {
    let query = this.client
      .from('shipments')
      .select('status, created_at, updated_at');

    query = query.is('deleted_at', null);
    if (filters.tenantIds && filters.tenantIds.length > 0) {
      query = query.in('tenant_id', filters.tenantIds);
    }

    const { data, error } = await query;
    if (error) throw error;

    const total = data.length;
    const pending = data.filter((s) =>
      ['pending', 'created', 'info_received'].includes(s.status),
    ).length;
    const in_transit = data.filter((s) =>
      ['in_transit', 'out_for_delivery'].includes(s.status),
    ).length;

    const deliveredShipments = data.filter((s) => s.status === 'delivered');
    const delivered = deliveredShipments.length;

    const exception = data.filter((s) =>
      ['exception', 'attempt_fail', 'expired'].includes(s.status),
    ).length;

    // Calculate Average Delivery Time (in days)
    let avgDeliveryDays = 0;
    if (delivered > 0) {
      const totalDurationMs = deliveredShipments.reduce((acc, s) => {
        const start = new Date(s.created_at).getTime();
        const end = new Date(s.updated_at).getTime(); // Approximation
        return acc + (end - start);
      }, 0);
      avgDeliveryDays = Math.round(
        totalDurationMs / delivered / (1000 * 60 * 60 * 24),
      );
    }

    return {
      total,
      pending,
      in_transit,
      delivered,
      exception,
      avgDeliveryDays,
    };
  }

  async searchCarriers(query: string = '') {
    const lowerQ = query.toLowerCase().trim();

    // 1. DB Search
    let dbQuery = this.client
      .from('carriers')
      .select('code, name_en, name_cn, homepage, logo_url');
    if (query.length >= 2) {
      dbQuery = dbQuery.or(
        `code.ilike.%${query}%,name_en.ilike.%${query}%,name_cn.ilike.%${query}%`,
      );
    }
    const { data: dbCarriers } = await dbQuery.limit(50);

    if (dbCarriers && dbCarriers.length > 0) {
      return dbCarriers.map((c) => ({
        code: c.code,
        name: c.name_en || c.name_cn || c.code,
        logo_url: c.logo_url,
      }));
    }

    // 2. API Fallback (simplified for now directly calling provider if needed)
    const provider = await this.getProvider('track123'); // Default provider for discovery
    const apiCarriers = await provider.getCarriers();

    return apiCarriers
      .filter(
        (c) =>
          !query ||
          c.code.toLowerCase().includes(lowerQ) ||
          c.name.toLowerCase().includes(lowerQ),
      )
      .slice(0, 50);
  }

  /**
   * Process webhook payload from Track123
   */
  async processWebhook(payload: any, tenantId?: string) {
    const { trackNo, transitStatus, transitSubStatus, localLogisticsInfo } =
      payload;

    if (!trackNo) {
      throw new Error('Missing tracking number in webhook payload');
    }

    // 1. Find the shipment
    let query = this.client
      .from('shipments')
      .select('id, tenant_id')
      .eq('carrier_tracking_code', trackNo); // Changed from tracking_number to carrier_tracking_code

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data: shipments, error } = await query;

    if (error) throw error;
    if (!shipments || shipments.length === 0) {
      console.warn(
        `[ShipmentService] No shipment found for tracking number: ${trackNo}`,
      );
      return null;
    }

    // If multiple shipments (e.g. across tenants if tenantId not provided), update all of them?
    // Or just the first one? Ideally tracking numbers are unique per carrier, but maybe not globally.
    // For now, update all matching shipments.

    const results = [];

    for (const shipment of shipments) {
      // Map status
      const status = this.mapStatus(transitStatus);

      // Map checkpoints
      const checkpoints: TrackingCheckpoint[] = (
        localLogisticsInfo?.trackingDetails || []
      )
        .map((detail: any) => ({
          occurred_at: detail.eventTime,
          status: this.mapStatus(detail.transitSubStatus || detail.eventDetail), // Fallback
          description: detail.eventDetail,
          location: detail.address,
          raw_status: detail.transitSubStatus,
        }))
        .sort(
          (a: any, b: any) =>
            new Date(b.occurred_at).getTime() -
            new Date(a.occurred_at).getTime(),
        );

      const trackingResult: TrackingResult = {
        tracking_number: trackNo,
        carrier_code: localLogisticsInfo?.courierCode || 'unknown',
        status,
        checkpoints: checkpoints,
        latest_location: checkpoints[0]?.location,
        estimated_delivery: payload.estimatedDelivery, // Might be in payload?
        raw_response: payload,
      };

      await this.updateShipmentFromTrackingResult(shipment.id, trackingResult);
      results.push({ id: shipment.id, status: 'updated' });
    }

    return results;
  }

  private mapStatus(status: string): ShipmentStatus {
    const statusMap: Record<string, ShipmentStatus> = {
      PENDING: 'pending',
      INFO_RECEIVED: 'info_received',
      IN_TRANSIT: 'in_transit',
      OUT_FOR_DELIVERY: 'out_for_delivery',
      ATTEMPT_FAIL: 'attempt_fail',
      DELIVERED: 'delivered',
      EXCEPTION: 'exception',
      EXPIRED: 'expired',
      InfoReceived: 'info_received',
      InTransit: 'in_transit',
      OutForDelivery: 'out_for_delivery',
      Delivered: 'delivered',
      Exception: 'exception',
      Fail: 'attempt_fail',
    };

    // Check direct match
    if (statusMap[status]) return statusMap[status];

    // Check uppercase match
    const upper = status?.toUpperCase();
    if (statusMap[upper]) return statusMap[upper];

    // Check partials
    if (upper?.includes('DELIVER')) return 'delivered';
    if (upper?.includes('TRANSIT')) return 'in_transit';
    if (upper?.includes('INFO')) return 'info_received';
    if (upper?.includes('EXCEPTION') || upper?.includes('RETURN'))
      return 'exception';
    if (upper?.includes('FAIL')) return 'attempt_fail';

    return 'pending'; // Default
  }

  // Private helpers
  private async updateShipmentFromTrackingResult(
    shipmentId: string,
    result: TrackingResult,
  ) {
    const { data: existing } = await this.client
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .single();

    if (!existing) throw new Error('Shipment not found');

    const updatePayload: any = {
      status: result.status,
      estimated_delivery: result.estimated_delivery,
      latest_location: result.latest_location,
      last_synced_at: new Date().toISOString(),
      raw_response: result.raw_response,
      origin_country: result.origin_country,
      destination_country: result.destination_country,
    };
    if (result.carrier_code) updatePayload.carrier_id = result.carrier_code;

    const { error } = await this.client
      .from('shipments')
      .update(updatePayload)
      .eq('id', shipmentId); // Updated_at trigger handles timestamp

    if (error) throw error;

    await this.saveEvents(shipmentId, result.checkpoints);

    // Notifications
    if (existing.status !== result.status) {
      // Dynamic import to break circular dependency
      const { NotificationService } =
        await import('@/lib/notifications/service');
      const notifier = new NotificationService();
      await notifier.notifyStatusChange({
        shipmentId: existing.id,
        trackingCode: existing.carrier_tracking_code,
        status: result.status,
        oldStatus: existing.status,
        customerName: existing.customer_details?.name,
        customerEmail: existing.customer_details?.email,
        customerPhone: existing.customer_details?.phone,
        location: result.latest_location || existing.latest_location,
      });
    }
  }

  private async saveEvents(shipmentId: string, checkpoints: any[]) {
    if (!checkpoints.length) return;
    for (const cp of checkpoints) {
      const { error } = await this.client.from('tracking_events').upsert(
        {
          shipment_id: shipmentId,
          status: cp.status || 'unknown',
          occurred_at: cp.occurred_at,
          location: cp.location,
          description: cp.description,
          raw_data: cp,
        },
        { onConflict: 'shipment_id, occurred_at, status' },
      );
      if (error) console.error('Upsert Event Error:', error);
    }
  }
  async getShipmentTrends(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.client
      .from('shipments')
      .select('created_at, status')
      .gte('created_at', startDate.toISOString())
      .is('deleted_at', null);

    if (error) throw error;

    // Group by date
    const trends: Record<
      string,
      { total: number; delivered: number; exception: number }
    > = {};

    // Initialize all days
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      trends[dateStr] = { total: 0, delivered: 0, exception: 0 };
    }

    data.forEach((s) => {
      const dateStr = s.created_at.split('T')[0];
      if (trends[dateStr]) {
        trends[dateStr].total++;
        if (s.status === 'delivered') trends[dateStr].delivered++;
        if (['exception', 'attempt_fail', 'expired'].includes(s.status))
          trends[dateStr].exception++;
      }
    });

    // Convert to array and sort
    return Object.entries(trends)
      .map(([date, stats]) => ({
        date,
        ...stats,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
