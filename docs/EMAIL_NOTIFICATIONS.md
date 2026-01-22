<!-- @format -->

# Email Notifications - Quick Setup

## ✅ **Features**

- Supports **ZeptoMail** and **SMTP**
- QR codes for tracking
- Invoice amounts
- Beautiful HTML emails
- Automatic duplicate prevention

---

## 🚀 **Setup (3 Steps)**

### **1. Configure Database**

Run in Supabase SQL Editor:

```sql
ALTER DATABASE postgres SET app.nextjs_api_url = 'http://localhost:3000';
```

### **2. Apply Migration**

Copy/paste this file into Supabase SQL Editor:
`supabase/migrations/20251230_email_notifications.sql`

### **3. Configure Email in Notification Settings**

Go to **Admin → Notification Settings** and add:

**For ZeptoMail:**

- Channel: Email
- Provider: ZeptoMail
- API Key: Your ZeptoMail API key
- From Email: noreply@yourdomain.com
- From Name: Your Company
- Company Name: Your Company
- Tracking URL: http://localhost:3000
- Active: ✅

**For SMTP:**

- Channel: Email
- Provider: SMTP
- Host: smtp.gmail.com (or your SMTP server)
- Port: 587
- User: your-email@gmail.com
- Pass: your-app-password
- From Email: your-email@gmail.com
- From Name: Your Company
- Company Name: Your Company
- Tracking URL: http://localhost:3000
- Active: ✅ 49a. **Email Templates (New):** 49b. Go to **Settings → Email
  Templates** to customize: 49c. - Subject lines (with variables like
  `{{tracking_number}}`) 49d. - Headings 49e. - Message body 49f. -
  Enable/Disable specific notification types

---

## 🧪 **Test**

```bash
# Start dev server
npm run dev

# Create test shipment
npx tsx scripts/create-mock-shipment.ts

# Check logs
npx tsx scripts/debug-email-notifications.ts
```

---

## 📊 **Verify**

```sql
SELECT recipient, subject, status, created_at
FROM notification_logs
WHERE type = 'email'
ORDER BY created_at DESC;
```

---

**That's it!** Simple and clean. 🎉
