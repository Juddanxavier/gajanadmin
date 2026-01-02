# Email Notifications - Final Setup

## ✅ **What You Have**

- `shipments` table - Stores shipment data
- `notification_logs` table - Logs email delivery
- `tenant_notification_configs` table - Email settings per tenant
- `in_app_notifications` table - For notification bell (separate system)

## 🎯 **How It Works**

```
1. Shipment status changes (e.g., in_transit → delivered)
   ↓
2. Database trigger: send_shipment_status_email()
   ↓
3. Trigger calls Edge Function: send-notification
   ↓
4. Edge Function:
   - Gets tenant email config
   - Gets customer email from shipment.customer_details
   - Sends email via ZeptoMail
   - Logs in notification_logs table
```

## 🚀 **Setup (3 Steps)**

### **1. Deploy Edge Function**
```bash
supabase functions deploy send-notification
```

### **2. Configure Database**
Run this SQL in Supabase:

```sql
-- Set your Supabase URL and service role key
ALTER DATABASE postgres 
SET app.functions_url = 'http://your-supabase-url/functions/v1';

ALTER DATABASE postgres 
SET app.service_role_key = 'your-service-role-key';
```

### **3. Run Migration**
```bash
supabase db push
```

Or run the SQL file manually:
`supabase/migrations/20251230_email_notification_trigger.sql`

## 📧 **Configure Email for Tenant**

Run the setup script:
```bash
npx tsx scripts/setup-email-notifications.ts
```

This will ask for:
- Tenant to configure
- ZeptoMail API key
- Sender email (must be verified in ZeptoMail)
- Company name

## 🧪 **Test It**

```bash
# Create a test shipment and trigger status change
npx tsx scripts/create-mock-shipment.ts
```

Check email at the customer email address!

## 🔍 **Verify It's Working**

### **Check Email Logs**
```sql
SELECT 
  recipient,
  subject,
  status,
  error_message,
  created_at
FROM notification_logs
WHERE type = 'email'
ORDER BY created_at DESC
LIMIT 10;
```

### **Check Function Logs**
```bash
supabase functions logs send-notification --follow
```

## 📝 **Important Notes**

1. **Customer Email Required**: Shipments must have `customer_details.email` set
2. **Tenant Config Required**: Each tenant needs email configuration
3. **ZeptoMail Setup**: Sender email must be verified in ZeptoMail dashboard
4. **Status Triggers**: Emails sent on status changes (delivered, out_for_delivery, exception, etc.)

## 🐛 **Troubleshooting**

**No emails?**
1. Check tenant has email config: `SELECT * FROM tenant_notification_configs WHERE channel = 'email'`
2. Check shipment has customer email: `SELECT customer_details FROM shipments LIMIT 5`
3. Check logs: `SELECT * FROM notification_logs WHERE status = 'failed'`
4. Check function logs: `supabase functions logs send-notification`

**ZeptoMail errors?**
- Verify API key is correct
- Verify sender email in ZeptoMail dashboard
- Check ZeptoMail rate limits

## ✨ **Email Features**

- Beautiful gradient header
- Personalized greeting
- Status update message
- Tracking details (tracking number, reference code, status)
- "Track Your Shipment" button
- Company branding
- Professional footer

---

**Ready to go!** Just deploy, configure, and test! 🚀📧
