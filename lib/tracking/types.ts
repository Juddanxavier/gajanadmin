export type ShipmentStatus = 
  | 'created'
  | 'pending'
  | 'info_received'
  | 'in_transit'
  | 'out_for_delivery'
  | 'attempt_fail'
  | 'delivered'
  | 'exception'
  | 'expired'
  | 'invalid';

export interface TrackingCheckpoint {
  occurred_at: string;
  status: ShipmentStatus;
  description: string;
  location?: string;
  raw_status?: string;
}

export interface TrackingResult {
  tracking_number: string;
  carrier_code: string;
  status: ShipmentStatus;
  estimated_delivery?: string;
  latest_location?: string;
  checkpoints: TrackingCheckpoint[];
  raw_response: any;
  provider_metadata?: any;
}

export interface CreateShipmentParams {
  tracking_number: string;
  carrier_code?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  whiteLabelCode?: string;
  userId?: string;
  tenantId?: string;
  invoiceDetails?: any;
  amount?: number;
}

export interface Carrier {
  code: string;
  name: string;
}

export interface ShipmentProvider {
  name: string;
  
  /**
   * Register a tracking number with the provider.
   * Should tolerate "Already Exists" and return current stats.
   */
  createTracker(params: CreateShipmentParams): Promise<TrackingResult>;
  
  /**
   * Fetch latest tracking info.
   */
  getTracking(tracking_number: string, carrier_code?: string): Promise<TrackingResult>;

  /**
   * Fetch list of supported carriers.
   */
  getCarriers(): Promise<Carrier[]>;

  /**
   * Stop tracking (Delete). Optional.
   */
  stopTracking?(tracking_number: string, carrier_code?: string): Promise<boolean>;
}
