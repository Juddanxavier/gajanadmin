-- Function to automatically archive old terminal shipments
CREATE OR REPLACE FUNCTION auto_archive_shipments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE shipments
  SET archived_at = NOW()
  WHERE 
    archived_at IS NULL
    AND status IN ('delivered', 'expired', 'failed', 'returned') -- Terminal statuses
    AND updated_at < (NOW() - INTERVAL '30 days'); -- Configurable retention period (30 days)

  -- Auto-delete pending (untracked) shipments older than 30 days
  DELETE FROM shipments
  WHERE 
    status = 'pending'
    AND created_at < (NOW() - INTERVAL '30 days');
END;
$$;

-- Note: The actual cron schedule needs to be enabled via the Supabase dashboard or SQL editor if pg_cron is enabled.
-- Command to schedule:
-- SELECT cron.schedule('auto-archive-shipments', '0 0 * * *', $$SELECT auto_archive_shipments()$$);
