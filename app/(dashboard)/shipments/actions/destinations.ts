/** @format */

'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Get shipment destination statistics
 * Groups shipments by destination country
 */
export async function getShipmentDestinations() {
  try {
    const supabase = await createClient();

    // Get all shipments with destination info
    const { data: shipments, error } = await supabase
      .from('shipments')
      .select('destination, value, status')
      .not('destination', 'is', null);

    if (error) {
      console.error('Error fetching shipment destinations:', error);
      return { success: false, data: [] };
    }

    // Group by destination country
    const destinationMap = new Map<
      string,
      {
        country: string;
        countryCode: string;
        shipmentCount: number;
        totalValue: number;
      }
    >();

    shipments?.forEach((shipment) => {
      if (!shipment.destination) return;

      // Extract country from destination
      // Assuming destination format: "City, Country" or just "Country"
      const parts = shipment.destination.split(',');
      const country = parts[parts.length - 1].trim();

      // Map country name to ISO code (you can expand this)
      const countryCode = getCountryCode(country);

      if (!countryCode) return; // Skip if country not recognized

      const existing = destinationMap.get(countryCode);
      if (existing) {
        existing.shipmentCount++;
        existing.totalValue += shipment.value || 0;
      } else {
        destinationMap.set(countryCode, {
          country: country,
          countryCode: countryCode,
          shipmentCount: 1,
          totalValue: shipment.value || 0,
        });
      }
    });

    // Convert to array
    const destinations = Array.from(destinationMap.values());

    return {
      success: true,
      data: destinations,
    };
  } catch (error) {
    console.error('Error in getShipmentDestinations:', error);
    return { success: false, data: [] };
  }
}

/**
 * Map country names to ISO codes
 * Expand this based on your common destinations
 */
function getCountryCode(countryName: string): string | null {
  const countryMap: Record<string, string> = {
    // Americas
    'United States': 'US',
    USA: 'US',
    US: 'US',
    Canada: 'CA',
    Mexico: 'MX',
    Brazil: 'BR',
    Argentina: 'AR',

    // Europe
    'United Kingdom': 'GB',
    UK: 'GB',
    England: 'GB',
    France: 'FR',
    Germany: 'DE',
    Italy: 'IT',
    Spain: 'ES',
    Russia: 'RU',

    // Asia
    China: 'CN',
    Japan: 'JP',
    India: 'IN',
    Singapore: 'SG',
    Thailand: 'TH',
    Malaysia: 'MY',
    Indonesia: 'ID',
    Philippines: 'PH',
    'South Korea': 'KR',
    Korea: 'KR',
    Vietnam: 'VN',
    'Sri Lanka': 'LK',

    // Middle East
    UAE: 'AE',
    'United Arab Emirates': 'AE',
    Dubai: 'AE',
    'Saudi Arabia': 'SA',
    Egypt: 'EG',

    // Oceania
    Australia: 'AU',
    'New Zealand': 'NZ',

    // Africa
    'South Africa': 'ZA',
  };

  // Try exact match first
  const normalized = countryName.trim();
  if (countryMap[normalized]) {
    return countryMap[normalized];
  }

  // Try case-insensitive match
  const lowerName = normalized.toLowerCase();
  for (const [key, value] of Object.entries(countryMap)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }

  return null;
}

/**
 * Get active shipment destinations (in-transit only)
 */
import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserTenantIds, ensureStaffAccess } from '@/lib/utils/permissions';

export async function getActiveShipmentDestinations() {
  try {
    await ensureStaffAccess();
    const tenantIds = await getUserTenantIds();
    const tenantKey = tenantIds.sort().join('-');

    const getCachedDestinations = unstable_cache(
      async () => {
        const supabase = createAdminClient();

        let query = supabase
          .from('shipments')
          .select('destination_country, latest_location, status') // Use proper columns
          .in('status', ['in_transit', 'out_for_delivery'])
          .in('tenant_id', tenantIds);

        // Fetch data
        const { data: shipments, error } = await query;

        if (error) throw error;
        if (!shipments) return [];

        // Grouping Logic
        const destinationMap = new Map<
          string,
          { country: string; countryCode: string; shipmentCount: number }
        >();

        shipments.forEach((shipment) => {
          // Try to get country from direct column first, then parse location
          let countryCode = shipment.destination_country;
          let countryName = shipment.destination_country;

          if (!countryCode && shipment.latest_location) {
            const parts = shipment.latest_location.split(',');
            const potentialCountry = parts[parts.length - 1].trim();
            countryCode = getCountryCode(potentialCountry);
            countryName = potentialCountry;
          }

          if (!countryCode) return;

          const existing = destinationMap.get(countryCode);
          if (existing) {
            existing.shipmentCount++;
          } else {
            destinationMap.set(countryCode, {
              country: countryName || countryCode,
              countryCode: countryCode,
              shipmentCount: 1,
            });
          }
        });

        return Array.from(destinationMap.values());
      },
      [`shipment-destinations-active-${tenantKey}`],
      {
        revalidate: 60 * 60, // 1 Hour
        tags: ['shipments', `shipments-${tenantKey}`],
      }
    );

    const destinations = await getCachedDestinations();

    return {
      success: true,
      data: destinations,
    };
  } catch (error) {
    console.error('Error in getActiveShipmentDestinations:', error);
    return { success: false, data: [] };
  }
}
