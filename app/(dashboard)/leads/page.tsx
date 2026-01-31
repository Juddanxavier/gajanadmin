/** @format */

import { getLeads } from '@/app/(dashboard)/leads/actions';
import { getTenants } from '@/app/(dashboard)/users/actions';
import { LeadsClient } from './leads-client';

export const metadata = {
  title: 'Leads Management',
  description: 'Manage customer leads and shipments',
};

export default async function LeadsPage() {
  const [leadsResult, tenants] = await Promise.all([
    getLeads(0, 10, { status: 'all' }),
    getTenants(),
  ]);

  const initialLeads = leadsResult.success
    ? leadsResult.data
    : { data: [], total: 0, pageCount: 0 };

  const initialTenants = tenants || [];

  return (
    <LeadsClient initialLeads={initialLeads} initialTenants={initialTenants} />
  );
}
