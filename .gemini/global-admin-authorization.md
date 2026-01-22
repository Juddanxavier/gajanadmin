<!-- @format -->

# Global Admin Authorization Check

**Date:** 2026-01-20  
**Status:** ✅ **PROPERLY CONFIGURED**

## How Global Admin Works

### 1. Database Function: `is_admin()`

Located in: `supabase/migrations/20260104_enable_super_admin.sql`

```sql
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = user_uuid
        AND role = 'admin'
        AND tenant_id IS NULL  -- ⭐ Key: NULL tenant_id = Global Admin
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Logic:**

- Global Admin = User with `role = 'admin'` AND `tenant_id IS NULL`
- Regular Admin = User with `role = 'admin'` AND `tenant_id = <some_uuid>`

### 2. Application Check: `checkUserAccess()`

Located in: `app/actions/auth.ts`

```typescript
export async function checkUserAccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { authorized: false, isAuthenticated: false };

  const admin = createAdminClient();

  // 1. Check Global Admin using RPC function
  const { data: isGlobalAdmin } = await admin.rpc('is_admin', {
    user_uuid: user.id,
  });

  if (isGlobalAdmin) {
    return { authorized: true, isAuthenticated: true };
  }

  // 2. Check User Roles (tenant-specific admin/staff)
  const { data: roles } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const hasAccess = roles?.some((r) => ['admin', 'staff'].includes(r.role));

  return { authorized: !!hasAccess, isAuthenticated: true };
}
```

**Flow:**

1. Get authenticated user
2. Check if user is Global Admin (via `is_admin()` RPC)
3. If not, check if user has tenant-specific admin/staff role
4. Return authorization status

### 3. Row Level Security (RLS) Policies

All tables use the `is_admin()` function in their RLS policies:

```sql
-- Example: Shipments table
CREATE POLICY shipments_select_policy ON shipments FOR SELECT USING (
    (public.is_admin(auth.uid())) OR  -- ⭐ Global Admin bypass
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);
```

**Tables with Global Admin access:**

- ✅ `shipments`
- ✅ `leads`
- ✅ `settings`
- ✅ `notifications`
- ✅ `users` (via user_roles)

## Current Setup Status

### ✅ Functions Available

- `is_admin(user_uuid UUID)` - Check if user is global admin
- `make_super_admin(user_email TEXT)` - Helper to create global admin

### ✅ Global Admins

**Count:** 1 Global Admin

**User ID:** `f23f9ee8-c48a-4f2b-a2a9-6792d9a591fb`  
**Email:** `juddan2008@gmail.com`

### ✅ Database Structure

```
user_roles table:
- user_id: UUID (references auth.users)
- role: TEXT ('admin', 'staff', 'user')
- tenant_id: UUID (NULL for global admin)
- created_at: TIMESTAMP
```

## How to Create a Global Admin

### Method 1: Using Helper Function (Recommended)

```sql
SELECT make_super_admin('user@example.com');
```

### Method 2: Direct Insert

```sql
INSERT INTO user_roles (user_id, role, tenant_id)
SELECT id, 'admin', NULL
FROM auth.users
WHERE email = 'user@example.com';
```

### Method 3: Using Supabase Client (from app)

```typescript
const { data } = await supabase.rpc('make_super_admin', {
  user_email: 'user@example.com',
});
```

## Testing Script

Run this to check admin setup anytime:

```bash
npx tsx --env-file=.env.local scripts/check-admin-setup.ts
```

## Security Notes

1. **SECURITY DEFINER** - The `is_admin()` function runs with elevated
   privileges to bypass RLS when checking roles
2. **Service Role Key** - `checkUserAccess()` uses admin client to query
   `user_roles` table
3. **NULL Handling** - `tenant_id IS NULL` specifically identifies global admins
4. **RLS Bypass** - Global admins can see ALL data across ALL tenants

## Login Flow with Admin Check

```
1. User enters credentials
   ↓
2. Supabase authenticates user
   ↓
3. checkUserAccess() is called
   ↓
4. is_admin(user.id) RPC executed
   ↓
5. If TRUE → authorized = true (Global Admin)
   ↓
6. If FALSE → Check tenant-specific roles
   ↓
7. Return authorization result
   ↓
8. If authorized → Allow login
   ↓
9. If not authorized → Sign out + error
```

## Verification Results

✅ **is_admin() function:** Available and working  
✅ **make_super_admin() function:** Available  
✅ **user_roles table:** Accessible  
✅ **Global Admin count:** 1  
✅ **RLS Policies:** Configured with is_admin() checks

---

**Summary:** Global admin authorization is properly configured. The system
checks for `role = 'admin'` AND `tenant_id IS NULL` to identify global
administrators who have access to all data across all tenants.
