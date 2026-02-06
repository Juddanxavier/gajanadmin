-- ============================================================================
-- SHIPMENT MODULE - COMPLETE TABLE CREATION WITH ENHANCEMENTS
-- Date: 2026-02-05
-- Description: Creates shipment tables from scratch with all enhancements
-- Run this if shipments table doesn't exist (was previously dropped)
-- ============================================================================

-- =============================================================
-- 1. CREATE CARRIERS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS public.carriers (
    code TEXT PRIMARY KEY,
    name_en TEXT,
    name_cn TEXT,
    homepage TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 2. CREATE SHIPMENTS TABLE (WITH ALL ENHANCEMENTS)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Tracking Codes
    white_label_code TEXT UNIQUE NOT NULL,
    carrier_tracking_code TEXT NOT NULL,
    carrier_id TEXT REFERENCES public.carriers(code),
    provider TEXT DEFAULT 'track123',
    
    -- Status
    status TEXT DEFAULT 'pending',
    substatus TEXT,  -- NEW: Detailed status from carrier
    tracking_url TEXT,  -- NEW: Direct URL to carrier tracking
    
    -- Delivery Info
    estimated_delivery TIMESTAMPTZ,
    actual_delivery_date TIMESTAMPTZ,  -- NEW: Actual delivery timestamp
    latest_location TEXT,
    
    -- Package Details
    package_weight DECIMAL(10,2),  -- NEW: Package weight in kg
    package_dimensions JSONB,  -- NEW: Package dimensions JSON
    
    -- Origin and Destination
    origin_country TEXT,  -- NEW: Origin country
    origin_city TEXT,  -- NEW: Origin city
    destination_country TEXT,  -- NEW: Destination country
    destination_city TEXT,  -- NEW: Destination city
    
    -- Customer and Invoice
    customer_details JSONB DEFAULT '{}'::jsonb,
    invoice_details JSONB DEFAULT '{}'::jsonb,
    
    -- Notes
    notes TEXT,  -- NEW: Internal notes
    
    -- User and Sync
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    last_synced_at TIMESTAMPTZ,
    raw_response JSONB,
    
    -- Soft Delete and Archive
    deleted_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 3. CREATE TRACKING EVENTS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS public.tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    location TEXT,
    description TEXT,
    occurred_at TIMESTAMPTZ NOT NULL,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (shipment_id, occurred_at, status)
);

-- =============================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =============================================================

-- Shipments indexes
CREATE INDEX IF NOT EXISTS idx_shipments_tenant 
    ON public.shipments(tenant_id);

CREATE INDEX IF NOT EXISTS idx_shipments_tracking 
    ON public.shipments(carrier_tracking_code);

CREATE INDEX IF NOT EXISTS idx_shipments_status 
    ON public.shipments(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shipments_provider_tracking 
    ON public.shipments(provider, carrier_tracking_code) 
    WHERE deleted_at IS NULL;

-- NEW: Enhanced indexes
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

-- Tracking events index
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment 
    ON public.tracking_events(shipment_id, occurred_at DESC);

-- =============================================================
-- 5. ADD COLUMN COMMENTS
-- =============================================================
COMMENT ON COLUMN public.shipments.substatus IS 'Detailed status from carrier (e.g., "Customs clearance")';
COMMENT ON COLUMN public.shipments.tracking_url IS 'Direct URL to carrier tracking page';
COMMENT ON COLUMN public.shipments.package_weight IS 'Package weight in kilograms';
COMMENT ON COLUMN public.shipments.package_dimensions IS 'Package dimensions in JSON format: {"length": 10, "width": 20, "height": 5, "unit": "cm"}';
COMMENT ON COLUMN public.shipments.notes IS 'Internal notes about the shipment';

-- =============================================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================================

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- 7. CREATE RLS POLICIES
-- =============================================================

-- Shipments Policies
-- Users can view shipments from their tenant
CREATE POLICY "Users can view their tenant's shipments"
    ON public.shipments FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
        )
        OR
        -- Super admins can see all
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin' 
            AND tenant_id IS NULL
        )
    );

-- Users can insert shipments to their tenant
CREATE POLICY "Users can create shipments for their tenant"
    ON public.shipments FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
        )
    );

-- Users can update their tenant's shipments
CREATE POLICY "Users can update their tenant's shipments"
    ON public.shipments FOR UPDATE
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin' 
            AND tenant_id IS NULL
        )
    );

-- Users can delete their tenant's shipments
CREATE POLICY "Users can delete their tenant's shipments"
    ON public.shipments FOR DELETE
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin' 
            AND tenant_id IS NULL
        )
    );

-- Tracking Events Policies
CREATE POLICY "Users can view tracking events for their shipments"
    ON public.tracking_events FOR SELECT
    USING (
        shipment_id IN (
            SELECT id FROM public.shipments WHERE tenant_id IN (
                SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
            )
        )
        OR
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin' 
            AND tenant_id IS NULL
        )
    );

CREATE POLICY "Service role can manage tracking events"
    ON public.tracking_events FOR ALL
    USING (auth.role() = 'service_role');

-- Carriers Policies (Read-only for all authenticated users)
CREATE POLICY "Anyone can view carriers"
    ON public.carriers FOR SELECT
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- =============================================================
-- 8. ENHANCE NOTIFICATION QUEUE FOR WHATSAPP
-- =============================================================

-- Add WhatsApp-specific columns to notification_queue (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_queue') THEN
        ALTER TABLE public.notification_queue 
            ADD COLUMN IF NOT EXISTS recipient_phone TEXT,
            ADD COLUMN IF NOT EXISTS recipient_name TEXT,
            ADD COLUMN IF NOT EXISTS template_data JSONB DEFAULT '{}'::jsonb,
            ADD COLUMN IF NOT EXISTS provider_message_id TEXT;
        
        CREATE INDEX IF NOT EXISTS idx_notification_queue_phone 
            ON public.notification_queue(recipient_phone) 
            WHERE channel = 'whatsapp';
        
        CREATE INDEX IF NOT EXISTS idx_notification_queue_provider_msg 
            ON public.notification_queue(provider_message_id) 
            WHERE provider_message_id IS NOT NULL;
        
        COMMENT ON COLUMN public.notification_queue.recipient_phone IS 'Recipient phone number with country code (e.g., 919876543210)';
        COMMENT ON COLUMN public.notification_queue.recipient_name IS 'Recipient name for personalization';
        COMMENT ON COLUMN public.notification_queue.template_data IS 'Template variables for WhatsApp/Email templates in JSON format';
        COMMENT ON COLUMN public.notification_queue.provider_message_id IS 'Message ID from provider (MSG91, Resend, etc) for tracking';
    END IF;
END $$;

-- =============================================================
-- 9. UPDATE NOTIFICATION PROVIDERS (ENSURE WHATSAPP EXISTS)
-- =============================================================

-- Add whatsapp to notification_channel enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') THEN
        CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'whatsapp');
    ELSE
        -- Try to add whatsapp if it doesn't exist
        BEGIN
            ALTER TYPE notification_channel ADD VALUE IF NOT EXISTS 'whatsapp';
        EXCEPTION WHEN OTHERS THEN
            -- Ignore if already exists
        END;
    END IF;
END $$;

-- Ensure WhatsApp providers exist
INSERT INTO public.notification_providers (id, channel, display_name, is_enabled) VALUES
    ('msg91_whatsapp', 'whatsapp', 'MSG91 WhatsApp', true),
    ('twilio_whatsapp', 'whatsapp', 'Twilio WhatsApp', false)
ON CONFLICT (id) DO UPDATE 
SET display_name = EXCLUDED.display_name,
    is_enabled = EXCLUDED.is_enabled;

-- =============================================================
-- 10. CREATE HELPER FUNCTIONS
-- =============================================================

-- Function to get shipment statistics by tenant
CREATE OR REPLACE FUNCTION public.get_shipment_stats_by_tenant(tenant_uuid UUID)
RETURNS TABLE (
    total_shipments BIGINT,
    pending BIGINT,
    in_transit BIGINT,
    delivered BIGINT,
    exception BIGINT,
    this_month BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND archived_at IS NULL) as total_shipments,
        COUNT(*) FILTER (WHERE status = 'pending' AND deleted_at IS NULL AND archived_at IS NULL) as pending,
        COUNT(*) FILTER (WHERE status = 'in_transit' AND deleted_at IS NULL AND archived_at IS NULL) as in_transit,
        COUNT(*) FILTER (WHERE status = 'delivered' AND deleted_at IS NULL AND archived_at IS NULL) as delivered,
        COUNT(*) FILTER (WHERE status = 'exception' AND deleted_at IS NULL AND archived_at IS NULL) as exception,
        COUNT(*) FILTER (
            WHERE created_at >= DATE_TRUNC('month', NOW())
            AND deleted_at IS NULL 
            AND archived_at IS NULL
        ) as this_month
    FROM public.shipments
    WHERE tenant_id = tenant_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_shipment_stats_by_tenant(UUID) TO authenticated;

-- =============================================================
-- 11. VERIFICATION
-- =============================================================

DO $$
BEGIN
    RAISE NOTICE '=== MIGRATION VERIFICATION ===';
    
    -- Check tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shipments') THEN
        RAISE NOTICE '✓ Table shipments created';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tracking_events') THEN
        RAISE NOTICE '✓ Table tracking_events created';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'carriers') THEN
        RAISE NOTICE '✓ Table carriers created';
    END IF;
    
    -- Check key columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipments' AND column_name = 'substatus') THEN
        RAISE NOTICE '✓ Column substatus exists';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipments' AND column_name = 'destination_country') THEN
        RAISE NOTICE '✓ Column destination_country exists';
    END IF;
    
    -- Check indexes
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_shipments_white_label') THEN
        RAISE NOTICE '✓ Index idx_shipments_white_label created';
    END IF;
    
    RAISE NOTICE '=== MIGRATION COMPLETE ===';
END $$;

-- =============================================================
-- SUMMARY
-- =============================================================
/*
✅ Created tables:
   - carriers
   - shipments (with all enhancements)
   - tracking_events

✅ Added indexes for performance

✅ Enabled RLS with tenant isolation policies

✅ Enhanced notification_queue for WhatsApp

✅ Created helper functions for statistics

Next steps:
1. Configure environment variables (Track123, MSG91, CRON_SECRET)
2. Setup Track123 webhook URL
3. Configure Supabase cron job
4. Create MSG91 WhatsApp templates
*/
