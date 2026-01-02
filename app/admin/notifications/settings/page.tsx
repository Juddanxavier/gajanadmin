
import { getNotificationProviders, getTenantConfigs } from './actions';
import { ProviderSettingsList } from '@/components/notifications/provider-settings-list';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tenantId?: string }> }) {
   const resolvedSearchParams = await searchParams;
   const supabase = await createClient();
   const { data: { user } } = await supabase.auth.getUser();

   if (!user) {
    redirect('/login');
   }

   // 1. Get ALL Tenants for this user (with names)
   const { data: userTenantsData } = await supabase
       .from('user_tenants')
       .select(`
            tenant_id,
            tenants (
                id,
                name
            )
       `)
       .eq('user_id', user.id);

   if (!userTenantsData || userTenantsData.length === 0) return <div>No tenant found.</div>;

   // Flatten the list
   const tenants = userTenantsData.map(ut => ut.tenants).filter(Boolean) as any[];
   
   // 2. Determine Selected Tenant (from URL or default to first)
   const selectedTenantId = resolvedSearchParams.tenantId || tenants[0].id;
   const selectedTenant = tenants.find(t => t.id === selectedTenantId) || tenants[0];

   // 3. Fetch Settings for SELECTED tenant
   const providers = await getNotificationProviders();
   const configs = await getTenantConfigs(selectedTenant.id);

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
                    <p className="text-muted-foreground">Manage channels for {selectedTenant.name}</p>
                </div>

                {/* Tenant Switcher (only if multiple) */}
                {tenants.length > 1 && (
                     <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                        <span className="text-xs font-semibold uppercase text-muted-foreground">Scope:</span>
                        <div className="flex gap-2">
                            {tenants.map(t => (
                                <a 
                                    key={t.id} 
                                    href={`/admin/notifications/settings?tenantId=${t.id}`}
                                    className={`text-sm px-3 py-1 rounded transition-colors ${t.id === selectedTenant.id ? 'bg-background shadow font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {t.name} ({(t.name || 'SYS').substring(0, 3).toUpperCase()})
                                </a>
                            ))}
                        </div>
                     </div>
                )}
            </div>
            
            <ProviderSettingsList 
                key={selectedTenant.id} // Force re-mount on switch
                tenantId={selectedTenant.id}
                providers={providers}
                configs={configs}
            />
        </div>
    );
}
