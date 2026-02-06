/** @format */

export interface CarrierMatch {
  code: string;
  name: string;
  confidence: number;
}

export const CARRIER_PATTERNS: { [key: string]: RegExp } = {
  // UPS: 1Z... (18 chars usually)
  ups: /^1Z[A-Z0-9]{16}$/i,

  // FedEx: 12, 15, 20, 22 digits
  fedex: /^(\d{12}|\d{14}|\d{15}|\d{20}|\d{22})$/,

  // USPS: 20-22 digits, or starting with 9
  usps: /^(\d{20,22}|9\d{21}|9\d{15,21})$/,

  // DHL: 10 or 11 digits
  dhl: /^\d{10,11}$/,

  // Amazon Logistics: TBA...
  amazon: /^TBA[A-Z0-9]{12}$/i,

  // OnTrac: C...
  ontrac: /^C\d{14}$/,
};

export const COMMON_CARRIERS = [
  { code: 'ups', name: 'UPS' },
  { code: 'fedex', name: 'FedEx' },
  { code: 'usps', name: 'USPS' },
  { code: 'dhl', name: 'DHL' },
  { code: 'amazon', name: 'Amazon Logistics' },
  { code: 'ontrac', name: 'OnTrac' },
];

export function detectCarrierLocal(
  trackingNumber: string,
): CarrierMatch | null {
  const cleanNumber = trackingNumber.trim();

  for (const [code, pattern] of Object.entries(CARRIER_PATTERNS)) {
    if (pattern.test(cleanNumber)) {
      const carrier = COMMON_CARRIERS.find((c) => c.code === code);
      return carrier
        ? { code: carrier.code, name: carrier.name, confidence: 1.0 }
        : null;
    }
  }

  return null;
}
