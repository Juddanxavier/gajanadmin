/** @format */

/**
 * Mock Data Generator for Analytics Charts
 * Generates realistic-looking trend data for development and testing
 */

export interface ShipmentTrendData {
  date: string;
  total: number;
  delivered: number;
  exception: number;
}

export interface UserTrendData {
  date: string;
  totalUsers: number;
  activeUsers: number;
  admins: number;
  tenants: number;
}

export interface LeadTrendData {
  date: string;
  total: number;
  converted: number;
  lost: number;
}

/**
 * Generate mock shipment trend data
 */
export function generateMockShipmentTrends(
  days: number = 90,
): ShipmentTrendData[] {
  const data: ShipmentTrendData[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Generate realistic patterns with some randomness
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Lower volume on weekends
    const baseTotal = isWeekend
      ? Math.floor(Math.random() * 8) + 3
      : Math.floor(Math.random() * 15) + 8;

    // Most shipments get delivered (70-85%)
    const deliveryRate = 0.7 + Math.random() * 0.15;
    const delivered = Math.floor(baseTotal * deliveryRate);

    // Small percentage have exceptions (5-10%)
    const exceptionRate = 0.05 + Math.random() * 0.05;
    const exception = Math.floor(baseTotal * exceptionRate);

    data.push({
      date: dateStr,
      total: baseTotal,
      delivered: delivered,
      exception: exception,
    });
  }

  return data;
}

/**
 * Generate mock user trend data
 */
export function generateMockUserTrends(days: number = 90): UserTrendData[] {
  const data: UserTrendData[] = [];
  const today = new Date();

  let cumulativeUsers = 100; // Starting user count

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Gradual growth with some variation
    const growth = Math.floor(Math.random() * 5) + 1;
    cumulativeUsers += growth;

    // Active users are typically 60-80% of total
    const activeRate = 0.6 + Math.random() * 0.2;
    const activeUsers = Math.floor(cumulativeUsers * activeRate);

    // Admins are typically 5-10% of total
    const adminRate = 0.05 + Math.random() * 0.05;
    const admins = Math.floor(cumulativeUsers * adminRate);

    // Tenants grow slower
    const tenants =
      Math.floor(cumulativeUsers / 10) + Math.floor(Math.random() * 3);

    data.push({
      date: dateStr,
      totalUsers: cumulativeUsers,
      activeUsers: activeUsers,
      admins: admins,
      tenants: tenants,
    });
  }

  return data;
}

/**
 * Generate mock lead trend data
 */
export function generateMockLeadTrends(days: number = 90): LeadTrendData[] {
  const data: LeadTrendData[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // More leads on weekdays - increased volumes
    const baseTotal = isWeekend
      ? Math.floor(Math.random() * 10) + 5
      : Math.floor(Math.random() * 25) + 15;

    // Conversion rate 30-50% (better conversion)
    const conversionRate = 0.3 + Math.random() * 0.2;
    const converted = Math.floor(baseTotal * conversionRate);

    // Lost rate 10-20%
    const lostRate = 0.1 + Math.random() * 0.1;
    const lost = Math.floor(baseTotal * lostRate);

    data.push({
      date: dateStr,
      total: baseTotal,
      converted: converted,
      lost: lost,
    });
  }

  return data;
}

/**
 * Generate mock shipment stats
 */
export function generateMockShipmentStats() {
  const total = Math.floor(Math.random() * 500) + 200;
  const delivered = Math.floor(total * (0.7 + Math.random() * 0.15));
  const inTransit = Math.floor(total * (0.15 + Math.random() * 0.1));
  const pending = Math.floor(total * (0.05 + Math.random() * 0.05));
  const exception = total - delivered - inTransit - pending;

  return {
    total,
    delivered,
    in_transit: inTransit,
    pending,
    exception,
    avgDeliveryDays: Math.floor(Math.random() * 5) + 3,
  };
}

/**
 * Generate mock user stats
 */
export function generateMockUserStats() {
  const total = Math.floor(Math.random() * 200) + 50;
  const active = Math.floor(total * (0.6 + Math.random() * 0.2));
  const admin = Math.floor(total * 0.1);
  const staff = Math.floor(total * 0.2);
  const customer = total - admin - staff;

  return {
    total,
    active,
    byRole: {
      admin,
      staff,
      customer,
    },
    byTenant: {
      'Tenant A': Math.floor(total * 0.4),
      'Tenant B': Math.floor(total * 0.35),
      'Tenant C': Math.floor(total * 0.25),
    },
  };
}

/**
 * Generate mock lead stats
 */
export function generateMockLeadStats() {
  const total = Math.floor(Math.random() * 150) + 50;
  const pending = Math.floor(total * 0.25);
  const processing = Math.floor(total * 0.2);
  const completed = Math.floor(total * 0.4);
  const failed = Math.floor(total * 0.15);
  const totalValue = Math.floor(Math.random() * 500000) + 200000;

  return {
    total,
    pending,
    processing,
    completed,
    failed,
    totalValue,
  };
}

/**
 * Generate mock top destinations data
 */
export function generateMockTopDestinations() {
  const countries = [
    'United States',
    'United Kingdom',
    'Germany',
    'France',
    'Canada',
    'Australia',
    'Japan',
    'Singapore',
    'Netherlands',
    'Spain',
  ];

  return countries.slice(0, 7).map((country) => ({
    country,
    count: Math.floor(Math.random() * 50) + 10,
    value: Math.floor(Math.random() * 100000) + 20000,
  }));
}

/**
 * Generate mock leads for database seeding
 */
export function generateMockLeads(
  count: number = 20,
  tenantId: string,
  customerId?: string,
) {
  const leads = [];
  const goodsTypes = [
    'Electronics',
    'Clothing',
    'Furniture',
    'Machinery',
    'Documents',
    'Food',
    'Chemicals',
  ];
  const countries = [
    'CN',
    'US',
    'IN',
    'DE',
    'GB',
    'FR',
    'JP',
    'AU',
    'AE',
    'SG',
  ];
  const statuses = ['pending', 'processing', 'completed', 'failed', 'new'];

  for (let i = 0; i < count; i++) {
    const origin = countries[Math.floor(Math.random() * countries.length)];
    let destination = countries[Math.floor(Math.random() * countries.length)];
    while (destination === origin) {
      destination = countries[Math.floor(Math.random() * countries.length)];
    }

    const type = goodsTypes[Math.floor(Math.random() * goodsTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    // Random date within last 60 days
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));

    leads.push({
      tenant_id: tenantId,
      customer_id: customerId,
      name: `Lead ${type} ${origin}-${destination} #${Math.floor(Math.random() * 1000)}`,
      email: `lead${i}@example.com`, // Optional
      phone: `+123456789${i}`, // Optional
      origin_country: origin,
      destination_country: destination,
      goods_type: type,
      weight: Math.floor(Math.random() * 500) + 1,
      value: Math.floor(Math.random() * 10000) + 100,
      status: status,
      created_at: date.toISOString(),
      updated_at: date.toISOString(),
    });
  }
  return leads;
}
