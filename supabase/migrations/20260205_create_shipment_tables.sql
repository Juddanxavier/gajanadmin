-- ============================================================================
-- SHIPMENT MODULE - MINIMAL STANDALONE MIGRATION
-- Date: 2026-02-05
-- Description: Creates ONLY shipment tables without any dependencies
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
-- 2. CREATE SHIPMENTS TABLE
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
    substatus TEXT,
    tracking_url TEXT,
    
    -- Delivery Info
    estimated_delivery TIMESTAMPTZ,
    actual_delivery_date TIMESTAMPTZ,
    latest_location TEXT,
    
    -- Package Details
    package_weight DECIMAL(10,2),
    package_dimensions JSONB,
    
    -- Origin and Destination
    origin_country TEXT,
    origin_city TEXT,
    destination_country TEXT,
    destination_city TEXT,
    
    -- Customer and Invoice
    customer_details JSONB DEFAULT '{}'::jsonb,
    invoice_details JSONB DEFAULT '{}'::jsonb,
    
    -- Notes
    notes TEXT,
    
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
-- 4. CREATE INDEXES
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_shipments_tenant ON public.shipments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON public.shipments(carrier_tracking_code);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_shipments_provider_tracking ON public.shipments(provider, carrier_tracking_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_shipments_white_label ON public.shipments(white_label_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_shipments_archived ON public.shipments(archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shipments_destination ON public.shipments(destination_country, destination_city) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_shipments_created_tenant ON public.shipments(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment ON public.tracking_events(shipment_id, occurred_at DESC);

-- =============================================================
-- 5. ENABLE RLS
-- =============================================================

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- 6. DROP EXISTING POLICIES (IF ANY)
-- =============================================================

DROP POLICY IF EXISTS "Users can view their tenant's shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can create shipments for their tenant" ON public.shipments;
DROP POLICY IF EXISTS "Users can update their tenant's shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can delete their tenant's shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can view tracking events for their shipments" ON public.tracking_events;
DROP POLICY IF EXISTS "Service role can manage tracking events" ON public.tracking_events;
DROP POLICY IF EXISTS "Anyone can view carriers" ON public.carriers;

-- =============================================================
-- 7. CREATE RLS POLICIES
-- =============================================================

-- Shipments: View
CREATE POLICY "Users can view their tenant's shipments"
    ON public.shipments FOR SELECT
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

-- Shipments: Insert
CREATE POLICY "Users can create shipments for their tenant"
    ON public.shipments FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
        )
    );

-- Shipments: Update
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

-- Shipments: Delete
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

-- Tracking Events: View
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

-- Tracking Events: Service role
CREATE POLICY "Service role can manage tracking events"
    ON public.tracking_events FOR ALL
    USING (auth.role() = 'service_role');

-- Carriers: Read-only
CREATE POLICY "Anyone can view carriers"
    ON public.carriers FOR SELECT
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- =============================================================
-- 8. CREATE HELPER FUNCTION
-- =============================================================

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

GRANT EXECUTE ON FUNCTION public.get_shipment_stats_by_tenant(UUID) TO authenticated;

-- =============================================================
-- 9. VERIFICATION
-- =============================================================

DO $$
DECLARE
    shipments_count INTEGER;
    tracking_events_count INTEGER;
    carriers_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO shipments_count FROM information_schema.tables WHERE table_name = 'shipments';
    SELECT COUNT(*) INTO tracking_events_count FROM information_schema.tables WHERE table_name = 'tracking_events';
    SELECT COUNT(*) INTO carriers_count FROM information_schema.tables WHERE table_name = 'carriers';
    
    RAISE NOTICE '=== SHIPMENT MODULE MIGRATION COMPLETE ===';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  ✓ shipments: %', CASE WHEN shipments_count > 0 THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE '  ✓ tracking_events: %', CASE WHEN tracking_events_count > 0 THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE '  ✓ carriers: %', CASE WHEN carriers_count > 0 THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE '';
    RAISE NOTICE 'RLS Policies: ENABLED';
    RAISE NOTICE 'Helper Functions: CREATED';
    RAISE NOTICE '===========================================';
END $$;
