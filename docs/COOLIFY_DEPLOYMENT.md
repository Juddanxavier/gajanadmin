<!-- @format -->

# 🚀 Coolify Environment Setup Guide

## 📋 **Overview**

Coolify makes it easy to manage environment variables through its web interface.
You can set different variables for development and production deployments.

---

## 🔧 **Setting Environment Variables in Coolify**

### **Method 1: Through Coolify Dashboard** (Recommended)

#### **Step 1: Access Your Application**

1. Log in to your Coolify dashboard
2. Navigate to **Projects**
3. Select your **Gajan Admin** project
4. Click on your application

#### **Step 2: Set Environment Variables**

1. Click on **Environment Variables** tab
2. You'll see a text editor with key-value pairs
3. Add your variables in this format:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME=Gajan Admin
NODE_ENV=production

# Email Configuration
EMAIL_FROM=noreply@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Tracking APIs
TRACK123_API_KEY=your-track123-key
AFTERSHIP_API_KEY=your-aftership-key

# Feature Flags (Production)
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_DISABLE_ANIMATIONS=true
NEXT_PUBLIC_ENABLE_PROFILING=false
NEXT_PUBLIC_ENABLE_RATE_LIMITING=true
NEXT_PUBLIC_MAX_REQUESTS_PER_MINUTE=60

# Optional: Monitoring
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

4. Click **Save**
5. Click **Redeploy** to apply changes

---

### **Method 2: Using .env File in Repository**

#### **Option A: Use .env.production (Recommended)**

1. Update `.env.production` in your repository with production values
2. Commit and push to Git
3. Coolify will automatically use it during build

**Important**: Don't commit secrets! Use Coolify dashboard for sensitive data.

#### **Option B: Create .env in Coolify**

1. In Coolify, go to **Files** tab
2. Create a new file: `.env.production.local`
3. Add your environment variables
4. Save and redeploy

---

## 🔄 **Multiple Environments in Coolify**

### **Setup Development and Production**

#### **1. Create Two Applications in Coolify**

**Development App**:

- Name: `gajan-admin-dev`
- Branch: `develop` or `main`
- Domain: `dev.yourdomain.com`

**Production App**:

- Name: `gajan-admin-prod`
- Branch: `main` or `production`
- Domain: `yourdomain.com`

#### **2. Set Different Environment Variables**

**Development App Variables**:

```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=https://dev.yourdomain.com
NEXT_PUBLIC_ENABLE_MOCK_DATA=true
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_DISABLE_ANIMATIONS=false
# ... other dev settings
```

**Production App Variables**:

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_DISABLE_ANIMATIONS=true
# ... other prod settings
```

---

## 📝 **Complete Environment Variable List for Coolify**

### **Copy this into Coolify's Environment Variables section**:

```bash
# ============================================
# ENVIRONMENT
# ============================================
NODE_ENV=production

# ============================================
# SUPABASE CONFIGURATION
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# APP CONFIGURATION
# ============================================
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME=Gajan Admin

# ============================================
# EMAIL CONFIGURATION
# ============================================
EMAIL_FROM=noreply@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password

# ============================================
# TRACKING APIS
# ============================================
TRACK123_API_KEY=your-track123-api-key
AFTERSHIP_API_KEY=your-aftership-api-key

# ============================================
# FEATURE FLAGS
# ============================================
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_DISABLE_ANIMATIONS=true
NEXT_PUBLIC_ENABLE_PROFILING=false
NEXT_PUBLIC_ENABLE_RATE_LIMITING=true
NEXT_PUBLIC_MAX_REQUESTS_PER_MINUTE=60

# ============================================
# MONITORING (OPTIONAL)
# ============================================
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# ============================================
# SECURITY (OPTIONAL)
# ============================================
NEXTAUTH_SECRET=your-random-secret-key-here
NEXTAUTH_URL=https://yourdomain.com
```

---

## 🔐 **Security Best Practices**

### **DO**:

✅ Use Coolify's environment variables for secrets  
✅ Use different Supabase projects for dev/prod  
✅ Enable rate limiting in production  
✅ Use strong, unique passwords  
✅ Rotate API keys regularly

### **DON'T**:

❌ Commit `.env.production.local` to Git  
❌ Share service role keys  
❌ Use production keys in development  
❌ Expose secrets in client-side code

---

## 🚀 **Deployment Workflow**

### **Initial Setup**:

```bash
# 1. Push code to Git
git add .
git commit -m "Add environment configuration"
git push origin main

# 2. In Coolify:
# - Create new application
# - Connect to your Git repository
# - Set environment variables (see above)
# - Deploy
```

### **Updating Environment Variables**:

```bash
# 1. In Coolify Dashboard:
# - Go to your application
# - Click "Environment Variables"
# - Update the values
# - Click "Save"

# 2. Redeploy:
# - Click "Redeploy" button
# - Or push new code to trigger auto-deploy
```

### **Testing Changes**:

```bash
# 1. Check deployment logs in Coolify
# 2. Visit your application URL
# 3. Check browser console for errors
# 4. Verify features work correctly
```

---

## 📊 **Environment Variable Precedence**

Coolify loads environment variables in this order (highest to lowest priority):

1. **Coolify Dashboard** - Highest priority
2. **`.env.production.local`** - In repository (gitignored)
3. **`.env.production`** - In repository (committed)
4. **`.env`** - In repository (committed)

**Recommendation**: Use Coolify Dashboard for secrets, `.env.production` for
non-sensitive defaults.

---

## 🔍 **Debugging Environment Variables**

### **Check if Variables are Loaded**:

Add this to your `app/layout.tsx` temporarily:

```typescript
// ONLY FOR DEBUGGING - REMOVE AFTER TESTING
console.log('Environment Check:', {
  nodeEnv: process.env.NODE_ENV,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
  mockData: process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA,
});
```

### **View in Coolify**:

1. Go to your application in Coolify
2. Click on **Logs** tab
3. Look for your console.log output
4. Verify variables are correct

### **Common Issues**:

**Variables not loading**:

- ✅ Check spelling (case-sensitive)
- ✅ Restart application after changes
- ✅ Verify `NEXT_PUBLIC_` prefix for client-side vars

**Build fails**:

- ✅ Check for syntax errors in env values
- ✅ Ensure required variables are set
- ✅ Check Coolify build logs

---

## 🎯 **Quick Reference**

### **Required Variables** (Minimum to run):

```bash
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
NODE_ENV=production
```

### **Recommended Variables** (Full functionality):

```bash
# All variables from the complete list above
```

### **Optional Variables** (Enhanced features):

```bash
NEXT_PUBLIC_SENTRY_DSN=...
NEXT_PUBLIC_GA_ID=...
TRACK123_API_KEY=...
AFTERSHIP_API_KEY=...
```

---

## 📱 **Coolify Mobile App**

You can also manage environment variables from the Coolify mobile app:

1. Download Coolify app
2. Log in to your instance
3. Select your application
4. Tap **Environment**
5. Edit variables
6. Save and redeploy

---

## 🔄 **Switching Between Environments**

### **Method 1: Multiple Applications** (Recommended)

Create separate Coolify applications:

- `gajan-admin-dev` → Development
- `gajan-admin-staging` → Staging
- `gajan-admin-prod` → Production

Each with different environment variables.

### **Method 2: Branch-Based**

Use Coolify's branch deployment:

- `develop` branch → Auto-deploy to dev
- `staging` branch → Auto-deploy to staging
- `main` branch → Auto-deploy to production

Set different env vars per deployment.

---

## 📚 **Additional Resources**

- [Coolify Documentation](https://coolify.io/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Environment Setup](https://supabase.com/docs/guides/getting-started/environment-setup)

---

## ✅ **Checklist**

Before deploying to Coolify:

- [ ] Create Coolify application
- [ ] Connect Git repository
- [ ] Set all required environment variables
- [ ] Test build locally first
- [ ] Deploy to Coolify
- [ ] Check deployment logs
- [ ] Verify application works
- [ ] Test all features
- [ ] Monitor for errors

---

## 🆘 **Troubleshooting**

### **Deployment Fails**:

```bash
# Check Coolify build logs
# Look for missing environment variables
# Verify Supabase credentials are correct
```

### **App Runs but Features Don't Work**:

```bash
# Check browser console for errors
# Verify NEXT_PUBLIC_ prefix on client variables
# Ensure feature flags are set correctly
```

### **Environment Variables Not Updating**:

```bash
# 1. Save changes in Coolify
# 2. Click "Redeploy" button
# 3. Wait for deployment to complete
# 4. Hard refresh browser (Ctrl+Shift+R)
```

---

## 🎉 **You're Ready!**

Your Coolify environment is now configured. Just:

1. **Set environment variables in Coolify dashboard**
2. **Deploy your application**
3. **Monitor the deployment logs**
4. **Visit your application URL**

**Coolify will automatically use the correct environment settings!** 🚀
