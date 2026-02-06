-- Create carriers table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."carriers" (
    "code" text NOT NULL,
    "name_en" text NOT NULL,
    "name_cn" text,
    "type" text DEFAULT 'unknown', 
    "phone" text,
    "homepage" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "carriers_pkey" PRIMARY KEY ("code")
);

-- RLS
ALTER TABLE "public"."carriers" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON "public"."carriers"
    FOR SELECT USING (true);

-- Only admins can update (via sync)
CREATE POLICY "Enable insert/update for admins" ON "public"."carriers"
    FOR ALL USING (
        exists (
            select 1 from user_roles 
            where user_id = auth.uid() 
            and role in ('admin', 'super_admin')
        )
    );
