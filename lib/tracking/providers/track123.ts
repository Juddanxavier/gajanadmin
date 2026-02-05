/** @format */

import {
  ShipmentProvider,
  TrackingResult,
  CreateShipmentParams,
  ShipmentStatus,
  TrackingCheckpoint,
} from '../types';

export class Track123Provider implements ShipmentProvider {
  name = 'track123';
  private apiKey: string;
  private baseUrl = 'https://api.track123.com/gateway/open-api/tk/v2';

  constructor(apiKey?: string) {
    // Use provided API key, fallback to env, or empty string
    this.apiKey = apiKey || process.env.TRACK123_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Track123 API Key missing. Service will fail or mock.');
    }
  }

  /**
   * Set API key dynamically (useful for settings integration)
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      'Track123-Api-Secret': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Create Tracker (Import)
   * V2 Import API: POST /track/import
   */
  async createTracker(params: CreateShipmentParams): Promise<TrackingResult> {
    if (!this.apiKey) return this.mockResponse(params.tracking_number);

    try {
      const payload = [
        {
          trackNo: params.tracking_number,
          courierCode: params.carrier_code || null, // Auto-detect if null
        },
      ];

      // Use V2.1 for Import as requested
      const response = await fetch(
        `${this.baseUrl.replace('v2', 'v2.1')}/track/import`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        // Parse error if possible
        const errText = await response.text();
        throw new Error(
          `Track123 Import Error (${response.status}): ${errText}`,
        );
      }

      const data = await response.json();
      // Structure: { code: '00000', data: { accepted: [], rejected: [] }, msg: 'Success' }

      // Check Accepted
      const accepted = data.data?.accepted?.[0];
      if (accepted) {
        // Successfully created. Now fetch details to get initial state.
        return this.getTracking(accepted.trackNo, accepted.courierCode);
      }

      // Check Rejected
      const rejected = data.data?.rejected?.[0];
      if (rejected) {
        // "Already Exists" check. undefined error codes, but we assume we should try to fetch.
        // If fetch succeeds, checking "Already Exists" was correct.
        // If fetch fails, then it was a real rejection.
        console.warn(
          `[Track123] Import rejected for ${params.tracking_number}. Trying to fetch details...`,
          rejected,
        );
        try {
          return await this.getTracking(
            params.tracking_number,
            rejected.courierCode || params.carrier_code,
          );
        } catch (e) {
          throw new Error(
            `Track123 Import Failed: ${JSON.stringify(rejected)} (Sync failed: ${e})`,
          );
        }
      }

      throw new Error(`Track123 Unknown Response: ${JSON.stringify(data)}`);
    } catch (error) {
      console.error('Track123 createTracker failed:', error);
      throw error;
    }
  }

  /**
   * Stop Tracking (Delete)
   * V2 Delete API: POST /track/delete
   */
  async stopTracking(
    tracking_number: string,
    carrier_code?: string,
  ): Promise<boolean> {
    if (!this.apiKey) return true;

    try {
      const payload = [
        {
          trackNo: tracking_number,
          courierCode: carrier_code,
        },
      ];

      console.log(`[Track123] Deleting with payload:`, JSON.stringify(payload));

      const response = await fetch(
        `${this.baseUrl.replace('v2', 'v2.1')}/track/delete`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[Track123] Stop tracking failed: ${errText}`);
        return false;
      }

      const data = await response.json();
      // Log success/failure from provider
      if (data?.code === 0 || data?.msg?.toLowerCase() === 'success') {
        console.log(
          `[Track123] Successfully deleted tracking for ${tracking_number}`,
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('[Track123] stopTracking error:', error);
      return false;
    }
  }

  /**
   * Get Tracking Details
   * V2 Query API: POST /track/query
   */
  async getTracking(
    tracking_number: string,
    carrier_code?: string,
    _retry = false,
  ): Promise<TrackingResult> {
    if (!this.apiKey) return this.mockResponse(tracking_number);

    try {
      // Treat 'unknown' as null to allow auto-detection or generic search
      const cleanCarrier =
        carrier_code === 'unknown' || !carrier_code ? null : carrier_code;

      const payload = {
        trackNoInfos: [
          {
            trackNo: tracking_number,
            courierCode: cleanCarrier,
          },
        ],
      };

      const response = await fetch(`${this.baseUrl}/track/query`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok)
        throw new Error(`Track123 Query Error: ${response.statusText}`);

      const data = await response.json();

      // The V2 Query response is typically data.data.list[]
      const trackingData =
        data.data?.list?.[0] || data.data?.accepted?.content?.[0];

      if (!trackingData) {
        // Check Rejections for Auto-Import logic
        const rejected = data.data?.rejected?.[0] || data.data?.rejected; // sometimes array, sometimes object?

        if (rejected) {
          const errCode = rejected.error?.code;
          // A0400 = Not Registered / Not Found
          if (errCode === 'A0400' && !_retry) {
            console.log(
              `[Track123] Tracking ${tracking_number} not registered. Attempting auto-import...`,
            );

            // Attempt Import
            try {
              await this.createTracker({
                tracking_number,
                carrier_code: cleanCarrier || undefined,
              });
              // Retry Fetch
              return this.getTracking(tracking_number, carrier_code, true);
            } catch (importErr) {
              console.error('[Track123] Auto-import failed:', importErr);
              // Fall through to throw original error
            }
          }
        }

        throw new Error(
          `Track123 Get Error: Not Found (Request: ${tracking_number}/${cleanCarrier}, Response: ${JSON.stringify(data)})`,
        );
      }

      return this.normalizeResponse(trackingData);
    } catch (error) {
      console.error('Track123 getTracking failed:', error);
      throw error;
    }
  }

  private normalizeResponse(data: any): TrackingResult {
    const t = data.tracking || data; // Adapt based on exact structure

    // Debug logging
    console.log(
      '[Track123] Normalizing response. Top-level keys:',
      Object.keys(data),
    );

    // Checkpoints - Try multiple locations including inside localLogisticsInfo
    let rawCheckpoints = data.checkpoints || data.trackingDetails || [];

    // If not found in root, check localLogisticsInfo
    // Handle localLogisticsInfo whether it's an array or object
    let logisticsInfo = data.localLogisticsInfo;
    if (Array.isArray(logisticsInfo)) {
      // If array, grab the first one or iterate? Usually strictly an object in V2 query listing but checking to be safe
      logisticsInfo = logisticsInfo.length > 0 ? logisticsInfo[0] : null;
    }

    if (
      logisticsInfo &&
      logisticsInfo.trackingDetails &&
      Array.isArray(logisticsInfo.trackingDetails)
    ) {
      rawCheckpoints = logisticsInfo.trackingDetails;
    }

    const checkpoints: TrackingCheckpoint[] = rawCheckpoints.map((cp: any) => ({
      occurred_at:
        cp.created_at ||
        cp.time ||
        cp.trackingTime ||
        cp.eventTime ||
        new Date().toISOString(),
      location: cp.location || cp.city || cp.trackingLocation || cp.address,
      description:
        cp.message || cp.status_name || cp.trackingStatus || cp.eventDetail,
      status: this.mapStatus(
        cp.status || cp.trackingStatus || cp.transitSubStatus || cp.eventDetail,
      ),
      raw_status: cp.status || cp.trackingStatus || cp.transitSubStatus,
    }));

    console.log('[Track123] Checkpoints found:', checkpoints.length);

    // Sort descending (newest first)
    checkpoints.sort(
      (a, b) =>
        new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
    );

    // Robust extraction for Carrier and Status
    const carrierCode =
      t.carrier_code ||
      data.courierCode ||
      data.CourierCode ||
      data.carrierId ||
      logisticsInfo?.courierCode ||
      '';

    // Status extraction: Prioritize transitStatus (most detailed) -> trackingStatus -> status
    let status = this.mapStatus(
      data.transitStatus ||
        data.trackingStatus ||
        data.status ||
        data.trackStatus,
    );
    if (status === 'pending' && checkpoints.length > 0) {
      // If main status is pending/unknown but we have checkpoints, use the latest one
      status = checkpoints[0].status;
    }

    // Extract latest location from localLogisticsInfo or shipTo
    let latestLocation = null;
    if (logisticsInfo) {
      latestLocation =
        logisticsInfo.location ||
        logisticsInfo.city ||
        logisticsInfo.trackingLocation;

      // If location is missing in root of logisticsInfo, try the latest checkpoint from trackingDetails
      if (!latestLocation && checkpoints.length > 0) {
        latestLocation = checkpoints[0].location;
      }
    }

    if (!latestLocation && checkpoints.length > 0) {
      latestLocation = checkpoints[0].location;
    } else if (data.shipTo) {
      // Fallback to destination
      latestLocation = data.shipTo;
    }

    // Extract estimated delivery - Track123 uses deliveredTime for actual delivery
    // For estimated, we might need to use a different field or calculate
    const estimatedDelivery =
      data.estimatedDeliveryTime ||
      data.expectedDeliveryTime ||
      data.deliveredTime ||
      data.expected_delivery ||
      data.estimatedDelivery ||
      data.eta;

    console.log('[Track123] Extracted data:', {
      estimatedDelivery,
      latestLocation,
      status,
      carrierCode,
      shipFrom: data.shipFrom,
      shipTo: data.shipTo,
    });

    // Extract Country Codes
    // shipFrom/shipTo are typically objects like { country_code: "CN", city: "..." } or simple strings
    // If strings, we can't reliably get code. If object, we try.
    const getCountry = (loc: any) => {
      if (!loc) return undefined;
      if (typeof loc === 'string') return undefined; // Can't guess code from string easily without map
      return (
        loc.country_iso2 || loc.country_code || loc.countryCode || undefined
      );
    };

    const originCountry = getCountry(data.shipFrom) || data.originCountryCode;
    const destCountry = getCountry(data.shipTo) || data.destinationCountryCode;

    return {
      tracking_number: t.tracking_number || data.trackNo || '',
      carrier_code: carrierCode,
      status: status,
      estimated_delivery: estimatedDelivery,
      latest_location: latestLocation || undefined,
      checkpoints,
      origin_country: originCountry,
      destination_country: destCountry,
      // Store full API response for timeline and detailed tracking
      raw_response: {
        ...data, // Full API response
        synced_at: new Date().toISOString(),
        api_version: 'v2',
      },
    };
  }

  async getCarriers(): Promise<import('../types').Carrier[]> {
    if (!this.apiKey) return [];

    try {
      // Confirmed Endpoint: GET v2.1/courier/list (User req)
      const response = await fetch(
        `${this.baseUrl.replace('v2', 'v2.1')}/courier/list`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        },
      );

      if (!response.ok)
        throw new Error(`Track123 List Carriers Error: ${response.statusText}`);

      const data = await response.json();
      const list = data.data || [];

      return list.map((c: any) => ({
        code: c.courierCode,
        name: c.courierNameEN || c.courierNameCN || c.courierCode,
      }));
    } catch (error) {
      console.error('Track123 getCarriers failed:', error);
      return [];
    }
  }

  private mapStatus(raw: string): ShipmentStatus {
    const s = (raw || '').toLowerCase();
    if (s.includes('delivered')) return 'delivered';
    if (s.includes('transit')) return 'in_transit';
    if (s.includes('pending')) return 'pending';
    if (s.includes('info')) return 'info_received';
    if (s.includes('fail')) return 'attempt_fail';
    if (s.includes('exception')) return 'exception';
    if (s.includes('expired')) return 'expired';
    if (s.includes('out')) return 'out_for_delivery';
    if (s.includes('no_record') || s === 'no_record') return 'pending';
    return 'pending'; // Default
  }

  private mockResponse(tracking_number: string): TrackingResult {
    return {
      tracking_number,
      carrier_code: 'mock-carrier',
      status: 'in_transit',
      checkpoints: [
        {
          occurred_at: new Date().toISOString(),
          status: 'in_transit',
          description: 'Mock Update',
          location: 'Test City',
        },
      ],
      raw_response: { mock: true },
    };
  }
}
