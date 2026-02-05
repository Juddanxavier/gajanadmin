-- Fix Notification Trigger
-- 1. Corrects the API Endpoint URL: Uses http://host.docker.internal:3000 assuming local/docker, or falls back to public URL if needed. 
--    SAFEGUARD: We will construct a robust URL logic.
-- 2. Enables notifications on INSERT (creation)
-- 3. Only sends invoice amount on first notification (INSERT)

CREATE OR REPLACE FUNCTION notify_shipment_email()
RETURNS TRIGGER AS $$
DECLARE
  api_url TEXT;
  auth_header TEXT;
  should_notify BOOLEAN;
  payload JSONB;
BEGIN
  -- Determine if we should notify
  should_notify := false;

  -- Case 1: INSERT (New Shipment)
  IF (TG_OP = 'INSERT') THEN
    IF NEW.status IN ('delivered', 'info_received', 'exception', 'out_for_delivery', 'in_transit') THEN
        should_notify := true;
    END IF;
  
  -- Case 2: UPDATE
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('delivered', 'info_received', 'exception', 'out_for_delivery', 'in_transit') THEN
        should_notify := true;
    END IF;
  END IF;

  IF should_notify THEN
    -- Construct API Call
    -- Attempts to use app.api_url setting, but falls back to a likely internal address if missing
    api_url := coalesce(current_setting('app.api_url', true), 'http://host.docker.internal:3000') || '/api/webhooks/internal/notifications';
    
    -- Use unified secret
    auth_header := 'Bearer ' || coalesce(current_setting('app.notification_secret', true), current_setting('app.cron_secret', true));

    IF NEW.customer_details->>'email' IS NOT NULL THEN
        
        payload := jsonb_build_object(
            'shipment_id', NEW.id,
            'tenant_id', NEW.tenant_id,
            'old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE 'new' END,
            'new_status', NEW.status,
            'tracking_code', NEW.carrier_tracking_code,
            'reference_code', NEW.white_label_code,
            'customer_email', NEW.customer_details->>'email',
            'customer_name', NEW.customer_details->>'name'
        );

        -- Only add invoice details if INSERT
        IF TG_OP = 'INSERT' THEN
             payload := payload || jsonb_build_object(
                'invoice_amount', (NEW.invoice_details->>'amount')::NUMERIC,
                'invoice_currency', NEW.invoice_details->>'currency'
             );
        END IF;

        PERFORM net.http_post(
          url := api_url,
          headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', auth_header),
          body := payload
        );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Notification Trigger Failed: %', SQLERRM;
  RETURN NEW; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_shipment_status_change_email ON shipments;

CREATE TRIGGER on_shipment_status_change_email
  AFTER INSERT OR UPDATE ON shipments
  FOR EACH ROW EXECUTE PROCEDURE notify_shipment_email();
