export const CARRIER_PATTERNS: Record<string, RegExp> = {
  'usps': /^(9\d{21}|9\d{15,22}|82\d{8}|EC\d{9}US|CP\d{9}US|EA\d{9}US)$/,
  'fedex': /^(\d{12}|\d{15}|\d{20})$/,
  'ups': /^1Z[A-Z0-9]{16}$/,
  'dhl': /^(\d{10,11})$/,
  'china-post': /^([A-Z]{2}\d{9}CN)$/,
  'royal-mail': /^([A-Z]{2}\d{9}GB)$/,
  'canada-post': /^([A-Z]{2}\d{9}CA)$/,
  'aus-post': /^([A-Z]{2}\d{9}AU)$/,
  'onetracker': /^OT\d{10,15}$/,
  'gls': /^(\d{12}|\d{14}|\d{20})$/
};

export interface DetectedCarrier {
  code: string;
  name: string;
  confidence: 'high' | 'medium' | 'low';
}

export function detectCarrier(trackingNumber: string): DetectedCarrier[] {
    // Clean input
    const cleanNumber = trackingNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const results: DetectedCarrier[] = [];

    for (const [code, pattern] of Object.entries(CARRIER_PATTERNS)) {
        if (pattern.test(cleanNumber)) {
            // High confidence match
            results.push({
                code,
                name: code.replace('-', ' ').toUpperCase(),
                confidence: 'high'
            });
        }
    }

    // Heuristics if no regex match or to augment
    if (cleanNumber.startsWith('1Z')) {
        if (!results.some(r => r.code === 'ups')) {
             results.push({ code: 'ups', name: 'UPS', confidence: 'high' });
        }
    }

    // Default sorting by confidence? (If we had scores)
    return results;
}
