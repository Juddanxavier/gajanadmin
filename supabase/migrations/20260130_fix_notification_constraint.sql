-- Add unique constraint for upsert
ALTER TABLE public.tenant_notification_configs
DROP CONSTRAINT IF EXISTS tenant_notification_configs_tenant_id_channel_key;

ALTER TABLE public.tenant_notification_configs
ADD CONSTRAINT tenant_notification_configs_tenant_id_channel_key
UNIQUE (tenant_id, channel);
