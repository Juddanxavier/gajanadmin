/** @format */

import {
  Track123Config,
  Track123Error,
  CarrierDetectionResult,
  CarrierDetectionItem,
  CreateTrackingParams,
  TrackingResponse,
  TrackingData,
} from '@/lib/types/track123';
import { logger } from '@/lib/logger';

export class Track123Service {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: Track123Config) {
    this.apiKey = config.apiKey;
    this.baseUrl =
      config.baseUrl || 'https://api.track123.com/gateway/open-api/tk/v2.1';
  }

  /**
   * Helper to make HTTP requests
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      logger.info('Track123 Request', { method, url, body });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Track123-Api-Secret': this.apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      // Validating content type to prevent HTML error pages breaking JSON parse
      // Validating content type
      const contentType = response.headers.get('content-type');
      const text = await response.text();

      if (
        endpoint.includes('/track/query') ||
        endpoint.includes('/track/import')
      ) {
        logger.info(`Track123 Raw Response [${endpoint}]:`, { text });
      }

      let data: any;
      try {
        data = JSON.parse(text);
      } catch (e) {
        logger.error('Track123 JSON Parse Error', { text });
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(
            `Track123 API returned non-JSON (${response.status}): ${text.substring(0, 100)}`,
          );
        }
        throw new Error('Failed to parse Track123 response');
      }

      const contentTypeSafe = data; // use parsed data
      // const data = contentTypeSafe as any; // Removed redeclaration

      // DEBUG LOGGING
      if (
        endpoint.includes('/track/query') ||
        endpoint.includes('/track/import')
      ) {
        logger.info(
          `Track123 Response [${endpoint}]:`,
          JSON.stringify(data, null, 2),
        );
      }

      // Track123 specific error handling (code != 0 and != 200)
      // Parse code to int to handle "00000" or "200" strings
      const code = parseInt(String(data.code), 10);

      if (!isNaN(code) && code !== 0 && code !== 200) {
        logger.warn('Track123 API Error Code', { data });
        let msg = data.msg || data.message || 'Unknown Track123 Error';

        // Fix for weird API behavior where error msg is "Success"
        if (msg === 'Success') {
          msg = `API Error (Code: ${data.code})`;
        }

        throw new Error(msg);
      }

      return data as T;
    } catch (error: any) {
      logger.error('Track123 API Exception', {
        message: error.message || error,
      });
      throw error;
    }
  }

  /**
   * Detect carrier for a tracking number
   * Endpoint: /courier/detection
   */
  async detectCarrier(trackingNumber: string): Promise<CarrierDetectionItem[]> {
    const response = await this.makeRequest<CarrierDetectionResult>(
      '/courier/detection',
      'POST',
      { tracking_number: trackingNumber },
    );

    // Transform the object response to the expected array format
    const resultData = response.data;
    const items: CarrierDetectionItem[] = [];

    if (
      resultData &&
      typeof resultData === 'object' &&
      !Array.isArray(resultData)
    ) {
      // Add recommended carrier first
      if (resultData.recommended_carrier) {
        items.push({
          courier_code: resultData.recommended_carrier.carrier,
          courier_name: resultData.recommended_carrier.carrier, // Use code as name fallback
        });
      }

      // Add candidates
      if (Array.isArray(resultData.candidates)) {
        resultData.candidates.forEach((c) => {
          // Avoid duplicates
          if (c.carrier !== resultData.recommended_carrier?.carrier) {
            items.push({
              courier_code: c.carrier,
              courier_name: c.carrier,
            });
          }
        });
      }
    } else if (Array.isArray(resultData)) {
      // Handle legacy array format if any
      return resultData;
    }

    return items;
  }

  /**
   * Create (import) a new tracking item
   * Endpoint: /track/import
   */
  async createTracking(
    params: CreateTrackingParams,
  ): Promise<TrackingResponse> {
    // The API expects an array of trackings
    const payload = [
      {
        trackNo: params.tracking_number,
        courierCode: params.carrier_code,
        // Optional fields if needed
        // customerEmail: params.customer_email,
        // ...
      },
    ];

    return this.makeRequest<TrackingResponse>('/track/import', 'POST', payload);
  }

  /**
   * Get Tracking Information
   * Endpoint: /track/query
   */
  async getTrackingResults(trackingNumbers: string[]): Promise<TrackingData[]> {
    const response = await this.makeRequest<any>('/track/query', 'POST', {
      trackNos: trackingNumbers,
    });

    // Response structure: { code: "00000", data: [ ...items ] } or just items?
    // Guide example shows request. Let's assume response follows standard data format.
    // Usually data is an array of tracking objects.

    let items: any[] = [];

    // Check for nested structure: data.accepted.content
    if (
      response?.data?.accepted?.content &&
      Array.isArray(response.data.accepted.content)
    ) {
      items = response.data.accepted.content;
    } else if (response && Array.isArray(response.data)) {
      items = response.data;
    } else if (Array.isArray(response)) {
      items = response; // Legacy fallback
    }

    return items.map((item) => ({
      ...item, // Spread raw data so we have everything
      tracking_number: item.trackNo,
      courier_code: item.courierCode,
      status: item.transitStatus || item.status || 'pending',
      sub_status: item.transitSubStatus,
      original_country: item.shipFrom,
      destination_country: item.shipTo,
      created_at: item.createTime,
      updated_at: item.nextUpdateTime, // or lastTrackingTime
      latest_event: item.latestEvent, // need to verify field name
      latest_checkpoint_time: item.lastTrackingTime,
    }));
  }

  /**
   * List all supported couriers
   * Endpoint: /courier/list
   */
  async listCouriers(): Promise<CarrierDetectionItem[]> {
    const response = await this.makeRequest<any>('/courier/list', 'GET');

    // Response might be { code: 200, data: [...] } or just [...]
    // makeRequest unwraps .data usually? No, makeRequest returns "data as T".
    // If API returns { code: 200, msg: "Success", data: [...] }, makeRequest returns that whole object as T.
    // Wait, let's check makeRequest.
    // It returns `data` (which is response.json()).

    // Let's assume normalized response:
    // { code: 200, data: [ { carrier: "usps", ... } ] }
    // OR just array.
    // Track123 usually returns { code: 200, data: ... }

    let dataList: any[] = [];

    if (Array.isArray(response)) {
      dataList = response;
    } else if (response && Array.isArray(response.data)) {
      dataList = response.data;
    }

    if (dataList.length > 0) {
      return dataList
        .map((c: any) => ({
          courier_code: c.code || c.carrier || c.courier_code || c.courierCode, // enhanced mapping
          courier_name:
            c.name ||
            c.carrier ||
            c.courier_name ||
            c.courierNameEN ||
            c.courierNameCN,
          courier_type: c.type || c.courier_type,
        }))
        .filter((c: CarrierDetectionItem) => !!c.courier_code);
    }

    return [];
  }

  /**
   * Delete a package tracking
   * Endpoint: /track/delete
   * Method: POST
   */
  async deleteTracking(
    carrierCode: string,
    trackingNumber: string,
  ): Promise<boolean> {
    try {
      const response = await this.makeRequest<any>('/track/delete', 'POST', {
        courierCode: carrierCode,
        trackNo: trackingNumber,
      });
      // Check success
      return response && (response.code === 0 || response.code === 200);
    } catch (error) {
      logger.error('Track123 Delete Failed', error);
      // We might return false or throw. Let's throw so the action knows.
      throw error;
    }
  }

  /**
   * Retrack a package
   * Endpoint: /track/refresh
   * Method: POST
   */
  async refreshTracking(
    carrierCode: string,
    trackingNumber: string,
  ): Promise<{ success: boolean; actualRefreshTime?: string }> {
    try {
      const response = await this.makeRequest<any>('/track/refresh', 'POST', {
        courierCode: carrierCode,
        trackNo: trackingNumber,
      });

      if (response && response.data && response.data.success) {
        return {
          success: true,
          actualRefreshTime: response.data.actualRefreshTime,
        };
      }
      return { success: false };
    } catch (error: any) {
      logger.error('Track123 Refresh Failed', {
        message: error.message || error,
      });
      throw error;
    }
  }
}
