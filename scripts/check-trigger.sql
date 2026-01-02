-- Check if email notification trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_shipment_status_change';

-- Check if function exists
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'send_shipment_email_notification';

-- Check database configuration
SHOW app.nextjs_api_url;
