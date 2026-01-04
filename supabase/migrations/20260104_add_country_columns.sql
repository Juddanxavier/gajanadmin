ALTER TABLE shipments 
ADD COLUMN IF NOT EXISTS origin_country TEXT,
ADD COLUMN IF NOT EXISTS destination_country TEXT;
