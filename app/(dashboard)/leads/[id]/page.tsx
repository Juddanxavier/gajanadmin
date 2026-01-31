/** @format */

import { getLead } from '@/app/(dashboard)/leads/actions';
import { getTeamMembersAction } from '@/app/(dashboard)/users/actions';
import { LeadDetailsClient } from './lead-details-client';
import { redirect } from 'next/navigation';

export default async function LeadDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) {
    redirect('/leads');
  }

  const [leadResult, teamResult] = await Promise.all([
    getLead(id),
    getTeamMembersAction(),
  ]);

  if (!leadResult.success || !leadResult.data) {
    redirect('/leads');
  }

  const teamMembers = teamResult.success ? teamResult.data : [];

  return (
    <div className='container mx-auto py-6'>
      <LeadDetailsClient
        initialLead={leadResult.data}
        teamMembers={teamMembers}
      />
    </div>
  );
}
