/** @format */

/**
 * Mock Data Generator for World Map Destinations
 */

export interface DestinationData {
  country: string;
  countryCode: string;
  shipmentCount: number;
  totalValue: number;
  coordinates: [number, number];
}

/**
 * Generate mock destination data for world map
 */
export function generateMockDestinations(): DestinationData[] {
  const destinations = [
    // Asia
    {
      country: 'India',
      countryCode: 'IN',
      shipmentCount: Math.floor(Math.random() * 50) + 30, // 30-80
      totalValue: Math.floor(Math.random() * 100000) + 50000, // $50k-150k
      coordinates: [78, 20] as [number, number],
    },
    {
      country: 'Sri Lanka',
      countryCode: 'LK',
      shipmentCount: Math.floor(Math.random() * 40) + 20, // 20-60
      totalValue: Math.floor(Math.random() * 80000) + 30000, // $30k-110k
      coordinates: [80, 7] as [number, number],
    },
    {
      country: 'Singapore',
      countryCode: 'SG',
      shipmentCount: Math.floor(Math.random() * 35) + 15, // 15-50
      totalValue: Math.floor(Math.random() * 90000) + 40000, // $40k-130k
      coordinates: [103, 1] as [number, number],
    },
    {
      country: 'China',
      countryCode: 'CN',
      shipmentCount: Math.floor(Math.random() * 45) + 25, // 25-70
      totalValue: Math.floor(Math.random() * 120000) + 60000, // $60k-180k
      coordinates: [105, 35] as [number, number],
    },
    {
      country: 'Japan',
      countryCode: 'JP',
      shipmentCount: Math.floor(Math.random() * 30) + 10, // 10-40
      totalValue: Math.floor(Math.random() * 70000) + 35000, // $35k-105k
      coordinates: [138, 36] as [number, number],
    },
    {
      country: 'Thailand',
      countryCode: 'TH',
      shipmentCount: Math.floor(Math.random() * 25) + 12, // 12-37
      totalValue: Math.floor(Math.random() * 60000) + 25000, // $25k-85k
      coordinates: [100, 15] as [number, number],
    },
    {
      country: 'Malaysia',
      countryCode: 'MY',
      shipmentCount: Math.floor(Math.random() * 20) + 8, // 8-28
      totalValue: Math.floor(Math.random() * 50000) + 20000, // $20k-70k
      coordinates: [101, 4] as [number, number],
    },
    {
      country: 'Vietnam',
      countryCode: 'VN',
      shipmentCount: Math.floor(Math.random() * 18) + 7, // 7-25
      totalValue: Math.floor(Math.random() * 45000) + 18000, // $18k-63k
      coordinates: [108, 16] as [number, number],
    },

    // Middle East
    {
      country: 'UAE',
      countryCode: 'AE',
      shipmentCount: Math.floor(Math.random() * 28) + 15, // 15-43
      totalValue: Math.floor(Math.random() * 85000) + 45000, // $45k-130k
      coordinates: [54, 24] as [number, number],
    },
    {
      country: 'Saudi Arabia',
      countryCode: 'SA',
      shipmentCount: Math.floor(Math.random() * 22) + 10, // 10-32
      totalValue: Math.floor(Math.random() * 65000) + 30000, // $30k-95k
      coordinates: [45, 24] as [number, number],
    },

    // Europe
    {
      country: 'United Kingdom',
      countryCode: 'GB',
      shipmentCount: Math.floor(Math.random() * 32) + 18, // 18-50
      totalValue: Math.floor(Math.random() * 95000) + 50000, // $50k-145k
      coordinates: [-3, 54] as [number, number],
    },
    {
      country: 'Germany',
      countryCode: 'DE',
      shipmentCount: Math.floor(Math.random() * 26) + 14, // 14-40
      totalValue: Math.floor(Math.random() * 75000) + 40000, // $40k-115k
      coordinates: [10, 51] as [number, number],
    },
    {
      country: 'France',
      countryCode: 'FR',
      shipmentCount: Math.floor(Math.random() * 24) + 12, // 12-36
      totalValue: Math.floor(Math.random() * 70000) + 35000, // $35k-105k
      coordinates: [2, 46] as [number, number],
    },

    // Americas
    {
      country: 'United States',
      countryCode: 'US',
      shipmentCount: Math.floor(Math.random() * 55) + 35, // 35-90
      totalValue: Math.floor(Math.random() * 150000) + 80000, // $80k-230k
      coordinates: [-95, 38] as [number, number],
    },
    {
      country: 'Canada',
      countryCode: 'CA',
      shipmentCount: Math.floor(Math.random() * 20) + 10, // 10-30
      totalValue: Math.floor(Math.random() * 60000) + 30000, // $30k-90k
      coordinates: [-106, 56] as [number, number],
    },
    {
      country: 'Brazil',
      countryCode: 'BR',
      shipmentCount: Math.floor(Math.random() * 18) + 8, // 8-26
      totalValue: Math.floor(Math.random() * 55000) + 25000, // $25k-80k
      coordinates: [-47, -15] as [number, number],
    },

    // Oceania
    {
      country: 'Australia',
      countryCode: 'AU',
      shipmentCount: Math.floor(Math.random() * 25) + 15, // 15-40
      totalValue: Math.floor(Math.random() * 80000) + 40000, // $40k-120k
      coordinates: [133, -27] as [number, number],
    },

    // Africa
    {
      country: 'South Africa',
      countryCode: 'ZA',
      shipmentCount: Math.floor(Math.random() * 15) + 5, // 5-20
      totalValue: Math.floor(Math.random() * 40000) + 15000, // $15k-55k
      coordinates: [24, -29] as [number, number],
    },
  ];

  // Randomly remove some destinations to make it more realistic
  const activeDestinations = destinations.filter(() => Math.random() > 0.2);

  // Ensure at least 5 destinations
  if (activeDestinations.length < 5) {
    return destinations.slice(0, 8);
  }

  return activeDestinations;
}

/**
 * Generate mock active shipment destinations (fewer than total)
 */
export function generateMockActiveDestinations(): DestinationData[] {
  const allDestinations = generateMockDestinations();

  // Return 50-70% of destinations as "active"
  const activeCount = Math.floor(
    allDestinations.length * (0.5 + Math.random() * 0.2)
  );

  return allDestinations
    .sort(() => Math.random() - 0.5) // Shuffle
    .slice(0, activeCount)
    .map((dest) => ({
      ...dest,
      // Reduce counts for active shipments
      shipmentCount: Math.floor(dest.shipmentCount * 0.6),
      totalValue: Math.floor(dest.totalValue * 0.6),
    }));
}
