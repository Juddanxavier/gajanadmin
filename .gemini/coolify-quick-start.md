<!-- @format -->

# 🚀 Coolify Quick Start - Environment Variables

## 📍 **Step-by-Step Guide**

### **Step 1: Access Coolify Dashboard**

```
1. Open your Coolify URL (e.g., https://coolify.yourdomain.com)
2. Log in with your credentials
3. Navigate to "Projects"
```

---

### **Step 2: Select Your Application**

```
Projects → Gajan Admin → Click on your app
```

---

### **Step 3: Add Environment Variables**

```
Click "Environment Variables" tab
```

**You'll see a text editor. Paste this**:

```bash
# Production Environment Variables
NODE_ENV=production

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME=Gajan Admin

# Email
EMAIL_FROM=noreply@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Feature Flags
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_DISABLE_ANIMATIONS=true
```

---

### **Step 4: Save and Deploy**

```
1. Click "Save" button
2. Click "Redeploy" button
3. Wait for deployment to complete (check logs)
```

---

## 🎯 **Quick Actions**

### **Update a Variable**:

```
1. Go to Environment Variables tab
2. Edit the value
3. Click Save
4. Click Redeploy
```

### **Add a New Variable**:

```
1. Go to Environment Variables tab
2. Add new line: KEY=value
3. Click Save
4. Click Redeploy
```

### **View Deployment Logs**:

```
1. Click "Logs" tab
2. Watch real-time deployment
3. Look for errors or success messages
```

---

## 🔧 **Common Variables to Update**

### **When Switching to Production**:

```bash
# Change these from dev to prod values:
NEXT_PUBLIC_SUPABASE_URL=https://your-PROD-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-PROD-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-PROD-service-key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
NEXT_PUBLIC_DEBUG_MODE=false
```

### **For Testing**:

```bash
# Temporarily enable debug mode:
NEXT_PUBLIC_DEBUG_MODE=true

# Enable mock data for testing:
NEXT_PUBLIC_ENABLE_MOCK_DATA=true

# Remember to disable after testing!
```

---

## ✅ **Verification Checklist**

After deploying, check:

- [ ] Application loads at your domain
- [ ] No console errors in browser
- [ ] Login works
- [ ] Dashboard displays data
- [ ] Charts render correctly
- [ ] No "undefined" errors

---

## 🆘 **Quick Troubleshooting**

### **App won't start**:

```
Check Coolify logs for:
- Missing environment variables
- Build errors
- Port conflicts
```

### **Features not working**:

```
Verify in browser console:
- Supabase URL is correct
- API keys are valid
- Feature flags are set correctly
```

### **Changes not applying**:

```
1. Save environment variables
2. Click "Redeploy" (not just restart)
3. Wait for full deployment
4. Hard refresh browser (Ctrl+Shift+R)
```

---

## 📱 **Mobile Management**

Download Coolify mobile app to manage env vars on the go:

- iOS: App Store
- Android: Play Store

---

## 🎉 **Done!**

Your Coolify environment is configured. The app will automatically use these
settings when deployed.

**Full guide**: `docs/COOLIFY_DEPLOYMENT.md`
