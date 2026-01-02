# Email Notifications - Quick Setup

## 🎯 **What It Does**

Automatically sends beautiful emails when shipment status changes to:
- ✅ **info_received** - Initial tracking notification with QR code
- ✅ **delivered** - Delivery confirmation
- ✅ **exception** - Issue alert

**Features:**
- React Email templates (customizable)
- QR codes for easy tracking
- Rate limiting (100/hour per tenant)
- Duplicate prevention (database-level)
- Supports ZeptoMail & SMTP
- Tenant-aware (different providers per country)

---

## 🚀 **Setup (4 Steps)**

### **Step 1: Apply Migrations**

Run these SQL files in Supabase SQL Editor (in order):

1. `supabase/migrations/20251231_cleanup_notifications.sql`
2. `supabase/migrations/20251231_email_notification_trigger.sql`

### **Step 2: Configure Database**

```sql
ALTER DATABASE postgres SET app.api_url = 'http://localhost:3000';
-- For production: 'https://your-app.vercel.app'
```

### **Step 3: Configure Email in Notification Settings**

Go to **Admin → Notification Settings** and add:

**For ZeptoMail:**
- Channel: Email
- Provider: ZeptoMail
- API Key: your-zeptomail-api-key
- From Email: noreply@yourdomain.com
- From Name: Your Company
- Company Name: Your Company
- Tracking URL: http://localhost:3000
- Active: ✅

**For SMTP:**
- Channel: Email
- Provider: SMTP
- Host: smtp.gmail.com
- Port: 587
- User: your-email@gmail.com
- Pass: your-app-password
- From Email: your-email@gmail.com
- From Name: Your Company
- Company Name: Your Company
- Tracking URL: http://localhost:3000
- Active: ✅

### **Step 4: Test**

```bash
# Start dev server
npm run dev

# Create test shipment
npx tsx scripts/create-mock-shipment.ts
```

---

## 📧 **Email Statuses**

Only these statuses trigger emails:

| Status | Email Type | Contains |
|--------|-----------|----------|
| **info_received** | Initial Tracking | QR code, tracking link, invoice amount |
| **delivered** | Delivery Confirmation | Delivery date, tracking link |
| **exception** | Issue Alert | Support info, tracking link |

Other statuses (in_transit, out_for_delivery, etc.) do **NOT** send emails.

---

## 🔍 **Verify**

```sql
-- Check sent emails
SELECT 
  recipient,
  subject,
  status,
  created_at
FROM notification_logs
WHERE type = 'email'
ORDER BY created_at DESC
LIMIT 10;

-- Check for duplicates (should be 0)
SELECT 
  shipment_id,
  subject,
  COUNT(*) as count
FROM notification_logs
WHERE status = 'sent'
GROUP BY shipment_id, subject
HAVING COUNT(*) > 1;
```

---

## 🐛 **Troubleshooting**

**No emails sent?**
1. Check dev server is running: `npm run dev`
2. Check database config: `SHOW app.api_url;`
3. Check tenant has email config (Notification Settings)
4. Check customer has email in shipment data

**Emails going to spam?**
1. Verify sender email in provider dashboard
2. Set up SPF/DKIM records
3. Use professional sender email

**Too many emails?**
- Rate limit: 100 emails/hour per tenant
- Duplicate prevention is automatic
- Only 3 statuses trigger emails

---

## 📊 **Features**

✅ **Smart Filtering** - Only critical statuses  
✅ **Duplicate Prevention** - Database-level constraint  
✅ **Rate Limiting** - 100 emails/hour per tenant  
✅ **Tenant Aware** - Different providers per country  
✅ **Beautiful Templates** - React Email (customizable)  
✅ **QR Codes** - Easy mobile tracking  
✅ **Error Handling** - Graceful failures  

---

**Ready to send beautiful emails!** 🎉📧
