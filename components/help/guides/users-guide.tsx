/** @format */

import { TutorialCard } from '../tutorial-card';
import { Users, Shield, UserPlus, Building } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export function UsersGuide() {
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
          <Users className='h-8 w-8' />
          Users & Teams
        </h2>
        <p className='text-muted-foreground mt-2'>
          Manage your team, permissions, and workspace access.
        </p>
      </div>

      <TutorialCard
        title='Roles & Permissions'
        description='Understanding access levels'
        icon={<Shield className='h-5 w-5' />}
        defaultExpanded>
        <div className='space-y-4'>
          <p>GT Express supports different roles to secure your data:</p>

          <div className='space-y-4'>
            <div className='border rounded-lg p-4'>
              <div className='flex items-center gap-2 mb-2'>
                <Badge className='bg-red-500'>Super Admin</Badge>
              </div>
              <p className='text-sm text-muted-foreground'>
                Full system access. Can manage billing, global settings, and all
                tenants. Usually reserved for the account owner.
              </p>
            </div>

            <div className='border rounded-lg p-4'>
              <div className='flex items-center gap-2 mb-2'>
                <Badge className='bg-blue-500'>Admin</Badge>
              </div>
              <p className='text-sm text-muted-foreground'>
                Full access within their tenant. Can invite users, change
                settings, and manage all data. Cannot delete the tenant itself.
              </p>
            </div>

            <div className='border rounded-lg p-4'>
              <div className='flex items-center gap-2 mb-2'>
                <Badge variant='secondary'>Staff / Member</Badge>
              </div>
              <p className='text-sm text-muted-foreground'>
                Standard access. Can create and view shipments, leads, and
                analytics. Cannot change system settings or invite other users.
              </p>
            </div>
          </div>
        </div>
      </TutorialCard>

      <TutorialCard
        title='Inviting Team Members'
        description='Add users to your workspace'
        icon={<UserPlus className='h-5 w-5' />}>
        <div className='space-y-4'>
          <ol className='list-decimal list-inside space-y-2 ml-4 text-sm'>
            <li>
              Navigate to <strong>Users</strong> page
            </li>
            <li>
              Click <strong>"Invite User"</strong>
            </li>
            <li>Enter the user's email address</li>
            <li>Select the appropriate role</li>
            <li>
              Click <strong>"Send Invitation"</strong>
            </li>
          </ol>

          <Alert>
            <AlertDescription>
              The user will receive an email with a magic link to sign in. They
              do not need a password.
            </AlertDescription>
          </Alert>
        </div>
      </TutorialCard>

      <TutorialCard
        title='Tenant Management'
        description='Working with multiple workspaces'
        icon={<Building className='h-5 w-5' />}>
        <div className='space-y-4'>
          <p>
            Tenants allow you to separate data for different brands, branches,
            or clients:
          </p>

          <ul className='list-disc list-inside space-y-2 ml-4 text-sm'>
            <li>
              Data Isolation: Shipments and leads are visible only within their
              tenant
            </li>
            <li>
              Switching Tenants: Use the dropdown in the sidebar header to
              switch context
            </li>
            <li>
              User Assignment: Users can belong to multiple tenants with
              different roles
            </li>
          </ul>
        </div>
      </TutorialCard>
    </div>
  );
}
