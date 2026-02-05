
-- Migration to make shipment email notifications dynamic based on settings
-- Replaces the hardcoded status list with a lookup in the settings table

CREATE OR REPLACE FUNCTION public.notify_shipment_email()
RETURNS TRIGGER AS $$
DECLARE
  api_url TEXT;
  auth_header TEXT;
  allowed_triggers JSONB;
  tenant_settings RECORD;
BEGIN
  -- 1. Fetch Tenant Settings (Optimized: Single query)
  SELECT notification_triggers, email_notifications_enabled 
  INTO tenant_settings
  FROM public.settings
  WHERE tenant_id = NEW.tenant_id;

  -- 2. Check if Email Notifications are Globally Enabled for this Tenant
  IF tenant_settings.email_notifications_enabled IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  -- 3. Check if the New Status is in the Allowed Triggers List
  -- Triggers are stored as specific statuses (e.g., ["delivered", "out_for_delivery"])
  -- We also check if status actually changed to avoid redundant alerts on same status updates
  IF OLD.status IS DISTINCT FROM NEW.status THEN
      
      -- Default fallbacks if settings specific column is missing or null?
      -- The schema defines default as '["delivered", "exception", "out_for_delivery"]'
      allowed_triggers := COALESCE(tenant_settings.notification_triggers, '["delivered", "exception", "out_for_delivery"]'::jsonb);

      -- Check if NEW.status exists in the JSONB array
      IF allowed_triggers @> to_jsonb(NEW.status) THEN
        
        -- Construct API Call
        api_url := current_setting('app.api_url', true) || '/api/notifications/send-email';
        auth_header := 'Bearer ' || current_setting('app.cron_secret', true);

        IF NEW.customer_details->>'email' IS NOT NULL THEN
            PERFORM net.http_post(
              url := api_url,
              headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', auth_header),
              body := jsonb_build_object(
                'shipment_id', NEW.id,
                'tenant_id', NEW.tenant_id,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'tracking_code', NEW.carrier_tracking_code,
                'reference_code', NEW.white_label_code,
                'customer_email', NEW.customer_details->>'email',
                'customer_name', NEW.customer_details->>'name',
                'invoice_amount', (NEW.invoice_details->>'amount')::NUMERIC,
                'invoice_currency', NEW.invoice_details->>'currency'
              )
            );
        END IF;
      END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error? RAISE NOTICE 'Notification trigger failed: %', SQLERRM;
  RETURN NEW; -- Fail safe
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
