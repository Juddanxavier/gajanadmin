/** @format */

import { TutorialCard } from '../tutorial-card';
import { Settings, Key, User, Palette, Plug } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function SettingsGuide() {
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
          <Settings className='h-8 w-8' />
          System Settings
        </h2>
        <p className='text-muted-foreground mt-2'>
          Personalize your experience and manage system configurations.
        </p>
      </div>

      <TutorialCard
        title='Profile Settings'
        description='Manage your personal account'
        icon={<User className='h-5 w-5' />}
        defaultExpanded>
        <div className='space-y-4'>
          <p>Update your personal information:</p>

          <ol className='list-decimal list-inside space-y-2 ml-4 text-sm'>
            <li>Click your avatar in the top-right</li>
            <li>
              Select <strong>Profile</strong>
            </li>
            <li>
              You can update:
              <ul className='list-disc list-inside ml-6 mt-1 text-muted-foreground'>
                <li>Profile details (Name, Bio)</li>
                <li>Password security</li>
                <li>Email preferences</li>
              </ul>
            </li>
          </ol>
        </div>
      </TutorialCard>

      <TutorialCard
        title='Appearance & Theme'
        description='Customize the look and feel'
        icon={<Palette className='h-5 w-5' />}>
        <div className='space-y-4'>
          <p>Switch between Light and Dark modes:</p>
          <ul className='list-disc list-inside space-y-2 ml-4 text-sm'>
            <li>
              <strong>System:</strong> Matches your device setting
            </li>
            <li>
              <strong>Light:</strong> Standard bright interface
            </li>
            <li>
              <strong>Dark:</strong> High-contrast dark interface
            </li>
          </ul>
        </div>
      </TutorialCard>

      <TutorialCard
        title='API Keys'
        description='Manage access for external applications'
        icon={<Key className='h-5 w-5' />}>
        <div className='space-y-4'>
          <p>Generate keys for API access:</p>

          <ol className='list-decimal list-inside space-y-2 ml-4 text-sm'>
            <li>
              Navigate to <strong>Settings {'>'} API Keys</strong>
            </li>
            <li>
              Click <strong>"Generate New Key"</strong>
            </li>
            <li>
              Give the key a descriptive name (e.g., "Zapier Integration")
            </li>
            <li>Copy the key immediately - it won't be shown again</li>
          </ol>

          <Alert variant='destructive'>
            <AlertDescription>
              Never share your API keys or commit them to public repositories.
              They provide full access to your account.
            </AlertDescription>
          </Alert>
        </div>
      </TutorialCard>

      <TutorialCard
        title='Integrations'
        description='Connect with other services'
        icon={<Plug className='h-5 w-5' />}>
        <div className='space-y-4'>
          <p>Connect GT Express with your favorite tools:</p>

          <div className='grid gap-3 md:grid-cols-2'>
            <div className='p-3 border rounded-lg'>
              <h4 className='font-semibold text-sm'>Track123</h4>
              <p className='text-xs text-muted-foreground mt-1'>
                Primary provider for shipment tracking updates
              </p>
            </div>
            <div className='p-3 border rounded-lg'>
              <h4 className='font-semibold text-sm'>Slack / Discord</h4>
              <p className='text-xs text-muted-foreground mt-1'>
                Receive notifications in your team chat channels
              </p>
            </div>
          </div>
        </div>
      </TutorialCard>
    </div>
  );
}
