-- Backfill script to populate new columns from existing raw_response data
-- Run this after applying the consolidated migration

-- Update estimated_delivery from raw_response
UPDATE shipments
SET estimated_delivery = (raw_response->>'expected_delivery')::timestamptz
WHERE raw_response IS NOT NULL 
  AND raw_response->>'expected_delivery' IS NOT NULL
  AND estimated_delivery IS NULL;

-- Update estimated_delivery from alternative fields
UPDATE shipments
SET estimated_delivery = (raw_response->>'estimatedDelivery')::timestamptz
WHERE raw_response IS NOT NULL 
  AND raw_response->>'estimatedDelivery' IS NOT NULL
  AND estimated_delivery IS NULL;

UPDATE shipments
SET estimated_delivery = (raw_response->>'eta')::timestamptz
WHERE raw_response IS NOT NULL 
  AND raw_response->>'eta' IS NOT NULL
  AND estimated_delivery IS NULL;

-- Update latest_location from checkpoints (first checkpoint = most recent)
UPDATE shipments
SET latest_location = raw_response->'checkpoints'->0->>'location'
WHERE raw_response IS NOT NULL 
  AND raw_response->'checkpoints'->0->>'location' IS NOT NULL
  AND latest_location IS NULL;

-- Alternative: from 'city' field in checkpoints
UPDATE shipments
SET latest_location = raw_response->'checkpoints'->0->>'city'
WHERE raw_response IS NOT NULL 
  AND raw_response->'checkpoints'->0->>'city' IS NOT NULL
  AND latest_location IS NULL;

-- Log results
DO $$
DECLARE
  updated_delivery_count INTEGER;
  updated_location_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_delivery_count FROM shipments WHERE estimated_delivery IS NOT NULL;
  SELECT COUNT(*) INTO updated_location_count FROM shipments WHERE latest_location IS NOT NULL;
  
  RAISE NOTICE 'Backfill complete:';
  RAISE NOTICE '  - Shipments with estimated_delivery: %', updated_delivery_count;
  RAISE NOTICE '  - Shipments with latest_location: %', updated_location_count;
END $$;
