/** @format */

'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Settings as SettingsIcon,
  Bell,
  Truck,
  Loader2,
  Save,
  TestTube,
  Building2,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  getSettings,
  updateSettings,
  testNotificationConnection,
  testWebhook,
  getAllTenants,
  getNotificationConfig,
  updateNotificationConfig,
  getSystemStatus,
} from './actions';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [notifSettings, setNotifSettings] = useState<any>({
    provider_id: 'smtp',
    credentials: {},
    config: { from_email: '', from_name: '' },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Tenant switching for Admins
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    setMounted(true);
    // Determine if user is admin and fetch tenants
    checkAdminAndFetchTenants();
  }, []);

  useEffect(() => {
    if (activeTab === 'status') {
      checkSystemStatus();
    }
  }, [activeTab]);

  useEffect(() => {
    // Re-load settings when tenant selection changes (or on initial load)
    loadSettings(selectedTenantId);
  }, [selectedTenantId]);

  const checkAdminAndFetchTenants = async () => {
    const result = await getAllTenants();
    if (result.success) {
      setIsAdminUser(true);
      if (result.data && result.data.length > 0) {
        setTenants(result.data);
        if (!selectedTenantId) {
          setSelectedTenantId(result.data[0].id);
        }
      }
    } else {
      setIsAdminUser(false);
    }
  };

  const loadSettings = async (tenantId?: string) => {
    setIsLoading(true);
    const [settingsRes, notifRes] = await Promise.all([
      getSettings(tenantId),
      getNotificationConfig(tenantId, 'email'),
    ]);

    if (settingsRes.success) {
      setSettings(settingsRes.data);
    } else {
      if (tenantId || tenants.length > 0) {
        toast.error(settingsRes.error || 'Failed to load settings');
      }
    }

    if (notifRes.success) {
      if (notifRes.data) {
        setNotifSettings(notifRes.data);
      } else {
        setNotifSettings({
          provider_id: 'smtp',
          credentials: {},
          config: { from_email: '', from_name: '' },
        });
      }
    }

    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Always update settings, optionally update notif config if changed or active
    // Simple approach: Update both
    const [settingsRes, notifRes] = await Promise.all([
      updateSettings(settings, selectedTenantId),
      updateNotificationConfig(notifSettings, selectedTenantId),
    ]);

    if (settingsRes.success && notifRes.success) {
      toast.success('Settings saved successfully');
    } else {
      toast.error(
        settingsRes.error || notifRes.error || 'Failed to save settings',
      );
    }
    setIsSaving(false);
  };

  const handleTestConnection = async () => {
    const result = await testNotificationConnection({
      provider_id: notifSettings.provider_id,
      credentials: notifSettings.credentials,
      from_email: notifSettings.config?.from_email,
    });

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }
  };

  const handleTestWebhook = async () => {
    const result = await testWebhook(settings.webhook_url);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }
  };

  const checkSystemStatus = async () => {
    setIsCheckingStatus(true);
    const result = await getSystemStatus();
    if (result.success) {
      setSystemStatus(result.data);
    } else {
      toast.error('Failed to check system status: ' + result.error);
    }
    setIsCheckingStatus(false);
  };

  if (!mounted || isLoading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            <SettingsIcon className='h-8 w-8' />
            Settings
          </h1>
          <p className='text-muted-foreground mt-1'>
            Manage your application preferences and configuration
          </p>
        </div>

        <div className='flex items-center gap-2'>
          {tenants.length > 0 && (
            <Select
              value={selectedTenantId}
              onValueChange={setSelectedTenantId}>
              <SelectTrigger className='w-[200px]'>
                <SelectValue placeholder='Select Tenant' />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.country_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Saving...
              </>
            ) : (
              <>
                <Save className='mr-2 h-4 w-4' />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='space-y-4'>
        <TabsList className='grid w-full grid-cols-4 lg:w-auto'>
          <TabsTrigger value='general' className='gap-2'>
            <Building2 className='h-4 w-4' />
            <span className='hidden sm:inline'>General</span>
          </TabsTrigger>
          {isAdminUser && (
            <TabsTrigger value='notifications' className='gap-2'>
              <Bell className='h-4 w-4' />
              <span className='hidden sm:inline'>Notifications</span>
            </TabsTrigger>
          )}
          <TabsTrigger value='tracking' className='gap-2'>
            <Truck className='h-4 w-4' />
            <span className='hidden sm:inline'>Tracking</span>
          </TabsTrigger>
          <TabsTrigger value='status' className='gap-2'>
            <Activity className='h-4 w-4' />
            <span className='hidden sm:inline'>System Status</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value='general' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Basic information about your organization
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='company_name'>Company Name</Label>
                  <Input
                    id='company_name'
                    value={settings?.company_name || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, company_name: e.target.value })
                    }
                    placeholder='Acme Inc.'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='company_logo_url'>Logo URL</Label>
                  <Input
                    id='company_logo_url'
                    value={settings?.company_logo_url || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        company_logo_url: e.target.value,
                      })
                    }
                    placeholder='https://example.com/logo.png'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='brand_color'>Brand Color (Hex)</Label>
                  <div className='flex gap-2'>
                    <Input
                      id='brand_color'
                      type='color'
                      className='w-12 p-1 h-10 cursor-pointer'
                      value={settings?.brand_color || '#2563EB'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          brand_color: e.target.value,
                        })
                      }
                    />
                    <Input
                      value={settings?.brand_color || '#2563EB'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          brand_color: e.target.value,
                        })
                      }
                      placeholder='#2563EB'
                      className='font-mono uppercas'
                    />
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='company_address'>Company Address</Label>
                  <Input
                    id='company_address'
                    value={settings?.company_address || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        company_address: e.target.value,
                      })
                    }
                    placeholder='123 Business St, City, Country'
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regional Settings</CardTitle>
              <CardDescription>
                Configure timezone, date format, and currency
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4 sm:grid-cols-3'>
                <div className='space-y-2'>
                  <Label htmlFor='timezone'>Timezone</Label>
                  <Select
                    value={settings?.timezone}
                    onValueChange={(value) =>
                      setSettings({ ...settings, timezone: value })
                    }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='UTC'>UTC</SelectItem>
                      <SelectItem value='America/New_York'>
                        Eastern Time
                      </SelectItem>
                      <SelectItem value='America/Chicago'>
                        Central Time
                      </SelectItem>
                      <SelectItem value='America/Los_Angeles'>
                        Pacific Time
                      </SelectItem>
                      <SelectItem value='Asia/Kolkata'>India (IST)</SelectItem>
                      <SelectItem value='Europe/London'>
                        London (GMT)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='date_format'>Date Format</Label>
                  <Select
                    value={settings?.date_format}
                    onValueChange={(value) =>
                      setSettings({ ...settings, date_format: value })
                    }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='MM/DD/YYYY'>MM/DD/YYYY</SelectItem>
                      <SelectItem value='DD/MM/YYYY'>DD/MM/YYYY</SelectItem>
                      <SelectItem value='YYYY-MM-DD'>YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='currency'>Currency</Label>
                  <Select
                    value={settings?.currency}
                    onValueChange={(value) =>
                      setSettings({ ...settings, currency: value })
                    }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='USD'>USD ($)</SelectItem>
                      <SelectItem value='EUR'>EUR (€)</SelectItem>
                      <SelectItem value='GBP'>GBP (£)</SelectItem>
                      <SelectItem value='INR'>INR (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value='notifications' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure when and how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Email Notifications</Label>
                  <p className='text-sm text-muted-foreground'>
                    Receive email alerts for shipment updates
                  </p>
                </div>
                <Switch
                  checked={!!settings?.email_notifications_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      email_notifications_enabled: checked,
                    })
                  }
                />
              </div>

              {settings?.email_notifications_enabled && (
                <div className='mt-6 space-y-3'>
                  <Label>Notification Triggers</Label>
                  <p className='text-sm text-muted-foreground'>
                    Select which shipment statuses should trigger an email
                    notification.
                  </p>
                  <div className='grid grid-cols-2 gap-4 mt-2'>
                    {[
                      { id: 'info_received', label: 'Info Received' },
                      { id: 'in_transit', label: 'In Transit' },
                      { id: 'out_for_delivery', label: 'Out for Delivery' },
                      { id: 'delivered', label: 'Delivered' },
                      { id: 'exception', label: 'Exception' },
                      { id: 'failed_attempt', label: 'Failed Attempt' },
                      {
                        id: 'available_for_pickup',
                        label: 'Available for Pickup',
                      },
                      { id: 'expired', label: 'Expired' },
                    ].map((trigger) => (
                      <div
                        key={trigger.id}
                        className='flex items-center space-x-2'>
                        <Switch
                          id={`trigger-${trigger.id}`}
                          checked={settings?.notification_triggers?.includes(
                            trigger.id,
                          )}
                          onCheckedChange={(checked) => {
                            const triggers =
                              settings.notification_triggers || [];
                            if (checked) {
                              setSettings({
                                ...settings,
                                notification_triggers: [
                                  ...triggers,
                                  trigger.id,
                                ],
                              });
                            } else {
                              setSettings({
                                ...settings,
                                notification_triggers: triggers.filter(
                                  (t: string) => t !== trigger.id,
                                ),
                              });
                            }
                          }}
                        />
                        <Label htmlFor={`trigger-${trigger.id}`}>
                          {trigger.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Provider Configuration</CardTitle>
              <CardDescription>
                Configure how shipment notifications are sent
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>Provider</Label>
                <Select
                  value={notifSettings?.provider_id || 'smtp'}
                  onValueChange={(val) =>
                    setNotifSettings({ ...notifSettings, provider_id: val })
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='smtp'>SMTP (Gmail/Outlook)</SelectItem>
                    <SelectItem value='zeptomail'>ZeptoMail (Zoho)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {notifSettings?.provider_id === 'zeptomail' ? (
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='zepto_api_key'>
                      Send Mail Token (API Key)
                    </Label>
                    <div className='relative'>
                      <Input
                        id='zepto_api_key'
                        type='password'
                        value={notifSettings.credentials?.api_key || ''}
                        onChange={(e) =>
                          setNotifSettings({
                            ...notifSettings,
                            credentials: {
                              ...notifSettings.credentials,
                              api_key: e.target.value,
                            },
                          })
                        }
                        placeholder='Zoho ZeptoMail Token'
                      />
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      From ZeptoMail Dashboard &gt; Mail Agents &gt; Setup Info
                    </p>
                  </div>
                </div>
              ) : (
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label>SMTP Host</Label>
                    <Input
                      value={notifSettings.credentials?.host || ''}
                      onChange={(e) =>
                        setNotifSettings({
                          ...notifSettings,
                          credentials: {
                            ...notifSettings.credentials,
                            host: e.target.value,
                          },
                        })
                      }
                      placeholder='smtp.gmail.com'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>SMTP Port</Label>
                    <Input
                      type='number'
                      value={notifSettings.credentials?.port || ''}
                      onChange={(e) =>
                        setNotifSettings({
                          ...notifSettings,
                          credentials: {
                            ...notifSettings.credentials,
                            port: parseInt(e.target.value),
                          },
                        })
                      }
                      placeholder='587'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Username</Label>
                    <Input
                      value={notifSettings.credentials?.user || ''}
                      onChange={(e) =>
                        setNotifSettings({
                          ...notifSettings,
                          credentials: {
                            ...notifSettings.credentials,
                            user: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Password</Label>
                    <Input
                      type='password'
                      value={notifSettings.credentials?.pass || ''}
                      onChange={(e) =>
                        setNotifSettings({
                          ...notifSettings,
                          credentials: {
                            ...notifSettings.credentials,
                            pass: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              <Separator />

              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label>From Email</Label>
                  <Input
                    value={notifSettings.config?.from_email || ''}
                    onChange={(e) =>
                      setNotifSettings({
                        ...notifSettings,
                        config: {
                          ...notifSettings.config,
                          from_email: e.target.value,
                        },
                      })
                    }
                    placeholder='noreply@domain.com'
                  />
                </div>
                <div className='space-y-2'>
                  <Label>From Name</Label>
                  <Input
                    value={notifSettings.config?.from_name || ''}
                    onChange={(e) =>
                      setNotifSettings({
                        ...notifSettings,
                        config: {
                          ...notifSettings.config,
                          from_name: e.target.value,
                        },
                      })
                    }
                    placeholder='Gajan Shipping'
                  />
                </div>

                <div className='col-span-2'>
                  <Button
                    onClick={handleTestConnection}
                    variant='outline'
                    className='w-full sm:w-auto'>
                    <TestTube className='mr-2 h-4 w-4' />
                    Test Connection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tracking Settings */}
        <TabsContent value='tracking' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Tracking Provider</CardTitle>
              <CardDescription>
                Configure your tracking service provider
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='p-4 border rounded-lg bg-muted/50 text-sm text-muted-foreground'>
                Tracking API configuration is managed via environment variables
                (<code>TRACK123_API_KEY</code>).
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Auto-Sync Settings</CardTitle>
              <CardDescription>
                Configure automatic shipment synchronization
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Enable Auto-Sync</Label>
                  <p className='text-sm text-muted-foreground'>
                    Automatically sync shipment status in the background
                  </p>
                </div>
                <Switch
                  checked={!!settings?.auto_sync_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, auto_sync_enabled: checked })
                  }
                />
              </div>
              <Separator />
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='auto_sync_frequency'>Sync Frequency</Label>
                  <Select
                    value={settings?.auto_sync_frequency}
                    onValueChange={(value) =>
                      setSettings({ ...settings, auto_sync_frequency: value })
                    }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='1h'>Every Hour</SelectItem>
                      <SelectItem value='6h'>Every 6 Hours</SelectItem>
                      <SelectItem value='12h'>Every 12 Hours</SelectItem>
                      <SelectItem value='24h'>Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='sync_retry_attempts'>Retry Attempts</Label>
                  <Input
                    id='sync_retry_attempts'
                    type='number'
                    min='1'
                    max='10'
                    value={settings?.sync_retry_attempts || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sync_retry_attempts: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>
                Receive real-time updates via webhook
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='webhook_url'>Webhook URL</Label>
                <Input
                  id='webhook_url'
                  value={settings?.webhook_url || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, webhook_url: e.target.value })
                  }
                  placeholder='https://your-domain.com/webhook'
                />
              </div>
              <Button
                onClick={handleTestWebhook}
                variant='outline'
                className='w-full sm:w-auto'>
                <TestTube className='mr-2 h-4 w-4' />
                Test Webhook
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Status Tab */}
        <TabsContent value='status' className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-lg font-medium'>System Heath Check</h2>
              <p className='text-sm text-muted-foreground'>
                Real-time status of system components and integrations
              </p>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={checkSystemStatus}
              disabled={isCheckingStatus}>
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isCheckingStatus ? 'animate-spin' : ''}`}
              />
              Refresh Status
            </Button>
          </div>

          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {/* Database Status */}
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Database</CardTitle>
                <Activity className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='flex items-center gap-2'>
                  {systemStatus?.database?.status === 'ok' ? (
                    <CheckCircle className='h-5 w-5 text-green-500' />
                  ) : (
                    <XCircle className='h-5 w-5 text-red-500' />
                  )}
                  <div className='text-2xl font-bold'>
                    {systemStatus?.database?.status === 'ok'
                      ? 'Connected'
                      : 'Error'}
                  </div>
                </div>
                <p className='text-xs text-muted-foreground mt-1'>
                  {systemStatus?.database?.message}
                  {systemStatus?.database?.latency > 0 &&
                    ` (${systemStatus.database.latency}ms)`}
                </p>
              </CardContent>
            </Card>

            {/* Email Service Status */}
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Email Service
                </CardTitle>
                <Activity className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='flex items-center gap-2'>
                  {systemStatus?.email?.status === 'ok' ? (
                    <CheckCircle className='h-5 w-5 text-green-500' />
                  ) : systemStatus?.email?.status === 'warning' ? (
                    <AlertTriangle className='h-5 w-5 text-yellow-500' />
                  ) : (
                    <XCircle className='h-5 w-5 text-red-500' />
                  )}
                  <div className='text-2xl font-bold'>
                    {systemStatus?.email?.status === 'ok'
                      ? 'Operational'
                      : systemStatus?.email?.status === 'warning'
                        ? 'Warning'
                        : 'Offline'}
                  </div>
                </div>
                <p className='text-xs text-muted-foreground mt-1'>
                  {systemStatus?.email?.message || 'Checking...'}
                </p>
              </CardContent>
            </Card>

            {/* Tracking API Status */}
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Tracking API
                </CardTitle>
                <Activity className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='flex items-center gap-2'>
                  {systemStatus?.tracking?.status === 'ok' ? (
                    <CheckCircle className='h-5 w-5 text-green-500' />
                  ) : (
                    <XCircle className='h-5 w-5 text-red-500' />
                  )}
                  <div className='text-2xl font-bold'>
                    {systemStatus?.tracking?.status === 'ok'
                      ? 'Configured'
                      : 'Missing Key'}
                  </div>
                </div>
                <p className='text-xs text-muted-foreground mt-1'>
                  {systemStatus?.tracking?.message || 'Checking...'}
                </p>
              </CardContent>
            </Card>

            {/* Environment Status */}
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Environment
                </CardTitle>
                <Activity className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='flex items-center gap-2'>
                  {systemStatus?.env?.status === 'ok' ? (
                    <CheckCircle className='h-5 w-5 text-green-500' />
                  ) : (
                    <XCircle className='h-5 w-5 text-red-500' />
                  )}
                  <div className='text-2xl font-bold'>
                    {systemStatus?.env?.status === 'ok' ? 'Loaded' : 'Error'}
                  </div>
                </div>
                <p className='text-xs text-muted-foreground mt-1'>
                  Server Environment Variables
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
