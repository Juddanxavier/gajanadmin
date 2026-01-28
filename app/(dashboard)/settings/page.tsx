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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Settings as SettingsIcon,
  Bell,
  Truck,
  Users,
  Palette,
  Package,
  Loader2,
  Save,
  TestTube,
  CheckCircle2,
  AlertCircle,
  Building2,
  Globe,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Database,
} from 'lucide-react';
import {
  getSettings,
  updateSettings,
  testNotificationConnection,
  testWebhook,
  getAllTenants,
  getNotificationConfig,
  updateNotificationConfig,
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
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [useMockData, setUseMockData] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  // Tenant switching for Admins
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    // Determine if user is admin and fetch tenants
    checkAdminAndFetchTenants();
    // Load mock data setting from localStorage
    const storedMockData = localStorage.getItem('use-mock-data');
    if (storedMockData !== null) {
      setUseMockData(storedMockData === 'true');
    }
  }, []);

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
      getNotificationConfig(tenantId),
    ]);

    if (settingsRes.success) {
      setSettings(settingsRes.data);
    } else {
      // Only show error if we explicitly requested a tenant or if we know tenants exist but failed
      // This prevents "No tenant found" error on initial load for Admins before auto-select occurs
      if (tenantId || tenants.length > 0) {
        toast.error(settingsRes.error || 'Failed to load settings');
      }
    }

    if (notifRes.success) {
      if (notifRes.data) {
        setNotifSettings(notifRes.data);
      } else {
        // Defaults if no record
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

  if (isLoading) {
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
        <TabsList className='grid w-full grid-cols-7 lg:w-auto'>
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
          <TabsTrigger value='users' className='gap-2'>
            <Users className='h-4 w-4' />
            <span className='hidden sm:inline'>Users</span>
          </TabsTrigger>
          <TabsTrigger value='appearance' className='gap-2'>
            <Palette className='h-4 w-4' />
            <span className='hidden sm:inline'>Appearance</span>
          </TabsTrigger>
          <TabsTrigger value='shipments' className='gap-2'>
            <Package className='h-4 w-4' />
            <span className='hidden sm:inline'>Shipments</span>
          </TabsTrigger>
          <TabsTrigger value='developer' className='gap-2'>
            <Database className='h-4 w-4' />
            <span className='hidden sm:inline'>Developer</span>
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
                  checked={settings?.email_notifications_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      email_notifications_enabled: checked,
                    })
                  }
                />
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>SMS Notifications</Label>
                  <p className='text-sm text-muted-foreground'>
                    Receive SMS alerts for critical updates
                  </p>
                </div>
                <Switch
                  checked={settings?.sms_notifications_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      sms_notifications_enabled: checked,
                    })
                  }
                />
              </div>
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
              <div className='space-y-2'>
                <Label htmlFor='track123_api_key'>Track123 API Key</Label>
                <Input
                  id='track123_api_key'
                  value={settings?.track123_api_key || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      track123_api_key: e.target.value,
                    })
                  }
                  placeholder='Enter your Track123 API key'
                  type='password'
                />
                <p className='text-xs text-muted-foreground'>
                  Get your API key from Track123 dashboard
                </p>
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
                  checked={settings?.auto_sync_enabled}
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

        {/* User & Access Settings */}
        <TabsContent value='users' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Default User Settings</CardTitle>
              <CardDescription>
                Configure default settings for new users
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='default_user_role'>Default Role</Label>
                <Select
                  value={settings?.default_user_role}
                  onValueChange={(value) =>
                    setSettings({ ...settings, default_user_role: value })
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='customer'>Customer</SelectItem>
                    <SelectItem value='staff'>Staff</SelectItem>
                    <SelectItem value='admin'>Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Password Requirements</CardTitle>
              <CardDescription>
                Set password complexity requirements
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-2'>
                <Label htmlFor='password_min_length'>Minimum Length</Label>
                <Input
                  id='password_min_length'
                  type='number'
                  min='6'
                  max='32'
                  value={settings?.password_min_length || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      password_min_length: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <Label>Require Uppercase Letters</Label>
                <Switch
                  checked={settings?.password_require_uppercase}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      password_require_uppercase: checked,
                    })
                  }
                />
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <Label>Require Numbers</Label>
                <Switch
                  checked={settings?.password_require_numbers}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      password_require_numbers: checked,
                    })
                  }
                />
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <Label>Require Symbols</Label>
                <Switch
                  checked={settings?.password_require_symbols}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      password_require_symbols: checked,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security and session settings
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-2'>
                <Label htmlFor='session_timeout_minutes'>
                  Session Timeout (minutes)
                </Label>
                <Input
                  id='session_timeout_minutes'
                  type='number'
                  min='15'
                  max='10080'
                  value={settings?.session_timeout_minutes || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      session_timeout_minutes: parseInt(e.target.value),
                    })
                  }
                />
                <p className='text-xs text-muted-foreground'>
                  Default: 1440 minutes (24 hours)
                </p>
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Two-Factor Authentication</Label>
                  <p className='text-sm text-muted-foreground'>
                    Require 2FA for all users
                  </p>
                </div>
                <Switch
                  checked={settings?.two_factor_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, two_factor_enabled: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value='appearance' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of your application
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='theme'>Theme</Label>
                <Select
                  value={settings?.theme}
                  onValueChange={(value) =>
                    setSettings({ ...settings, theme: value })
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='light'>Light</SelectItem>
                    <SelectItem value='dark'>Dark</SelectItem>
                    <SelectItem value='system'>System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='primary_color'>Primary Color</Label>
                <div className='flex gap-2'>
                  <Input
                    id='primary_color'
                    type='color'
                    value={settings?.primary_color || '#3b82f6'}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        primary_color: e.target.value,
                      })
                    }
                    className='w-20 h-10'
                  />
                  <Input
                    value={settings?.primary_color || '#3b82f6'}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        primary_color: e.target.value,
                      })
                    }
                    placeholder='#3b82f6'
                    className='flex-1'
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Table Settings</CardTitle>
              <CardDescription>
                Configure default table display preferences
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='table_density'>Table Density</Label>
                <Select
                  value={settings?.table_density}
                  onValueChange={(value) =>
                    setSettings({ ...settings, table_density: value })
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='compact'>Compact</SelectItem>
                    <SelectItem value='comfortable'>Comfortable</SelectItem>
                    <SelectItem value='spacious'>Spacious</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='default_page_size'>Default Page Size</Label>
                <Select
                  value={settings?.default_page_size?.toString()}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      default_page_size: parseInt(value),
                    })
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='10'>10 rows</SelectItem>
                    <SelectItem value='25'>25 rows</SelectItem>
                    <SelectItem value='50'>50 rows</SelectItem>
                    <SelectItem value='100'>100 rows</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipment Settings */}
        <TabsContent value='shipments' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Configure how shipment data is managed
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='auto_archive_days'>
                    Auto-Archive After (days)
                  </Label>
                  <Input
                    id='auto_archive_days'
                    type='number'
                    min='30'
                    max='365'
                    value={settings?.auto_archive_days || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        auto_archive_days: parseInt(e.target.value),
                      })
                    }
                  />
                  <p className='text-xs text-muted-foreground'>
                    Automatically archive old shipments
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='data_retention_days'>
                    Data Retention (days)
                  </Label>
                  <Input
                    id='data_retention_days'
                    type='number'
                    min='90'
                    max='3650'
                    value={settings?.data_retention_days || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        data_retention_days: parseInt(e.target.value),
                      })
                    }
                  />
                  <p className='text-xs text-muted-foreground'>
                    Delete data after this period
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Settings</CardTitle>
              <CardDescription>Configure default export format</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='export_format'>Default Export Format</Label>
                <Select
                  value={settings?.export_format}
                  onValueChange={(value) =>
                    setSettings({ ...settings, export_format: value })
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='csv'>CSV</SelectItem>
                    <SelectItem value='excel'>Excel (XLSX)</SelectItem>
                    <SelectItem value='pdf'>PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Developer Settings */}
        <TabsContent value='developer' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Mock Data Settings</CardTitle>
              <CardDescription>
                Configure mock data for development and testing
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Use Mock Data for Analytics</Label>
                  <p className='text-sm text-muted-foreground'>
                    Display generated mock data instead of real data in all
                    analytics charts
                  </p>
                </div>
                <Switch
                  checked={useMockData}
                  onCheckedChange={(checked) => {
                    setUseMockData(checked);
                    localStorage.setItem('use-mock-data', String(checked));
                    toast.success(
                      checked
                        ? 'Mock data enabled - Refresh analytics pages to see changes'
                        : 'Real data enabled - Refresh analytics pages to see changes',
                    );
                  }}
                />
              </div>
              <Separator />
              <div className='rounded-lg border border-border/50 bg-muted/20 p-4'>
                <div className='flex items-start gap-3'>
                  <AlertCircle className='h-5 w-5 text-muted-foreground mt-0.5' />
                  <div className='space-y-1'>
                    <p className='text-sm font-medium'>Development Feature</p>
                    <p className='text-xs text-muted-foreground'>
                      This setting is useful for testing the UI with realistic
                      data patterns when you don't have enough real data yet.
                      Mock data includes:
                    </p>
                    <ul className='text-xs text-muted-foreground list-disc list-inside space-y-0.5 mt-2'>
                      <li>Shipment trends (total, delivered, exceptions)</li>
                      <li>User growth and activity metrics</li>
                      <li>Lead conversion analytics</li>
                      <li>
                        Realistic patterns with weekday/weekend variations
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              {useMockData && (
                <div className='rounded-lg border border-amber-500/50 bg-amber-500/10 p-4'>
                  <div className='flex items-start gap-3'>
                    <CheckCircle2 className='h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5' />
                    <div className='space-y-1'>
                      <p className='text-sm font-medium text-amber-900 dark:text-amber-100'>
                        Mock Data Active
                      </p>
                      <p className='text-xs text-amber-800 dark:text-amber-200'>
                        All analytics pages are currently showing generated mock
                        data. Navigate to any analytics page and refresh to see
                        the mock data in action.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
