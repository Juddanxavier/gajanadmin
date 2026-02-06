-- ============================================================================
-- SHIPMENT MODULE: Enhance Shipments Schema
-- Date: 2026-02-05
-- Description: Add missing columns to support white-label tracking system
-- ============================================================================

-- Add new columns to shipments table
ALTER TABLE public.shipments 
  ADD COLUMN IF NOT EXISTS substatus TEXT,
  ADD COLUMN IF NOT EXISTS tracking_url TEXT,
  ADD COLUMN IF NOT EXISTS package_weight DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS package_dimensions JSONB,
  ADD COLUMN IF NOT EXISTS destination_country TEXT,
  ADD COLUMN IF NOT EXISTS destination_city TEXT,
  ADD COLUMN IF NOT EXISTS origin_country TEXT,
  ADD COLUMN IF NOT EXISTS origin_city TEXT,
  ADD COLUMN IF NOT EXISTS actual_delivery_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_shipments_white_label 
  ON public.shipments(white_label_code) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_shipments_archived 
  ON public.shipments(archived_at) 
  WHERE archived_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shipments_destination 
  ON public.shipments(destination_country, destination_city) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_shipments_created_tenant 
  ON public.shipments(tenant_id, created_at DESC);

-- Add comment for documentation
COMMENT ON COLUMN public.shipments.substatus IS 'Detailed status from carrier (e.g., "Customs clearance")';
COMMENT ON COLUMN public.shipments.tracking_url IS 'Direct URL to carrier tracking page';
COMMENT ON COLUMN public.shipments.package_weight IS 'Package weight in kilograms';
COMMENT ON COLUMN public.shipments.package_dimensions IS 'Package dimensions in JSON format: {"length": 10, "width": 20, "height": 5, "unit": "cm"}';
COMMENT ON COLUMN public.shipments.notes IS 'Internal notes about the shipment';
