-- Remove Notification Triggers (Moving logic to Application Level)
-- This ensures reliability by preventing the database from trying to reach localhost/internal network.

DROP TRIGGER IF EXISTS on_shipment_status_change_email ON shipments;
DROP FUNCTION IF EXISTS notify_shipment_email();

-- Also drop internal cron jobs that might rely on old logic if any (optional, but cleaner)
-- keeping sync-shipments-job as it calls an API endpoint which is fine if configured correctly,
-- but for now we focus on the trigger.

COMMENT ON TABLE shipments IS 'Shipments table - Notifications are handled by Application Service, not DB Triggers.';
