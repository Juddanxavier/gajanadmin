-- Add type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carriers' AND column_name = 'type') THEN
        ALTER TABLE "public"."carriers" ADD COLUMN "type" text DEFAULT 'unknown';
    END IF;
END $$;

-- Force schema cache reload (usually happens auto, but good for robust scripts)
NOTIFY pgrst, 'reload config';
