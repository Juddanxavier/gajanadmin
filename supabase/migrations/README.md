# Database Migration - Quick Start

## 🚀 **How to Deploy**

### **Step 1: Open Supabase Dashboard**
1. Go to your Supabase project
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### **Step 2: Copy & Paste**
1. Open the file: `00000000000000_complete_schema.sql`
2. Copy the **entire contents**
3. Paste into the SQL Editor

### **Step 3: Run**
1. Click the **Run** button (or press Ctrl+Enter)
2. Wait for completion (should take 5-10 seconds)
3. Check for success message

---

## ✅ **What This Does**

This migration will:
- ✅ Drop all existing tables and policies (clean slate)
- ✅ Create all tables with correct schema
- ✅ Set up Row Level Security (RLS)
- ✅ Create helper functions
- ✅ Add default roles (admin, staff, customer)

---

## 📋 **Tables Created**

1. **Core Tables:**
   - `tenants` - Organizations
   - `user_tenants` - User-org relationships
   - `roles` - System roles
   - `permissions` - Granular permissions
   - `user_roles` - User role assignments

2. **Business Tables:**
   - `carriers` - Shipping carriers
   - `shipments` - Tracking records
   - `tracking_events` - Shipment history
   - `leads` - Sales leads
   - `settings` - App configuration
   - `notification_logs` - Email/SMS logs

---

## ⚠️ **Important Notes**

### **This Migration Will:**
- ❌ **DELETE ALL EXISTING DATA** in these tables
- ✅ Recreate tables with correct schema
- ✅ Fix all column and function issues
- ✅ Be safe to run multiple times (idempotent)

### **Before Running:**
- 🔴 **Backup your data** if you have important records
- 🟢 Safe to run on fresh/empty databases
- 🟡 Will reset everything on existing databases

---

## 🔄 **After Migration**

### **Next Steps:**
1. ✅ Verify tables created (check Tables in Supabase)
2. ✅ Create your first tenant
3. ✅ Assign user roles
4. ✅ Configure settings at `/admin/settings`
5. ✅ Import carriers (optional)

---

## 🆘 **Troubleshooting**

### **If you get errors:**
1. Make sure you're using the **SQL Editor** (not migrations panel)
2. Copy the **entire file** (all ~700 lines)
3. Run as a **single query** (don't split it)

### **Still having issues?**
- Check Supabase logs for specific errors
- Ensure you have admin access to the database
- Try running in a fresh project

---

## 📁 **File Location**

```
supabase/migrations/00000000000000_complete_schema.sql
```

**This is the ONLY migration file you need!**

---

✅ **Ready to deploy? Copy the SQL file and paste it into Supabase SQL Editor!**
