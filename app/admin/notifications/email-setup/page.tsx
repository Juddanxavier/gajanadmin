import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { CopyButton } from '@/components/notifications/copy-button';

export default async function EmailSetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get webhook secret from environment
  const webhookSecret = process.env.NOTIFICATION_WEBHOOK_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // For now, we'll skip the trigger check (would need custom RPC function)
  const triggerExists = null;

  return (
    <div className="container mx-auto py-10 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Notification Setup</h1>
        <p className="text-muted-foreground">Configure automatic email notifications for shipment updates</p>
      </div>

      {/* Step 1: Check Environment Variable */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {webhookSecret ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            Step 1: Webhook Secret
          </CardTitle>
          <CardDescription>
            Secure key for database trigger authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {webhookSecret ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                ✅ Webhook secret is configured in .env.local
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ❌ Missing NOTIFICATION_WEBHOOK_SECRET in .env.local
              </AlertDescription>
            </Alert>
          )}

          {!webhookSecret && (
            <div className="bg-muted p-4 rounded-md space-y-2">
              <p className="text-sm font-medium">Add to .env.local:</p>
              <code className="block bg-background p-3 rounded text-sm">
                NOTIFICATION_WEBHOOK_SECRET=your-secret-key-here
              </code>
              <p className="text-xs text-muted-foreground">
                Generate a secure key: <code>node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"</code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Database Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Step 2: Configure Database
          </CardTitle>
          <CardDescription>
            Run this SQL in Supabase SQL Editor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-md space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Copy and run this SQL:</p>
              <CopyButton 
                text={`-- Configure Email Notification Settings
ALTER DATABASE postgres SET app.nextjs_api_url = '${siteUrl}';
ALTER DATABASE postgres SET app.webhook_secret = '${webhookSecret || 'YOUR_WEBHOOK_SECRET_HERE'}';`}
              />
            </div>
            <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
{`-- Configure Email Notification Settings
ALTER DATABASE postgres SET app.nextjs_api_url = '${siteUrl}';
ALTER DATABASE postgres SET app.webhook_secret = '${webhookSecret || 'YOUR_WEBHOOK_SECRET_HERE'}';`}
            </pre>
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              💡 For production, change the URL to your production domain (e.g., https://your-app.vercel.app)
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Step 3: Apply Migration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {triggerExists ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            Step 3: Apply Database Trigger
          </CardTitle>
          <CardDescription>
            Create trigger to send emails on status change
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {triggerExists ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                ✅ Email notification trigger is active
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  ❌ Trigger not found. Apply the migration file.
                </AlertDescription>
              </Alert>
              
              <div className="bg-muted p-4 rounded-md space-y-2">
                <p className="text-sm font-medium">Run migration file:</p>
                <code className="block bg-background p-3 rounded text-sm">
                  supabase/migrations/20251230_apply_email_trigger.sql
                </code>
                <p className="text-xs text-muted-foreground">
                  Copy and paste the entire file contents into Supabase SQL Editor
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Step 4: Configure Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            Step 4: Configure Email for Each Tenant
          </CardTitle>
          <CardDescription>
            Set up ZeptoMail credentials per tenant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Go to <a href="/admin/notifications/settings" className="text-primary hover:underline font-medium">Notification Settings</a> and configure:
          </p>
          <ul className="text-sm space-y-2 ml-4 list-disc">
            <li>Channel: Email</li>
            <li>Provider: ZeptoMail</li>
            <li>API Key: Your ZeptoMail API key</li>
            <li>From Email: noreply@yourdomain.com (verified in ZeptoMail)</li>
            <li>From Name: Your Company Name</li>
            <li>Company Name: Your Company</li>
            <li>Tracking URL: {siteUrl}</li>
            <li>Active: ✅ Yes</li>
          </ul>
        </CardContent>
      </Card>

      {/* Step 5: Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-purple-500" />
            Step 5: Test Email Notifications
          </CardTitle>
          <CardDescription>
            Verify everything works
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-md space-y-2">
            <p className="text-sm font-medium">Run test script:</p>
            <code className="block bg-background p-3 rounded text-sm">
              npx tsx scripts/create-mock-shipment.ts
            </code>
          </div>

          <div className="bg-muted p-4 rounded-md space-y-2">
            <p className="text-sm font-medium">Check logs:</p>
            <code className="block bg-background p-3 rounded text-xs">
              SELECT recipient, subject, status, created_at<br />
              FROM notification_logs<br />
              WHERE type = 'email'<br />
              ORDER BY created_at DESC<br />
              LIMIT 10;
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Documentation Link */}
      <Alert>
        <AlertDescription className="text-sm">
          📚 For detailed documentation, see: <code className="bg-muted px-2 py-1 rounded">docs/NEXTJS_EMAIL_NOTIFICATIONS.md</code>
        </AlertDescription>
      </Alert>
    </div>
  );
}
