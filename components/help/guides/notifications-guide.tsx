/** @format */

import { TutorialCard } from '../tutorial-card';
import { CodeSnippet } from '../code-snippet';
import { Bell, Webhook, Mail, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function NotificationsGuide() {
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
          <Bell className='h-8 w-8' />
          Notifications
        </h2>
        <p className='text-muted-foreground mt-2'>
          Configure how and when your customers receive updates.
        </p>
      </div>

      <TutorialCard
        title='Email Configuration'
        description='Setup email sending settings'
        icon={<Mail className='h-5 w-5' />}
        defaultExpanded>
        <div className='space-y-4'>
          <p>Configure your SMTP or API provider to send emails:</p>

          <ol className='list-decimal list-inside space-y-2 ml-4 text-sm'>
            <li>
              Go to <strong>Settings {'>'} Email</strong>
            </li>
            <li>Enter your provider credentials (e.g., SendGrid, AWS SES)</li>
            <li>Verify your sender identity</li>
            <li>Send a test email to verify configuration</li>
          </ol>

          <Alert>
            <AlertDescription>
              We recommend using a dedicated email delivery service for high
              deliverability rates.
            </AlertDescription>
          </Alert>
        </div>
      </TutorialCard>

      <TutorialCard
        title='Webhook Setup'
        description='Real-time updates to external systems'
        icon={<Webhook className='h-5 w-5' />}>
        <div className='space-y-4'>
          <p>
            Receive JSON payloads to your own server whenever a shipment status
            changes:
          </p>

          <ol className='list-decimal list-inside space-y-2 ml-4 text-sm'>
            <li>
              Go to <strong>Settings {'>'} Webhooks</strong>
            </li>
            <li>
              Click <strong>"Add Endpoint"</strong>
            </li>
            <li>
              Enter your URL (e.g., https://api.yoursite.com/webhooks/shipment)
            </li>
            <li>
              Select events to listen for (e.g., shipment.created,
              shipment.updated)
            </li>
            <li>Save the configuration</li>
          </ol>

          <div className='mt-4'>
            <h4 className='font-semibold mb-2'>Sample Payload:</h4>
            <CodeSnippet
              code={`{
  "event": "shipment.updated",
  "data": {
    "id": "shp_123456",
    "tracking_number": "1Z999...",
    "status": "in_transit",
    "carrier": "UPS",
    "estimated_delivery": "2024-03-20"
  },
  "timestamp": "2024-03-18T10:30:00Z"
}`}
              language='json'
            />
          </div>
        </div>
      </TutorialCard>

      <TutorialCard
        title='Debugging Notification Issues'
        description='Troubleshoot delivery failures'
        icon={<AlertTriangle className='h-5 w-5' />}>
        <div className='space-y-4'>
          <p>If customers aren't receiving emails:</p>

          <ol className='list-decimal list-inside space-y-2 ml-4 text-sm'>
            <li>
              Check <strong>Notifications {'>'} Logs</strong>
            </li>
            <li>Review the status column (Sent, Failed, Queued)</li>
            <li>Click on a log entry to see the detailed error message</li>
          </ol>

          <div className='bg-muted/30 p-4 rounded-lg space-y-2'>
            <h4 className='font-semibold text-sm'>Common Errors:</h4>
            <ul className='list-disc list-inside text-sm text-muted-foreground'>
              <li>
                <strong>Auth Failed:</strong> Invalid API key or SMTP password
              </li>
              <li>
                <strong>Bounce:</strong> Recipient email address doesn't exist
              </li>
              <li>
                <strong>Rate Limited:</strong> Sending too many emails too
                quickly
              </li>
            </ul>
          </div>
        </div>
      </TutorialCard>
    </div>
  );
}
