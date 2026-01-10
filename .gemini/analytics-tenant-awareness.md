<!-- @format -->

# Analytics Tenant Logic - Global, India, Sri Lanka

## 🌍 Tenant Structure

Your system has 3 tenants:

1. **Global** - `tenant_id IS NULL` or undefined - Sees ALL data
2. **India** - `tenant_id = 'india-id'` - Sees only India data
3. **Sri Lanka** - `tenant_id = 'srilanka-id'` - Sees only Sri Lanka data

## 🔧 Correct Implementation Logic

### Current Problem

```typescript
// ❌ WRONG: Treats undefined as "no filter" (shows all)
const stats = await service.getStats(userIsAdmin ? undefined : userTenantIds);
```

### Correct Logic

```typescript
// ✅ CORRECT: Global tenant (undefined/null) should see ALL data
const userTenantIds = await getUserTenantIds();
const isGlobalTenant = !userTenantIds || userTenantIds.length === 0;

const stats = await service.getStats(
  isGlobalTenant ? undefined : userTenantIds
);
```

## 📊 Expected Behavior

### User with Global Tenant (tenant_id IS NULL)

```
✅ Lead Analytics: ALL leads (India + Sri Lanka + Global)
✅ User Analytics: ALL users
✅ Shipment Analytics: ALL shipments
```

### User with India Tenant

```
✅ Lead Analytics: ONLY India leads
✅ User Analytics: ONLY India users
✅ Shipment Analytics: ONLY India shipments
```

### User with Sri Lanka Tenant

```
✅ Lead Analytics: ONLY Sri Lanka leads
✅ User Analytics: ONLY Sri Lanka users
✅ Shipment Analytics: ONLY Sri Lanka shipments
```

## 🔍 Key Distinction

**Global Tenant** vs **Global Admin**:

- **Global Tenant**: User assigned to "Global" tenant (tenant_id IS NULL)
- **Global Admin**: User with 'admin' role (can be in any tenant)

**Important**:

- Global Tenant user → Sees ALL data (regardless of role)
- India Tenant admin → Sees ONLY India data (even though admin)
- Sri Lanka Tenant staff → Sees ONLY Sri Lanka data

## 💻 Implementation

### Lead Analytics (Already Correct!)

```typescript
// app/(dashboard)/leads/actions.ts

export async function getLeadStats() {
  const supabase = await createClient();
  const userIsAdmin = await isAdmin();
  const userTenantIds = await getUserTenantIds();

  const service = new LeadsService(supabase);

  // ✅ If userTenantIds is empty/undefined → Global tenant → see all
  // ✅ If userTenantIds has values → Filter by those tenants
  const stats = await service.getStats(userIsAdmin ? undefined : userTenantIds);

  return successResponse(stats);
}
```

**This works because**:

- Global tenant: `userTenantIds = []` → `undefined` → sees all ✅
- India tenant: `userTenantIds = ['india-id']` → filters ✅
- Sri Lanka tenant: `userTenantIds = ['srilanka-id']` → filters ✅

### User Analytics (Needs Same Logic)

```typescript
// app/(dashboard)/users/actions.ts

export async function getUserStats() {
  const supabase = await createClient();
  const userIsAdmin = await isAdmin();
  const userTenantIds = await getUserTenantIds();

  const service = new UserService(supabase);

  // ✅ Same logic as leads
  const stats = await service.getStats(userIsAdmin ? undefined : userTenantIds);

  return successResponse(stats);
}
```

### Shipment Analytics (Needs Verification)

```typescript
// app/(dashboard)/shipments/analytics/actions.ts

export async function getShipmentStats() {
  const supabase = await createClient();
  const userIsAdmin = await isAdmin();
  const userTenantIds = await getUserTenantIds();

  const service = new ShipmentService(supabase);

  // ✅ Same logic
  const stats = await service.getStats(userIsAdmin ? undefined : userTenantIds);

  return successResponse(stats);
}
```

## 🎯 Service Layer Implementation

### LeadsService (Reference Implementation)

```typescript
class LeadsService {
  async getStats(tenantIds?: string[]) {
    let query = this.supabase.from('leads').select('*');

    // ✅ If tenantIds is undefined/empty → No filter (see all)
    // ✅ If tenantIds has values → Filter by those IDs
    if (tenantIds && tenantIds.length > 0) {
      query = query.in('tenant_id', tenantIds);
    }

    // ... aggregate stats
    return stats;
  }
}
```

### UserService (Needs Update)

```typescript
class UserService {
  async getStats(tenantIds?: string[]) {
    let query = this.supabase.from('user_tenants').select('user_id, tenant_id');

    // ✅ Add this filtering logic
    if (tenantIds && tenantIds.length > 0) {
      query = query.in('tenant_id', tenantIds);
    }

    // ... aggregate stats
    return stats;
  }
}
```

## 🔐 Database RLS Policies

Ensure RLS allows Global tenant to see all:

```sql
-- Leads Policy
CREATE POLICY "tenant_isolation_leads" ON leads
FOR SELECT USING (
  -- Global tenant (no tenant assigned) sees all
  NOT EXISTS (
    SELECT 1 FROM user_tenants
    WHERE user_id = auth.uid()
  )
  OR
  -- Regular tenant sees only their data
  tenant_id IN (
    SELECT tenant_id FROM user_tenants
    WHERE user_id = auth.uid()
  )
  OR
  -- Admin role sees all
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'admin'
  )
);
```

## 📋 Testing Scenarios

### Test 1: Global Tenant User

```
User: john@global.com
Tenant: NULL (Global)
Role: Staff

Expected:
- Sees all India leads
- Sees all Sri Lanka leads
- Sees all Global leads
- Total count = India + Sri Lanka + Global
```

### Test 2: India Tenant Admin

```
User: admin@india.com
Tenant: India
Role: Admin

Expected:
- Sees ONLY India leads
- Does NOT see Sri Lanka leads
- Does NOT see Global leads
- Total count = India only
```

### Test 3: Sri Lanka Tenant User

```
User: user@srilanka.com
Tenant: Sri Lanka
Role: Staff

Expected:
- Sees ONLY Sri Lanka leads
- Does NOT see India leads
- Does NOT see Global leads
- Total count = Sri Lanka only
```

## 🚨 Common Pitfalls

### ❌ Wrong: Checking isAdmin

```typescript
// This is WRONG for your use case
const stats = await service.getStats(userIsAdmin ? undefined : userTenantIds);
```

**Problem**: India admin would see ALL data (wrong!)

### ✅ Correct: Checking tenant

```typescript
// This is CORRECT
const isGlobalTenant = !userTenantIds || userTenantIds.length === 0;
const stats = await service.getStats(
  isGlobalTenant ? undefined : userTenantIds
);
```

**Benefit**: Only Global tenant sees all, regardless of role

## 💡 Optional Enhancement: Tenant Indicator

Show which tenant's data is being viewed:

```tsx
<div className='flex items-center gap-2 text-sm'>
  <Building2 className='h-4 w-4' />
  <span>
    {!userTenantIds || userTenantIds.length === 0
      ? 'Global (All Regions)'
      : tenantNames.join(', ')}
  </span>
</div>
```

## 📝 Summary

**Key Points**:

1. ✅ Global tenant (`tenant_id IS NULL`) → Sees ALL data
2. ✅ India tenant → Sees ONLY India data
3. ✅ Sri Lanka tenant → Sees ONLY Sri Lanka data
4. ✅ Tenant filtering is MORE important than role
5. ✅ Admin in India tenant still sees ONLY India data

**Current Status**:

- ✅ Lead Analytics: Already implements this correctly
- ⚠️ User Analytics: Needs the same logic
- ❓ Shipment Analytics: Needs verification

**The logic is simple**:

```typescript
const userTenantIds = await getUserTenantIds();
// If empty/undefined → Global tenant → see all
// If has values → Filter by those values
```
