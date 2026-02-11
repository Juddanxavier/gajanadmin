/** @format */

import { getShipments, getShipmentStats } from './actions';
import { getTenants } from '@/app/(dashboard)/users/actions';
import { ShipmentsClient } from './shipments-client';
import { Shipment } from '@/components/shipments/columns';

export default async function ShipmentsPage() {
  const [shipmentsResult, statsResult, tenantsResult] = await Promise.all([
    getShipments({}),
    getShipmentStats(),
    getTenants(),
  ]);

  const shipments = (
    shipmentsResult.success ? shipmentsResult.data : []
  ) as Shipment[];

  const stats = statsResult.success
    ? statsResult.stats
    : {
        total_shipments: 0,
        pending: 0,
        in_transit: 0,
        delivered: 0,
        exception: 0,
        this_month: 0,
        total_revenue: 0,
        success_rate: 0,
      };

  const tenants = tenantsResult || [];

  return (
    <ShipmentsClient
      initialShipments={shipments}
      initialCount={shipmentsResult.count || 0}
      initialStats={stats}
      tenants={tenants}
    />
  );
}
