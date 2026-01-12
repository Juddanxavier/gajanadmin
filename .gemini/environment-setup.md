<!-- @format -->

# 🔧 Environment Setup Complete!

## ✅ **What I Created**

### **1. Environment Files**

#### `.env.development` - Development Settings

```bash
NODE_ENV=development
NEXT_PUBLIC_ENABLE_MOCK_DATA=true
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_DISABLE_ANIMATIONS=false
```

#### `.env.production` - Production Settings

```bash
NODE_ENV=production
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_DISABLE_ANIMATIONS=true
```

### **2. Configuration Module**

Created: `lib/config/env.ts`

**Usage**:

```typescript
import env from '@/lib/config/env';

// Check environment
if (env.isProduction) {
  // Production code
}

// Use feature flags
if (env.features.enableMockData) {
  return generateMockData();
}

// Access config
const supabaseUrl = env.supabase.url;
```

---

## 🚀 **How to Use**

### **Development Mode** (Default)

```bash
# Run development server
npm run dev

# Uses .env.development automatically
# - Mock data enabled
# - Debug mode on
# - Animations enabled
# - Profiling enabled
```

### **Production Mode**

#### **Option 1: Build and Test Locally**

```bash
# Build for production
npm run build

# Start production server
npm run start

# Uses .env.production automatically
# - Mock data disabled
# - Debug mode off
# - Animations disabled for performance
# - Profiling disabled
```

#### **Option 2: Custom Scripts** (Add to package.json)

Update your `package.json` scripts section:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:prod": "NODE_ENV=production next build",
    "start": "next start",
    "start:prod": "NODE_ENV=production next start",
    "lint": "eslint .",
    "email": "email dev"
  }
}
```

Then run:

```bash
npm run build:prod
npm run start:prod
```

---

## 📝 **Setup Instructions**

### **Step 1: Copy Environment Files**

```bash
# For development
cp .env.development .env.local

# For production (when deploying)
cp .env.production .env.production.local
```

### **Step 2: Fill in Your Values**

Edit `.env.local` with your development credentials:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-key

# Email (use Mailtrap for dev)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASSWORD=your-mailtrap-password
```

### **Step 3: Update Production Values**

Edit `.env.production` with your production credentials:

```bash
# Supabase Production
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key

# Production Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

---

## 🎯 **Feature Flags**

### **Available Flags**

| Flag                   | Development | Production | Purpose                   |
| ---------------------- | ----------- | ---------- | ------------------------- |
| `ENABLE_MOCK_DATA`     | ✅ true     | ❌ false   | Use mock data for testing |
| `DEBUG_MODE`           | ✅ true     | ❌ false   | Show debug logs           |
| `DISABLE_ANIMATIONS`   | ❌ false    | ✅ true    | Disable for performance   |
| `ENABLE_PROFILING`     | ✅ true     | ❌ false   | React profiling           |
| `ENABLE_ANALYTICS`     | ❌ false    | ✅ true    | Google Analytics          |
| `ENABLE_RATE_LIMITING` | ❌ false    | ✅ true    | API rate limiting         |

### **How to Use in Code**

```typescript
import env from '@/lib/config/env';

// Example 1: Conditional rendering
{env.features.debugMode && (
  <div>Debug Info: {JSON.stringify(data)}</div>
)}

// Example 2: Data fetching
const loadData = async () => {
  if (env.features.enableMockData) {
    return generateMockData();
  }
  return fetchRealData();
};

// Example 3: Chart animations
<Area
  animationDuration={env.features.disableAnimations ? 0 : 800}
  isAnimationActive={!env.features.disableAnimations}
/>

// Example 4: Logging
if (env.features.debugMode) {
  console.log('API Response:', response);
}
```

---

## 🔄 **Switching Environments**

### **Method 1: Using npm scripts**

```bash
# Development
npm run dev

# Production (local test)
npm run build
npm run start
```

### **Method 2: Using environment variables**

```bash
# Windows PowerShell
$env:NODE_ENV="production"; npm run build

# Windows CMD
set NODE_ENV=production && npm run build

# Linux/Mac
NODE_ENV=production npm run build
```

### **Method 3: Using .env files**

Next.js automatically loads:

- `.env.local` - Always loaded (gitignored)
- `.env.development` - Loaded in development
- `.env.production` - Loaded in production
- `.env` - Loaded in all environments

**Priority**: `.env.local` > `.env.development` > `.env`

---

## 📊 **Environment Differences**

### **Development**

```
✅ Hot reload
✅ Source maps
✅ Detailed errors
✅ Mock data
✅ Debug logs
✅ Animations
✅ Profiling
❌ Minification
❌ Optimization
```

### **Production**

```
✅ Minified code
✅ Optimized bundles
✅ Tree shaking
✅ Code splitting
✅ Rate limiting
✅ Analytics
❌ Source maps
❌ Debug logs
❌ Mock data
❌ Animations (for performance)
```

---

## 🛠️ **Configuration Examples**

### **Example 1: API Client**

```typescript
// lib/api/client.ts
import env from '@/lib/config/env';

const API_BASE_URL = env.isProduction
  ? 'https://api.yourdomain.com'
  : 'http://localhost:3000/api';

export const apiClient = {
  baseURL: API_BASE_URL,
  timeout: env.isProduction ? 10000 : 30000,
  headers: {
    'X-Environment': env.isProduction ? 'production' : 'development',
  },
};
```

### **Example 2: Error Handling**

```typescript
// lib/utils/error-handler.ts
import env from '@/lib/config/env';

export function handleError(error: Error) {
  // Always log to console in development
  if (env.isDevelopment) {
    console.error('Error:', error);
  }

  // Send to Sentry in production
  if (env.isProduction && env.monitoring.sentryDsn) {
    // Sentry.captureException(error);
  }

  // Show user-friendly message
  return env.isProduction
    ? 'An error occurred. Please try again.'
    : error.message;
}
```

### **Example 3: Performance Monitoring**

```typescript
// components/analytics/page.tsx
import env from '@/lib/config/env';

export default function AnalyticsPage() {
  useEffect(() => {
    if (env.features.enableProfiling) {
      console.time('Page Load');
      return () => console.timeEnd('Page Load');
    }
  }, []);

  // ... rest of component
}
```

---

## 🔐 **Security Best Practices**

### **DO**:

- ✅ Use different Supabase projects for dev/prod
- ✅ Use different API keys for dev/prod
- ✅ Keep `.env.local` in `.gitignore`
- ✅ Use environment variables for secrets
- ✅ Enable rate limiting in production
- ✅ Disable debug mode in production

### **DON'T**:

- ❌ Commit `.env.local` or `.env.production.local`
- ❌ Use production keys in development
- ❌ Hardcode secrets in code
- ❌ Enable mock data in production
- ❌ Expose service role keys to client

---

## 📋 **Checklist**

### **Before Development**:

- [ ] Copy `.env.development` to `.env.local`
- [ ] Fill in development Supabase credentials
- [ ] Set up Mailtrap for email testing
- [ ] Run `npm run dev`
- [ ] Verify mock data is enabled

### **Before Production**:

- [ ] Update `.env.production` with production values
- [ ] Test build locally: `npm run build && npm run start`
- [ ] Verify mock data is disabled
- [ ] Verify animations are disabled
- [ ] Check all features work
- [ ] Test on production Supabase
- [ ] Deploy!

---

## 🚀 **Quick Commands**

```bash
# Development
npm run dev                    # Start dev server
npm run lint                   # Check for errors

# Production Testing
npm run build                  # Build for production
npm run start                  # Start production server
npm run test:build             # Build and start

# Deployment
vercel --prod                  # Deploy to Vercel
docker build -t app .          # Build Docker image
pm2 start npm -- start         # Start with PM2
```

---

## 🆘 **Troubleshooting**

### **Environment variables not loading**

```bash
# Check if file exists
ls -la .env.local

# Restart dev server
# Ctrl+C then npm run dev
```

### **Wrong environment detected**

```bash
# Check NODE_ENV
echo $env:NODE_ENV  # Windows PowerShell
echo $NODE_ENV      # Linux/Mac

# Force production
$env:NODE_ENV="production"; npm run build
```

### **Mock data showing in production**

```bash
# Check .env.production
cat .env.production | grep MOCK_DATA

# Should be:
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
```

---

## ✅ **You're All Set!**

Your environment configuration is now complete. You can:

1. **Run in development**: `npm run dev`
2. **Test production locally**: `npm run build && npm run start`
3. **Deploy to production**: Use Vercel, Docker, or PM2

**The app will automatically use the correct environment settings!** 🎉
