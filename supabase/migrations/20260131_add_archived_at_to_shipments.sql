-- Add archived_at column to shipments table
ALTER TABLE "public"."shipments" ADD COLUMN "archived_at" timestamp with time zone NULL;

-- Create index for faster filtering by archival status
CREATE INDEX "idx_shipments_archived_at" ON "public"."shipments" USING btree ("archived_at");
