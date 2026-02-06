/** @format */

export interface Track123Config {
  apiKey: string;
  baseUrl?: string;
}

export interface Track123Error {
  code: number;
  message: string;
  details?: any;
}

export interface Carrier {
  code: string;
  name: string;
  name_cn?: string;
  homepage?: string;
  logo_url?: string; // Derived or enriched
}

export interface CarrierDetectionItem {
  courier_code: string;
  courier_name: string;
  courier_type?: string;
  country_code?: string;
  homepage?: string;
}

export interface CarrierDetectionResult {
  code: number;
  msg: string;
  data: {
    recommended_carrier?: {
      carrier: string;
      confidence: number;
    };
    candidates?: {
      carrier: string;
      confidence: number;
    }[];
  };
}

export interface CreateTrackingParams {
  tracking_number: string;
  carrier_code?: string; // If known/detected
  title?: string; // Usually used for Order ID / White Label Code
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  destination_country?: string; // Optional override
  origin_country?: string; // Optional override
  note?: string;
}

// Response structure for creating/getting tracking
export interface TrackingResponse {
  code: number;
  msg: string;
  data?: TrackingData;
}

export interface TrackingData {
  id?: string; // Track123 internal ID
  tracking_number: string;
  courier_code: string;
  status: string; // e.g., 'Pending', 'InTransit'
  sub_status?: string;
  original_country?: string;
  destination_country?: string;
  created_at?: string;
  updated_at?: string;
  latest_event?: string;
  latest_checkpoint_time?: string;
  // Add other fields as discovered from API response
  [key: string]: any;
}
// Webhook Payloads
export interface Track123WebhookPayload {
  data: {
    id: number | string; // Track123 internal ID
    trackNo: string; // Carrier tracking number
    shipfrom: string;
    shipTo: string;
    transitStatus: string; // e.g., "DELIVERED"
    transitSubStatus: string; // e.g., "DELIVERED_01"
    trackerStatus?: string; // some payloads use this

    // Dates
    createTime: string;
    updateTime?: string;
    deliveredTime?: string; // Explicitly add this

    // Detailed info
    localLogisticsInfo?: {
      courierCode: string;
      courierNameEN: string;
      trackingDetails: Array<{
        eventDetail: string;
        eventTime: string;
        address: string;
        transitSubStatus: string;
      }>;
    };
  };
  verify: {
    signature: string;
    timestamp: string;
  };
}
