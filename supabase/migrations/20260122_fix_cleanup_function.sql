-- Restore and enhance the cleanup function
CREATE OR REPLACE FUNCTION purge_old_notifications()
RETURNS void AS $$
BEGIN
    -- 1. Purge old unread in-app notifications (180 days)
    DELETE FROM in_app_notifications WHERE is_read = false AND created_at < NOW() - INTERVAL '180 days';
    
    -- 2. Purge read in-app notifications (Keep only last 90 days)
    DELETE FROM in_app_notifications WHERE is_read = true AND created_at < NOW() - INTERVAL '90 days';

    -- 3. Purge processed queue items (Keep only last 7 days of history in active queue)
    -- We assume logs are stored in notification_logs for long term retention
    DELETE FROM notifications WHERE sent_at IS NOT NULL AND sent_at < NOW() - INTERVAL '7 days';
    
    -- 4. Purge failed queue items (Keep for 30 days for debugging)
    DELETE FROM notifications WHERE sent_at IS NULL AND retry_count >= 3 AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
