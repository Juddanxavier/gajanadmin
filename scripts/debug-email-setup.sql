-- Check if database is configured
SHOW app.nextjs_api_url;
SHOW app.webhook_secret;

-- Check if trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_shipment_status_change';

-- Check if function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'send_shipment_email_notification';
