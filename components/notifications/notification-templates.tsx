"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, MessageSquare, Eye, Save, Send, Settings, Key } from "lucide-react";
import { toast } from "sonner";
import { updateNotificationTemplates, sendTestNotification } from "../../app/(dashboard)/notifications/actions";

interface NotificationTemplatesProps {
  tenantId: string;
  initialTemplates: {
    email_template_subject?: string;
    email_template_body?: string;
    sms_template?: string;
    smtp_host?: string;
    smtp_port?: number;
    smtp_username?: string;
    smtp_password?: string;
    smtp_from_email?: string;
    smtp_from_name?: string;
    sms_provider?: string;
    sms_account_sid?: string;
    sms_auth_token?: string;
    sms_from_number?: string;
  };
}

const AVAILABLE_VARIABLES = [
  { name: 'trackingCode', description: 'Shipment tracking code' },
  { name: 'status', description: 'Current shipment status' },
  { name: 'customerName', description: 'Customer name' },
  { name: 'location', description: 'Current location (optional)' },
  { name: 'trackingUrl', description: 'Link to tracking page' },
  { name: 'companyName', description: 'Your company name' },
];

export function NotificationTemplates({ tenantId, initialTemplates }: NotificationTemplatesProps) {
  const [activeTab, setActiveTab] = useState("templates");
  
  // Templates State
  const [emailSubject, setEmailSubject] = useState(initialTemplates.email_template_subject || '');
  const [emailBody, setEmailBody] = useState(initialTemplates.email_template_body || '');
  const [smsBody, setSmsBody] = useState(initialTemplates.sms_template || '');
  
  // Settings State
  const [smtpHost, setSmtpHost] = useState(initialTemplates.smtp_host || '');
  const [smtpPort, setSmtpPort] = useState(initialTemplates.smtp_port?.toString() || '');
  const [smtpUser, setSmtpUser] = useState(initialTemplates.smtp_username || '');
  const [smtpPass, setSmtpPass] = useState(initialTemplates.smtp_password || '');
  const [smtpFromEmail, setSmtpFromEmail] = useState(initialTemplates.smtp_from_email || '');
  const [smtpFromName, setSmtpFromName] = useState(initialTemplates.smtp_from_name || '');
  
  const [smsSid, setSmsSid] = useState(initialTemplates.sms_account_sid || '');
  const [smsToken, setSmsToken] = useState(initialTemplates.sms_auth_token || '');
  const [smsFromNumber, setSmsFromNumber] = useState(initialTemplates.sms_from_number || '');

  const [testEmail, setTestEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const updates = {
      // Templates
      email_template_subject: emailSubject,
      email_template_body: emailBody,
      sms_template: smsBody,
      
      // SMTP
      smtp_host: smtpHost,
      smtp_port: parseInt(smtpPort) || null,
      smtp_username: smtpUser,
      smtp_password: smtpPass,
      smtp_from_email: smtpFromEmail,
      smtp_from_name: smtpFromName,
      
      // SMS
      sms_account_sid: smsSid,
      sms_auth_token: smsToken,
      sms_from_number: smsFromNumber,
    };

    const result = await updateNotificationTemplates(tenantId, updates);

    if (result.success) {
      toast.success('Settings saved successfully!');
    } else {
      toast.error('Failed to save settings: ' + result.error);
    }
    setIsSaving(false);
  };

  const handleSendTest = async (type: 'email' | 'sms') => {
    if (!testEmail) {
      toast.error('Please enter a test email/phone');
      return;
    }

    const result = await sendTestNotification(testEmail, type);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error('Failed to send test notification');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
          <p className="text-muted-foreground mr-1">
            Configure how you send notifications and what they look like.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="templates">
            <Mail className="mr-2 h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        {/* TEMPLATES TAB */}
        <TabsContent value="templates" className="space-y-6">
           <Card>
            <CardHeader>
              <CardTitle>Available Variables</CardTitle>
              <CardDescription>
                Click to copy variables to clipboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_VARIABLES.map((variable) => (
                  <Badge
                    key={variable.name}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => {
                      navigator.clipboard.writeText(`{{${variable.name}}}`);
                      toast.success(`Copied {{${variable.name}}}`);
                    }}
                  >
                    {`{{${variable.name}}}`}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Email Template */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Email Template</h3>
              <div className="space-y-2">
                <Label>Subject Line</Label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Shipment Update: {{trackingCode}}"
                />
              </div>
              <div className="space-y-2">
                <Label>Email Body</Label>
                <Textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Hello {{customerName}}..."
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                  <Input 
                      placeholder="Test email address" 
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <Button variant="outline" size="sm" onClick={() => handleSendTest('email')}>Send Test</Button>
              </div>
            </div>

            {/* SMS Template */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">SMS Template</h3>
              <div className="space-y-2">
                <Label>SMS Message</Label>
                <Textarea
                  value={smsBody}
                  onChange={(e) => setSmsBody(e.target.value)}
                  placeholder="Status update..."
                  className="min-h-[150px] font-mono text-sm"
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">{smsBody.length}/160 characters</p>
              </div>
              <div className="flex gap-2">
                   <Input 
                      placeholder="Test phone number" 
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <Button variant="outline" size="sm" onClick={() => handleSendTest('sms')}>Send Test</Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* SMTP Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    SMTP Email Settings
                </CardTitle>
                <CardDescription>Configure your email provider (e.g., Gmail, SendGrid, Amazon SES)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>SMTP Host</Label>
                        <Input placeholder="smtp.example.com" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>SMTP Port</Label>
                        <Input placeholder="587" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Username</Label>
                        <Input placeholder="user@example.com" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label>Password</Label>
                        <Input type="password" placeholder="••••••••" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>From Name</Label>
                    <Input placeholder="My Company Logistics" value={smtpFromName} onChange={(e) => setSmtpFromName(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label>From Email</Label>
                    <Input placeholder="notifications@mycompany.com" value={smtpFromEmail} onChange={(e) => setSmtpFromEmail(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* SMS Settings */}
            <Card>
               <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    SMS Settings (Twilio)
                </CardTitle>
                <CardDescription>Configure Twilio credentials for SMS notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label>Account SID</Label>
                    <Input placeholder="ACxxxxxxxxxxxxxxxx" value={smsSid} onChange={(e) => setSmsSid(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label>Auth Token</Label>
                    <Input type="password" placeholder="••••••••" value={smsToken} onChange={(e) => setSmsToken(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label>From Number</Label>
                    <Input placeholder="+1234567890" value={smsFromNumber} onChange={(e) => setSmsFromNumber(e.target.value)} />
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
