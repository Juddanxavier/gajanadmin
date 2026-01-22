<!-- @format -->

# Tenant Seeding - India & Sri Lanka

**Date:** 2026-01-20  
**Status:** ✅ **COMPLETE**

## Tenants Created

### 1. Gajan Traders India

- **ID:** `06eb8cfb-8783-439e-a1e9-84e0fd2919d7`
- **Slug:** `india`
- **Country Code:** `IN`
- **Status:** Active ✅

### 2. Gajan Traders Sri Lanka

- **ID:** `91dc8ac0-47eb-4ab9-bedf-815bb987456f`
- **Slug:** `sri-lanka`
- **Country Code:** `LK`
- **Status:** Active ✅

## Auto-Created Resources

When a tenant is created, the database automatically creates:

### ✅ Email Templates (3 per tenant)

Each tenant got these default templates:

1. `shipment_status` - General status updates
2. `shipment_delivered` - Delivery notifications
3. `shipment_exception` - Exception alerts

**Total:** 6 email templates (3 × 2 tenants)

### ⚠️ Settings

Settings table is empty - needs manual configuration per tenant.

## User Assignments

### Global Admin Access

**User:** `juddan2008@gmail.com`  
**User ID:** `f23f9ee8-c48a-4f2b-a2a9-6792d9a591fb`

**Assigned to:**

- ✅ Gajan Traders India
- ✅ Gajan Traders Sri Lanka

**Access Level:**

- **Global Admin** (via `user_roles` with `tenant_id IS NULL`)
- **Tenant Member** (via `user_tenants` for both India & Sri Lanka)

This means the admin can:

1. See ALL data across ALL tenants (global admin privilege)
2. Switch between India and Sri Lanka tenant views
3. Manage users, settings, and data for both tenants

## Database Structure

```
tenants
├── id (UUID)
├── name (TEXT)
├── slug (TEXT) - Unique identifier
├── country_code (TEXT) - ISO country code
├── is_active (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## Scripts Created

### 1. `scripts/seed-tenants.ts`

Seeds India and Sri Lanka tenants with auto-verification.

**Usage:**

```bash
npx tsx --env-file=.env.local scripts/seed-tenants.ts
```

### 2. `scripts/assign-admin-to-tenants.ts`

Assigns global admin to all tenants.

**Usage:**

```bash
npx tsx --env-file=.env.local scripts/assign-admin-to-tenants.ts
```

## Next Steps

### 1. Configure Tenant Settings

Create settings for each tenant:

```sql
INSERT INTO settings (tenant_id, company_name, timezone, currency)
VALUES
  ('06eb8cfb-8783-439e-a1e9-84e0fd2919d7', 'Gajan Traders India', 'Asia/Kolkata', 'INR'),
  ('91dc8ac0-47eb-4ab9-bedf-815bb987456f', 'Gajan Traders Sri Lanka', 'Asia/Colombo', 'LKR');
```

### 2. Add More Users

Assign users to specific tenants:

```sql
-- Add user to India tenant
INSERT INTO user_tenants (user_id, tenant_id)
SELECT '<user_id>', id FROM tenants WHERE slug = 'india';

-- Give user admin role for India
INSERT INTO user_roles (user_id, role, tenant_id)
SELECT '<user_id>', 'admin', id FROM tenants WHERE slug = 'india';
```

### 3. Configure Notification Providers

Set up email/SMS providers for each tenant in `tenant_notification_configs`.

### 4. Customize Email Templates

Update the default email templates for each tenant's branding.

## Tenant Isolation

### How RLS Works

All tables with `tenant_id` column enforce Row Level Security:

```sql
-- Example: Shipments table
CREATE POLICY shipments_isolation ON shipments FOR ALL USING (
    (is_admin(auth.uid())) OR  -- Global admin sees ALL
    tenant_id IN (              -- Others see only their tenants
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
);
```

### Access Patterns

**Global Admin (`juddan2008@gmail.com`):**

- ✅ Can see shipments from India
- ✅ Can see shipments from Sri Lanka
- ✅ Can see shipments from ANY future tenant
- ✅ Can manage all settings

**Tenant-Specific Admin:**

- ✅ Can see only their tenant's data
- ❌ Cannot see other tenants' data
- ✅ Can manage their tenant's settings

**Regular User:**

- ✅ Can see only their tenant's data
- ❌ Cannot manage settings
- ✅ Can view shipments/leads they have access to

## Verification Queries

### Check all tenants

```sql
SELECT * FROM tenants ORDER BY created_at;
```

### Check user-tenant assignments

```sql
SELECT
  ut.user_id,
  p.email,
  t.name as tenant_name,
  t.slug
FROM user_tenants ut
JOIN profiles p ON p.id = ut.user_id
JOIN tenants t ON t.id = ut.tenant_id;
```

### Check user roles

```sql
SELECT
  ur.user_id,
  p.email,
  ur.role,
  t.name as tenant_name,
  CASE WHEN ur.tenant_id IS NULL THEN 'Global' ELSE 'Tenant-Specific' END as scope
FROM user_roles ur
JOIN profiles p ON p.id = ur.user_id
LEFT JOIN tenants t ON t.id = ur.tenant_id;
```

## Summary

✅ **Tenants:** 2 (India, Sri Lanka)  
✅ **Email Templates:** 6 (3 per tenant)  
✅ **Global Admin:** Assigned to both tenants  
✅ **RLS Policies:** Active and enforcing tenant isolation  
✅ **Auto-triggers:** Email templates created on tenant insert

---

**Status:** Ready for production use. Users can now be assigned to India or Sri
Lanka tenants, and data will be properly isolated by tenant.
