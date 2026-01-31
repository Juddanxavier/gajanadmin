/** @format */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  updateLeadStatus,
  assignLeadAction,
} from '@/app/(dashboard)/leads/actions';
import { UserDisplay, Lead, LeadStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  User as UserIcon,
  Phone,
  Mail,
  Package,
  CreditCard,
  Calendar,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LeadDetailsClientProps {
  initialLead: Lead;
  teamMembers: UserDisplay[];
}

export function LeadDetailsClient({
  initialLead,
  teamMembers,
}: LeadDetailsClientProps) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead>(initialLead);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    const result = await updateLeadStatus(lead.id, newStatus as LeadStatus);
    if (result.success) {
      toast.success('Status updated');
      setLead((prev) => ({ ...prev, status: newStatus as LeadStatus }));
    } else {
      toast.error(result.error || 'Failed to update status');
    }
    setIsUpdating(false);
  };

  const handleAssign = async (userId: string) => {
    setIsUpdating(true);
    const member = teamMembers.find((m) => m.id === userId);
    const result = await assignLeadAction(
      lead.id,
      userId === 'unassigned' ? null : userId,
    );

    if (result.success) {
      toast.success('Lead assigned');
      setLead((prev) => ({
        ...prev,
        assigned_to: userId === 'unassigned' ? undefined : userId,
        assignee:
          userId === 'unassigned'
            ? undefined
            : {
                name: member?.name || 'Unknown',
                email: member?.email || '',
              },
      }));
    } else {
      toast.error(result.error || 'Failed to assign lead');
    }
    setIsUpdating(false);
  };

  return (
    <div className='max-w-6xl space-y-8'>
      {/* Header Section */}
      <div className='flex flex-col gap-8'>
        {/* Header with Actions */}
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div className='space-y-1'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => router.back()}
              className='text-muted-foreground -ml-4 mb-2 hover:text-foreground'>
              <ArrowLeft className='h-4 w-4 mr-2' /> Back to Leads
            </Button>
            <div className='flex items-center gap-3'>
              <h1 className='text-3xl font-bold tracking-tight'>
                Lead Details
              </h1>
              <div className='hidden md:flex h-6 w-px bg-border' />
              <code className='hidden md:block text-sm bg-muted px-2 py-0.5 rounded text-muted-foreground font-mono'>
                {lead.id}
              </code>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2 bg-background border px-3 py-1.5 rounded-md shadow-sm'>
              <span className='text-sm font-medium text-muted-foreground'>
                Status
              </span>
              <div className='h-4 w-px bg-border mx-1' />
              <Select
                disabled={isUpdating}
                value={(lead.status || 'pending').toLowerCase()}
                onValueChange={handleStatusChange}>
                <SelectTrigger className='w-[140px] h-8 border-0 bg-transparent focus:ring-0 p-0 text-foreground font-medium'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='pending'>Pending</SelectItem>
                  <SelectItem value='processing'>Processing</SelectItem>
                  <SelectItem value='completed'>Completed</SelectItem>
                  <SelectItem value='failed'>Failed</SelectItem>
                  <SelectItem value='archived'>Archived</SelectItem>
                  <SelectItem value='deleted'>Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Hero Route Card */}
        <div className='relative overflow-hidden rounded-xl border bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 p-8 dark:from-indigo-500/10 dark:to-pink-500/10'>
          <div className='relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16'>
            <div className='text-center md:text-left space-y-2'>
              <p className='text-sm font-medium text-muted-foreground uppercase tracking-widest'>
                Origin
              </p>
              <h2 className='text-4xl md:text-5xl font-black text-foreground tracking-tight'>
                {lead.origin_country.substring(0, 3).toUpperCase()}
              </h2>
              <p className='text-sm font-medium text-foreground/80'>
                {lead.origin_country}
              </p>
            </div>

            <div className='flex-1 w-full flex flex-col items-center gap-2'>
              <div className='w-full flex items-center gap-4 text-muted-foreground/30'>
                <div className='h-2 w-2 rounded-full bg-indigo-500' />
                <div className='h-0.5 flex-1 bg-current' />
                <Package className='h-6 w-6 text-foreground/50' />
                <div className='h-0.5 flex-1 bg-current' />
                <div className='h-2 w-2 rounded-full bg-pink-500' />
              </div>
              <p className='text-xs font-medium text-muted-foreground uppercase tracking-widest'>
                Global Logistics
              </p>
            </div>

            <div className='text-center md:text-right space-y-2'>
              <p className='text-sm font-medium text-muted-foreground uppercase tracking-widest'>
                Destination
              </p>
              <h2 className='text-4xl md:text-5xl font-black text-foreground tracking-tight'>
                {lead.destination_country.substring(0, 3).toUpperCase()}
              </h2>
              <p className='text-sm font-medium text-foreground/80'>
                {lead.destination_country}
              </p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
          {/* Goods */}
          <Card className='hover:shadow-md transition-shadow'>
            <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                Goods Type
              </CardTitle>
              <Package className='h-4 w-4 text-indigo-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{lead.goods_type}</div>
            </CardContent>
          </Card>

          {/* Weight */}
          <Card className='hover:shadow-md transition-shadow'>
            <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                Total Weight
              </CardTitle>
              <div className='h-4 w-4 text-blue-500 font-bold text-xs border rounded flex items-center justify-center'>
                kg
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {lead.weight}{' '}
                <span className='text-sm font-normal text-muted-foreground'>
                  kg
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Value */}
          <Card className='hover:shadow-md transition-shadow border-green-500/20 bg-green-500/5'>
            <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
              <CardTitle className='text-sm font-medium text-green-600 dark:text-green-400'>
                Total Value
              </CardTitle>
              <CreditCard className='h-4 w-4 text-green-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-black text-green-700 dark:text-green-300'>
                {formatCurrency(lead.value)}
              </div>
            </CardContent>
          </Card>

          {/* Created */}
          <Card className='hover:shadow-md transition-shadow'>
            <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                Registered
              </CardTitle>
              <Calendar className='h-4 w-4 text-orange-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {new Date(lead.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Section */}
        <div className='grid gap-6 md:grid-cols-3'>
          <Card className='md:col-span-2 border-primary/20 bg-primary/5'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <UserIcon className='h-5 w-5 text-primary' /> Customer Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid md:grid-cols-2 gap-8'>
                <div className='flex items-center gap-4'>
                  <div className='h-16 w-16 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center text-primary text-xl font-bold shadow-sm'>
                    {lead.customer?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className='font-bold text-lg'>
                      {lead.customer?.name || 'Unknown User'}
                    </h3>
                    <p className='text-sm text-muted-foreground flex items-center gap-1'>
                      <span className='h-2 w-2 rounded-full bg-green-500 animate-pulse' />{' '}
                      Active Customer
                    </p>
                  </div>
                </div>

                <div className='space-y-4 border-l pl-6 border-primary/10'>
                  <div className='space-y-1'>
                    <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                      Contact Email
                    </p>
                    <div className='flex items-center gap-2 font-medium'>
                      <Mail className='h-3.5 w-3.5' />
                      {lead.customer?.email}
                    </div>
                  </div>
                  <div className='space-y-1'>
                    <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                      Phone Number
                    </p>
                    <div className='flex items-center gap-2 font-medium'>
                      <Phone className='h-3.5 w-3.5' />
                      {lead.customer?.phone || 'No phone linked'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                System Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Last Updated</span>
                <span className='font-mono'>{formatDate(lead.updated_at)}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Lead ID</span>
                <span className='font-mono text-xs'>
                  {lead.id.slice(0, 8)}...
                </span>
              </div>
              <Separator />
              <div className='pt-2 space-y-3'>
                <div className='space-y-1'>
                  <p className='text-xs font-medium text-muted-foreground uppercase'>
                    Assignee
                  </p>
                  <Select
                    disabled={isUpdating}
                    value={lead.assigned_to || 'unassigned'}
                    onValueChange={handleAssign}>
                    <SelectTrigger className='w-full h-9'>
                      <SelectValue placeholder='Assign Staff' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='unassigned'>Unassigned</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className='flex items-center gap-2'>
                            <div className='h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold'>
                              {(member.name || '?')[0]}
                            </div>
                            {member.name || 'Unknown Staff'}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='text-xs text-muted-foreground text-center'>
                  Tenant ID: {lead.tenant_id}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
