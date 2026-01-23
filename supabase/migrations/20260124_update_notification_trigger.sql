-- Update notification trigger to use new secure endpoint
-- Using app.webhook_secret and whitelisted /api/webhooks path

CREATE OR REPLACE FUNCTION notify_shipment_email()
RETURNS TRIGGER AS $$
DECLARE
  api_url TEXT;
  auth_header TEXT;
  base_url TEXT;
  secret TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('delivered', 'info_received', 'exception') THEN
    
    -- Resolve Base URL (Fallbacks: app.nextjs_api_url -> app.api_url -> default)
    base_url := coalesce(
      current_setting('app.nextjs_api_url', true),
      current_setting('app.api_url', true),
      'http://localhost:3000'
    );
    
    -- Resolve Secret (Fallbacks: app.webhook_secret -> app.cron_secret)
    secret := coalesce(
      current_setting('app.webhook_secret', true),
      current_setting('app.cron_secret', true)
    );

    -- Construct Endpoint URL
    api_url := base_url || '/api/webhooks/internal/notifications';
    auth_header := 'Bearer ' || secret;

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
            'invoice_currency', NEW.invoice_details->>'currency',
            'delivery_date', (NEW.raw_response->'estimated_delivery')::TEXT
          )
        );
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW; -- Fail safe
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
