# Shipment Module Analysis

## 📦 **Overview**

The shipment module is a comprehensive tracking system that integrates with Track123 API to manage package tracking, status updates, and notifications. It follows a multi-tier architecture with clear separation of concerns.

---

## 🏗️ **Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
│  (UI Components, Forms, Tables)                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    ACTION LAYER                              │
│  (Server Actions - /app/admin/shipments/actions.ts)        │
│  - createShipmentAction                                     │
│  - syncShipmentAction                                       │
│  - getShipments                                             │
│  - updateShipmentCarrierAction                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                              │
│  (ShipmentService - /lib/services/shipment-service.ts)     │
│  - Business logic                                           │
│  - Data transformation                                      │
│  - Provider orchestration                                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  PROVIDER LAYER                              │
│  (Track123Provider - /lib/tracking/providers/track123.ts)  │
│  - API integration                                          │
│  - Data normalization                                       │
│  - Carrier management                                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                             │
│  (Supabase PostgreSQL)                                      │
│  - shipments table                                          │
│  - tracking_events table                                    │
│  - carriers table                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 **Database Schema**

### **1. Shipments Table**

```sql
CREATE TABLE shipments (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    
    -- Tracking Codes
    white_label_code TEXT UNIQUE NOT NULL,  -- Your internal tracking code
    carrier_tracking_code TEXT NOT NULL,     -- Carrier's tracking number
    
    -- Carrier & Provider
    carrier_id TEXT,                         -- e.g., 'dhl', 'fedex'
    provider TEXT DEFAULT 'track123',        -- Tracking API provider
    
    -- Status & Tracking
    status TEXT DEFAULT 'pending',           -- Current shipment status
    estimated_delivery TIMESTAMPTZ,
    latest_location TEXT,
    
    -- Customer & Invoice
    customer_details JSONB,                  -- {name, email, phone}
    invoice_details JSONB,                   -- {amount, currency}
    
    -- Metadata
    user_id UUID,                            -- Assigned user
    last_synced_at TIMESTAMPTZ,             -- Last API sync
    raw_response JSONB,                      -- Latest API response
    
    -- Soft Delete
    deleted_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(provider, carrier_tracking_code) WHERE deleted_at IS NULL
);
```

**Key Features:**
- ✅ **Idempotency**: Prevents duplicate tracking numbers per provider
- ✅ **Multi-tenancy**: Tenant isolation via `tenant_id`
- ✅ **Soft Delete**: Maintains history
- ✅ **JSONB Storage**: Flexible customer/invoice data

### **2. Tracking Events Table**

```sql
CREATE TABLE tracking_events (
    id UUID PRIMARY KEY,
    shipment_id UUID NOT NULL,
    
    -- Event Details
    status TEXT NOT NULL,                    -- e.g., 'in_transit', 'delivered'
    location TEXT,                           -- Event location
    description TEXT,                        -- Human-readable description
    occurred_at TIMESTAMPTZ NOT NULL,       -- When event happened
    
    -- Metadata
    raw_data JSONB,                         -- Original API data
    created_at TIMESTAMPTZ,
    
    -- Deduplication
    UNIQUE(shipment_id, occurred_at, status)
);
```

**Key Features:**
- ✅ **Event Deduplication**: Prevents duplicate events
- ✅ **Cascade Delete**: Auto-cleanup when shipment deleted
- ✅ **Historical Tracking**: Complete audit trail

### **3. Carriers Table**

```sql
CREATE TABLE carriers (
    code TEXT PRIMARY KEY,                   -- e.g., 'dhl', 'fedex'
    name_en TEXT,                            -- English name
    name_cn TEXT,                            -- Chinese name
    homepage TEXT,                           -- Carrier website
    logo_url TEXT,                           -- Carrier logo
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

**Key Features:**
- ✅ **Multi-language**: Supports EN/CN
- ✅ **Cached Data**: Synced from Track123 API
- ✅ **Search Optimized**: GIN indexes for fuzzy search

---

## 🔄 **Data Flow**

### **Creating a Shipment**

```
1. User submits form
   ↓
2. createShipmentAction (Server Action)
   - Validates permissions (staff/admin only)
   - Extracts user/tenant context
   ↓
3. ShipmentService.createShipment()
   - Generates white_label_code
   - Calls Track123Provider.createTracker()
   ↓
4. Track123Provider.createTracker()
   - POST /track/import to Track123 API
   - Normalizes response
   ↓
5. ShipmentService saves to database
   - INSERT into shipments table
   - INSERT tracking events
   ↓
6. Returns success response
   - Revalidates cache
   - Updates UI
```

### **Syncing a Shipment**

```
1. User clicks "Sync" or Cron job runs
   ↓
2. syncShipmentAction / Cron endpoint
   ↓
3. ShipmentService.syncShipment()
   - Fetches shipment from DB
   - Calls Track123Provider.getTracking()
   ↓
4. Track123Provider.getTracking()
   - POST /track/query to Track123 API
   - Normalizes response
   ↓
5. ShipmentService updates database
   - UPDATE shipments (status, location, etc.)
   - INSERT new tracking events (deduplicated)
   - UPDATE last_synced_at
   ↓
6. Triggers notification (if status changed)
   - Database trigger fires
   - Creates in-app notification
```

---

## 🔌 **Track123 Provider Integration**

### **API Endpoints Used**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/track/import` | POST | Create new tracker |
| `/track/query` | POST | Get tracking details |
| `/carriers` | GET | Fetch carrier list |

### **Authentication**

```typescript
headers: {
  'Track123-Api-Key': apiKey,
  'Content-Type': 'application/json'
}
```

### **Status Mapping**

Track123 → Internal Status:

```typescript
'InfoReceived' → 'info_received'
'InTransit' → 'in_transit'
'OutForDelivery' → 'out_for_delivery'
'Delivered' → 'delivered'
'Exception' → 'exception'
'Expired' → 'expired'
```

### **Error Handling**

- ✅ **Already Exists**: Gracefully handles duplicate tracking numbers
- ✅ **Retry Logic**: Retries failed API calls
- ✅ **Fallback**: Returns mock data in development

---

## 🔐 **Security & Permissions**

### **Row Level Security (RLS)**

```sql
-- Shipments
CREATE POLICY "Tenant isolation" ON shipments
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid()
    )
  );

-- Tracking Events
CREATE POLICY "View via shipment" ON tracking_events
  FOR SELECT USING (
    shipment_id IN (
      SELECT id FROM shipments 
      WHERE tenant_id IN (...)
    )
  );
```

### **Permission Checks**

```typescript
// Server Actions
await ensureStaffAccess(); // Requires staff or admin role

// Service Layer
const tenantIds = await getUserTenantIds(); // Filters by user's tenants
```

---

## 📈 **Key Features**

### **1. Idempotency**

```typescript
// Prevents duplicate shipments
UNIQUE(provider, carrier_tracking_code) WHERE deleted_at IS NULL

// Prevents duplicate events
UNIQUE(shipment_id, occurred_at, status)
```

### **2. Multi-Tenancy**

```typescript
// All queries filtered by tenant
const tenantIds = await getUserTenantIds();
query = query.in('tenant_id', tenantIds);
```

### **3. Soft Delete**

```typescript
// Marks as deleted instead of removing
UPDATE shipments SET deleted_at = NOW() WHERE id = ?

// Queries exclude deleted
WHERE deleted_at IS NULL
```

### **4. Event Deduplication**

```typescript
// ON CONFLICT DO NOTHING
INSERT INTO tracking_events (...)
ON CONFLICT (shipment_id, occurred_at, status) 
DO NOTHING;
```

### **5. Automatic Syncing**

```typescript
// Cron job every 30 minutes
SELECT cron.schedule(
  'sync-shipments',
  '*/30 * * * *',
  'SELECT net.http_post(...)'
);
```

---

## 🔔 **Notification System**

### **Trigger on Status Change**

```sql
CREATE TRIGGER on_shipment_status_change
  AFTER UPDATE ON shipments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_shipment_notification();
```

### **Notification Function**

```sql
CREATE FUNCTION trigger_shipment_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create in-app notification
  INSERT INTO notifications (
    user_id, shipment_id, type, title, message
  ) VALUES (
    NEW.user_id,
    NEW.id,
    'status_update',
    'Shipment Update: ' || NEW.carrier_tracking_code,
    'Status changed to ' || NEW.status
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Note:** Currently only creates in-app notifications. Email/SMS sending requires:
- Edge Function to listen to `notifications` table
- Integration with `tenant_notification_configs`
- Email provider (ZeptoMail) integration

---

## 📝 **Service Methods**

### **ShipmentService**

| Method | Purpose |
|--------|---------|
| `createShipment()` | Create new shipment & import to Track123 |
| `getShipments()` | List shipments with pagination/filters |
| `syncShipment()` | Fetch latest tracking data from API |
| `updateShipment()` | Update shipment details |
| `deleteShipment()` | Soft delete shipment |
| `getStats()` | Get shipment statistics |
| `searchCarriers()` | Search available carriers |

### **Track123Provider**

| Method | Purpose |
|--------|---------|
| `createTracker()` | Import tracking number to Track123 |
| `getTracking()` | Query tracking details |
| `getCarriers()` | Fetch carrier list from API |
| `normalizeResponse()` | Transform API response to internal format |
| `mapStatus()` | Map Track123 status to internal status |

---

## 🚀 **Usage Examples**

### **Create Shipment**

```typescript
const result = await createShipmentAction({
  tracking_number: 'ABC123456789',
  carrier_code: 'dhl',
  customer_name: 'John Doe',
  customer_email: 'john@example.com',
  customer_phone: '+1234567890',
  amount: 99.99,
});
```

### **Sync Shipment**

```typescript
const result = await syncShipmentAction(shipmentId);
```

### **Get Shipments**

```typescript
const result = await getShipments(
  1,                              // page
  10,                             // pageSize
  { status: 'in_transit' },      // filters
  { id: 'created_at', desc: true } // sorting
);
```

---

## 🔧 **Configuration**

### **Environment Variables**

```env
TRACK123_API_KEY=your_api_key_here
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **Settings Table**

```sql
INSERT INTO settings (key, value) VALUES
('track123_api_key', '"your_api_key"'),
('sync_interval_minutes', '30');
```

---

## 📊 **Statistics & Analytics**

```typescript
const stats = await getShipmentStats();

// Returns:
{
  total: 150,
  pending: 20,
  in_transit: 80,
  delivered: 45,
  exception: 5
}
```

---

## 🎯 **Best Practices**

1. ✅ **Always use tenant filtering** - Prevents data leaks
2. ✅ **Handle API failures gracefully** - Retry logic + fallbacks
3. ✅ **Deduplicate events** - Use UNIQUE constraints
4. ✅ **Soft delete** - Maintain audit trail
5. ✅ **Validate permissions** - Check staff/admin access
6. ✅ **Revalidate cache** - After mutations
7. ✅ **Log errors** - For debugging API issues

---

## 🐛 **Common Issues & Solutions**

### **Issue: Duplicate Tracking Numbers**

**Solution:** Unique constraint prevents this
```sql
UNIQUE(provider, carrier_tracking_code) WHERE deleted_at IS NULL
```

### **Issue: Missing Tracking Events**

**Solution:** Sync shipment to fetch latest data
```typescript
await syncShipmentAction(shipmentId);
```

### **Issue: Notifications Not Sending**

**Solution:** 
1. Check if trigger fired (query `notifications` table)
2. Implement email-sending Edge Function
3. Configure `tenant_notification_configs`

---

## 🔮 **Future Enhancements**

1. **Email/SMS Notifications** - Integrate with ZeptoMail/Twilio
2. **Webhook Support** - Real-time updates from Track123
3. **Batch Import** - Upload CSV of tracking numbers
4. **Custom Carriers** - Support non-Track123 carriers
5. **Analytics Dashboard** - Delivery time analysis
6. **Customer Portal** - Public tracking page

---

## 📚 **Related Files**

- `/app/admin/shipments/actions.ts` - Server actions
- `/lib/services/shipment-service.ts` - Business logic
- `/lib/tracking/providers/track123.ts` - API integration
- `/lib/tracking/types.ts` - TypeScript types
- `/components/shipments/*` - UI components
- `/supabase/migrations/*` - Database schema

---

**Last Updated:** 2025-12-30
**Version:** 1.0
