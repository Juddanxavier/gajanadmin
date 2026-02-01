/** @format */

import { TutorialCard } from '../tutorial-card';
import { CodeSnippet } from '../code-snippet';
import { StepIndicator } from '../step-indicator';
import { Rocket, User, LayoutDashboard, Package } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export function GettingStartedGuide() {
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>Getting Started</h2>
        <p className='text-muted-foreground mt-2'>
          Welcome to GT Express! This guide will help you get up and running
          quickly.
        </p>
      </div>

      <Alert>
        <Rocket className='h-4 w-4' />
        <AlertTitle>New to GT Express?</AlertTitle>
        <AlertDescription>
          Follow these steps in order to set up your account and start tracking
          shipments. Estimated time: 10 minutes.
        </AlertDescription>
      </Alert>

      <StepIndicator
        steps={[
          'Profile Setup',
          'Dashboard Tour',
          'First Shipment',
          'Team Setup',
        ]}
        currentStep={1}
      />

      <TutorialCard
        title='First Login & Profile Setup'
        description='Configure your account and preferences'
        icon={<User className='h-5 w-5' />}
        stepNumber={1}
        defaultExpanded>
        <div className='space-y-4'>
          <p>
            After logging in for the first time, you'll want to complete your
            profile setup:
          </p>

          <ol className='list-decimal list-inside space-y-3 ml-4'>
            <li>
              <strong>Navigate to your profile</strong>
              <p className='ml-6 mt-1 text-muted-foreground'>
                Click on your avatar in the top-right corner and select
                "Profile"
              </p>
            </li>
            <li>
              <strong>Update your information</strong>
              <p className='ml-6 mt-1 text-muted-foreground'>
                Add your full name, phone number, and profile picture
              </p>
            </li>
            <li>
              <strong>Set your preferences</strong>
              <p className='ml-6 mt-1 text-muted-foreground'>
                Choose your preferred theme (Light/Dark mode) and notification
                settings
              </p>
            </li>
          </ol>

          <Alert>
            <AlertDescription>
              <strong>Tip:</strong> Enable dark mode for a more comfortable
              viewing experience, especially during extended use.
            </AlertDescription>
          </Alert>
        </div>
      </TutorialCard>

      <TutorialCard
        title='Understanding the Dashboard'
        description='Get familiar with your command center'
        icon={<LayoutDashboard className='h-5 w-5' />}
        stepNumber={2}>
        <div className='space-y-4'>
          <p>
            The dashboard provides a comprehensive overview of your logistics
            operations:
          </p>

          <div className='grid gap-4 md:grid-cols-2'>
            <div className='p-4 border rounded-lg bg-muted/30'>
              <h4 className='font-semibold mb-2'>📊 Key Metrics</h4>
              <p className='text-sm text-muted-foreground'>
                View total shipments, active deliveries, and delivery success
                rates at a glance.
              </p>
            </div>
            <div className='p-4 border rounded-lg bg-muted/30'>
              <h4 className='font-semibold mb-2'>📈 Trends Chart</h4>
              <p className='text-sm text-muted-foreground'>
                Track shipment volume over time with interactive charts showing
                daily, weekly, or monthly trends.
              </p>
            </div>
            <div className='p-4 border rounded-lg bg-muted/30'>
              <h4 className='font-semibold mb-2'>🚨 Recent Activity</h4>
              <p className='text-sm text-muted-foreground'>
                Monitor the latest shipment updates, status changes, and system
                notifications.
              </p>
            </div>
            <div className='p-4 border rounded-lg bg-muted/30'>
              <h4 className='font-semibold mb-2'>⚡ Quick Actions</h4>
              <p className='text-sm text-muted-foreground'>
                Access frequently used features like creating shipments or
                adding leads directly from the dashboard.
              </p>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Pro Tip:</strong> Customize your dashboard view by
              adjusting the date range filter to focus on specific time periods.
            </AlertDescription>
          </Alert>
        </div>
      </TutorialCard>

      <TutorialCard
        title='Creating Your First Shipment'
        description='Step-by-step guide to track your first package'
        icon={<Package className='h-5 w-5' />}
        stepNumber={3}>
        <div className='space-y-4'>
          <p>Let's create your first shipment and start tracking:</p>

          <ol className='list-decimal list-inside space-y-4 ml-4'>
            <li>
              <strong>Navigate to Shipments</strong>
              <p className='ml-6 mt-1 text-muted-foreground'>
                Click "Shipments" in the sidebar navigation
              </p>
            </li>
            <li>
              <strong>Click "Create Shipment"</strong>
              <p className='ml-6 mt-1 text-muted-foreground'>
                Find the button in the top-right corner of the shipments page
              </p>
            </li>
            <li>
              <strong>Fill in the details</strong>
              <div className='ml-6 mt-2 space-y-2'>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline'>Required</Badge>
                  <span className='text-sm'>Tracking Number</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline'>Required</Badge>
                  <span className='text-sm'>
                    Carrier (e.g., FedEx, UPS, DHL)
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge variant='secondary'>Optional</Badge>
                  <span className='text-sm'>Customer Name & Email</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge variant='secondary'>Optional</Badge>
                  <span className='text-sm'>Description/Notes</span>
                </div>
              </div>
            </li>
            <li>
              <strong>Submit and track</strong>
              <p className='ml-6 mt-1 text-muted-foreground'>
                Click "Create" and the system will automatically start tracking
                your shipment
              </p>
            </li>
          </ol>

          <Alert>
            <AlertDescription>
              <strong>Auto-Sync:</strong> Once created, the system checks for
              updates every minute. You'll receive notifications when the status
              changes.
            </AlertDescription>
          </Alert>

          <div className='mt-4'>
            <h4 className='font-semibold mb-2'>Example Tracking Numbers:</h4>
            <CodeSnippet
              code={`FedEx: 123456789012
UPS: 1Z999AA10123456784
DHL: 1234567890`}
              language='text'
            />
          </div>
        </div>
      </TutorialCard>

      <TutorialCard
        title='Inviting Team Members'
        description='Collaborate with your team'
        stepNumber={4}>
        <div className='space-y-4'>
          <p>Grow your team and assign roles:</p>

          <ol className='list-decimal list-inside space-y-3 ml-4'>
            <li>
              <strong>Go to Users page</strong>
              <p className='ml-6 mt-1 text-muted-foreground'>
                Click "Users" in the sidebar
              </p>
            </li>
            <li>
              <strong>Click "Invite User"</strong>
              <p className='ml-6 mt-1 text-muted-foreground'>
                Enter their email address
              </p>
            </li>
            <li>
              <strong>Assign a role</strong>
              <div className='ml-6 mt-2 space-y-2'>
                <p className='text-sm'>
                  <strong>Admin:</strong> Full access to all features and
                  settings
                </p>
                <p className='text-sm'>
                  <strong>Staff:</strong> Can manage shipments and leads,
                  limited settings access
                </p>
              </div>
            </li>
            <li>
              <strong>Send invitation</strong>
              <p className='ml-6 mt-1 text-muted-foreground'>
                They'll receive an email with a login link
              </p>
            </li>
          </ol>

          <Alert>
            <AlertDescription>
              <strong>Note:</strong> Only Admin users can invite new team
              members and manage user roles.
            </AlertDescription>
          </Alert>
        </div>
      </TutorialCard>

      <div className='mt-8 p-6 border rounded-lg bg-muted/30'>
        <h3 className='text-lg font-semibold mb-2'>🎉 You're All Set!</h3>
        <p className='text-muted-foreground mb-4'>
          You've completed the basic setup. Explore other sections to learn
          about advanced features:
        </p>
        <ul className='list-disc list-inside space-y-1 text-sm text-muted-foreground'>
          <li>Bulk shipment imports and operations</li>
          <li>Lead management and conversion</li>
          <li>Analytics and custom reports</li>
          <li>Notification configuration and webhooks</li>
        </ul>
      </div>
    </div>
  );
}
