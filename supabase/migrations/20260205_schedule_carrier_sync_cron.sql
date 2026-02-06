-- Enable pg_cron extension
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Schedule the job: Sync Carriers every Sunday at 00:00 (Midnight)
-- Note: You must replace 'YOUR_APP_URL' with your actual production URL
-- e.g., 'https://admin.gajantraders.com/api/cron/carriers'

-- Safely unschedule if exists to allow update
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-carriers-weekly') THEN
        PERFORM cron.unschedule('sync-carriers-weekly');
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Schedule new job
-- Using pg_net to call the API endpoint
select cron.schedule(
    'sync-carriers-weekly',
    '0 0 * * 0', -- Weekly: Sunday at 00:00
    $$
    select net.http_get(
        url:='https://your-production-url.com/api/cron/carriers?key=gajan_cron_secret_123',
        headers:='{"Content-Type": "application/json"}'::jsonb
    ) as request_id;
    $$
);

-- Note: In Supabase, you might need to run this manually in SQL Editor 
-- as migrations might not have permissions to enable extensions or schedule cron in some tiers.
-- If hosted on Vercel, consider using vercel.json cron configuration instead.
