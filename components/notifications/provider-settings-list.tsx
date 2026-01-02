
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { saveProviderConfig, activateProvider, testConnection } from '@/app/admin/notifications/settings/actions';
import { toast } from 'sonner';
import { Loader2, Check, ExternalLink, RefreshCw } from 'lucide-react';

interface Props {
    tenantId: string;
    providers: any[]; // notification_providers
    configs: any[]; // tenant_notification_configs
}

export function ProviderSettingsList({ tenantId, providers, configs }: Props) {
    const [loading, setLoading] = useState<string | null>(null);

    const emailProviders = providers.filter(p => p.channel === 'email');
    const smsProviders = providers.filter(p => p.channel === 'sms');

    const handleSave = async (providerId: string, channel: 'email' | 'sms', data: any) => {
        setLoading(`save-${providerId}`);
        try {
            await saveProviderConfig(tenantId, channel, providerId, data.credentials, data.config);
            toast.success('Provider configuration saved.');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(null);
        }
    };

    const handleTest = async (providerId: string, channel: 'email' | 'sms', credentials: any) => {
        setLoading(`test-${providerId}`);
        try {
            const result = await testConnection(providerId, channel, credentials);
            if (result.success) {
                toast.success('Connection Successful!', { description: 'Credentials are valid.' });
            } else {
                toast.error('Connection Failed', { description: result.error });
            }
        } catch (e: any) {
             toast.error('Test Error', { description: e.message });
        } finally {
            setLoading(null);
        }
    };

    const handleActivate = async (configId: string, channel: 'email' | 'sms') => {
        setLoading(`adjust-${configId}`);
        try {
            await activateProvider(tenantId, configId, channel);
            toast.success('This provider is now active.');
        } catch (e: any) {
             toast.error(e.message);
        } finally {
            setLoading(null);
        }
    };

    return (
        <Tabs defaultValue="email" className="w-full">
            <TabsList className="mb-4">
                <TabsTrigger value="email">Email Providers</TabsTrigger>
                <TabsTrigger value="sms">SMS Providers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="email" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {emailProviders.map(p => (
                        <ProviderCard 
                            key={p.id} 
                            provider={p} 
                            config={configs.find(c => c.provider_id === p.id)}
                            onSave={(d) => handleSave(p.id, 'email', d)}
                            onTest={(d) => handleTest(p.id, 'email', d.credentials)}
                            onActivate={(cid) => handleActivate(cid, 'email')}
                            loading={loading}
                        />
                    ))}
                </div>
            </TabsContent>

             <TabsContent value="sms" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {smsProviders.map(p => (
                        <ProviderCard 
                            key={p.id} 
                            provider={p} 
                            config={configs.find(c => c.provider_id === p.id)}
                            onSave={(d) => handleSave(p.id, 'sms', d)}
                            onTest={(d) => handleTest(p.id, 'sms', d.credentials)}
                            onActivate={(cid) => handleActivate(cid, 'sms')}
                            loading={loading}
                        />
                    ))}
                </div>
            </TabsContent>
        </Tabs>
    );
}

interface ProviderCardProps {
    provider: any;
    config: any;
    onSave: (data: any) => Promise<void>;
    onTest: (data: any) => Promise<void>;
    onActivate: (configId: string) => Promise<void>;
    loading: string | null;
}

function ProviderCard({ provider, config, onSave, onTest, onActivate, loading }: ProviderCardProps) {
    const isActive = config?.is_active;
    const [creds, setCreds] = useState(config?.credentials || {});
    const [conf, setConf] = useState(config?.config || {});
    
    const isSmtp = provider.id === 'smtp';
    const isZepto = provider.id === 'zeptomail';
    const isTwilio = provider.id === 'twilio';

    const handleFieldChange = (section: 'credentials' | 'config', key: string, val: string) => {
        if (section === 'credentials') setCreds({ ...creds, [key]: val });
        else setConf({ ...conf, [key]: val });
    };

    return (
        <Card className={`relative overflow-hidden transition-all duration-200 border-opacity-50 hover:shadow-lg ${isActive ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'}`}>
            {isActive && (
                <div className="absolute top-0 right-0 p-2 bg-primary text-primary-foreground rounded-bl-lg">
                    <Check className="w-4 h-4" />
                </div>
            )}
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-background' : 'bg-muted'}`}>
                           {/* Icons could be dynamic based on provider */}
                           {provider.channel === 'email' ? <div className="font-bold text-lg">@</div> : <div className="font-bold text-lg">#</div>}
                        </div>
                        <div>
                            <CardTitle className="text-lg">{provider.display_name}</CardTitle>
                            <CardDescription className="text-xs">
                                {isActive ? 'Active Provider' : 'Inactive'}
                            </CardDescription>
                        </div>
                    </div>
                     {config && !isActive && (
                        <Button 
                            size="sm" variant="ghost" className="hover:bg-primary/10 hover:text-primary"
                            onClick={() => onActivate(config.id)}
                            disabled={loading === `adjust-${config.id}`}
                        >
                            {loading === `adjust-${config.id}` ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Set Active'}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                 {/* SMTP Form */}
                {isSmtp && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2"><Label className="text-xs font-semibold uppercase text-muted-foreground">Host</Label><Input value={creds.host || ''} onChange={e => handleFieldChange('credentials', 'host', e.target.value)} placeholder="smtp.provider.com" className="bg-background"/></div>
                             <div className="space-y-2"><Label className="text-xs font-semibold uppercase text-muted-foreground">Port</Label><Input value={creds.port || ''} onChange={e => handleFieldChange('credentials', 'port', e.target.value)} placeholder="587" className="bg-background"/></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2"><Label className="text-xs font-semibold uppercase text-muted-foreground">Username</Label><Input value={creds.user || ''} onChange={e => handleFieldChange('credentials', 'user', e.target.value)} className="bg-background"/></div>
                             <div className="space-y-2"><Label className="text-xs font-semibold uppercase text-muted-foreground">Password</Label><Input type="password" value={creds.pass || ''} onChange={e => handleFieldChange('credentials', 'pass', e.target.value)} className="bg-background"/></div>
                        </div>
                        <div className="space-y-2"><Label className="text-xs font-semibold uppercase text-muted-foreground">From Email</Label><Input value={conf.from_email || ''} onChange={e => handleFieldChange('config', 'from_email', e.target.value)} placeholder="no-reply@example.com" className="bg-background"/></div>
                    </div>
                )}

                {/* ZeptoMail Form */}
                {isZepto && (
                    <div className="space-y-4">
                        <div className="space-y-2"><Label className="text-xs font-semibold uppercase text-muted-foreground">API Key (Send Mail Token)</Label><Input type="password" value={creds.apiKey || ''} onChange={e => handleFieldChange('credentials', 'apiKey', e.target.value)} placeholder="Zoho-enczapikey..." className="bg-background"/></div>
                        
                        {/* Region Selector */}
                        <div className="space-y-2">
                             <Label className="text-xs font-semibold uppercase text-muted-foreground">Region / Data Center</Label>
                             <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={conf.api_url || 'https://api.zeptomail.in/v1.1/email'}
                                onChange={e => handleFieldChange('config', 'api_url', e.target.value)}
                             >
                                 <option value="https://api.zeptomail.in/v1.1/email">India (.in)</option>
                                 <option value="https://api.zeptomail.com/v1.1/email">US / Global (.com)</option>
                                 <option value="https://api.zeptomail.eu/v1.1/email">Europe (.eu)</option>
                                 <option value="https://api.zeptomail.com.au/v1.1/email">Australia (.au)</option>
                                 <option value="https://api.zeptomail.com.cn/v1.1/email">China (.cn)</option>
                             </select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2"><Label className="text-xs font-semibold uppercase text-muted-foreground">From Email</Label><Input value={conf.from_email || ''} onChange={e => handleFieldChange('config', 'from_email', e.target.value)} placeholder="noreply@domain.com" className="bg-background"/></div>
                             <div className="space-y-2"><Label className="text-xs font-semibold uppercase text-muted-foreground">From Name</Label><Input value={conf.from_name || ''} onChange={e => handleFieldChange('config', 'from_name', e.target.value)} placeholder="My Brand" className="bg-background"/></div>
                        </div>
                         <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                            <ExternalLink className="w-3 h-3" />
                            <span>Verify your domain in <a href="https://zeptomail.zoho.com" target="_blank" className="underline hover:text-primary">ZeptoMail Dashboard</a> first.</span>
                        </div>
                    </div>
                )}

                {/* Twilio Form */}
                {isTwilio && (
                    <div className="space-y-4">
                         <div className="space-y-2"><Label className="text-xs font-semibold uppercase text-muted-foreground">Account SID</Label><Input value={creds.accountSid || ''} onChange={e => handleFieldChange('credentials', 'accountSid', e.target.value)} className="bg-background"/></div>
                         <div className="space-y-2"><Label className="text-xs font-semibold uppercase text-muted-foreground">Auth Token</Label><Input type="password" value={creds.authToken || ''} onChange={e => handleFieldChange('credentials', 'authToken', e.target.value)} className="bg-background"/></div>
                         <div className="space-y-2"><Label className="text-xs font-semibold uppercase text-muted-foreground">From Number</Label><Input value={conf.from_number || ''} onChange={e => handleFieldChange('config', 'from_number', e.target.value)} placeholder="+1234567890" className="bg-background"/></div>
                    </div>
                )}
                
                {/* Fallback */}
                {!isSmtp && !isZepto && !isTwilio && (
                    <div className="p-6 border border-dashed rounded-lg bg-muted/30 text-center space-y-2">
                        <p className="text-sm font-medium">Generic Configuration</p>
                        <p className="text-xs text-muted-foreground">No specific form available for this provider.</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-2 flex gap-2">
                <Button 
                    variant="outline"
                    onClick={() => onTest({ credentials: creds, config: conf })}
                    disabled={loading === `test-${provider.id}` || loading === `save-${provider.id}`}
                    className="flex-1"
                >
                    {loading === `test-${provider.id}` ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <><RefreshCw className="w-3 h-3 mr-2"/> Test</>}
                </Button>
                <Button 
                    variant={isActive ? "default" : "secondary"}
                    className="flex-1" 
                    onClick={() => onSave({ credentials: creds, config: conf })}
                    disabled={loading === `test-${provider.id}` || loading === `save-${provider.id}`}
                >
                    {loading === `save-${provider.id}` ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : 'Save'}
                </Button>
            </CardFooter>
        </Card>
    );
}

