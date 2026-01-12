<!-- @format -->

# 🚀 Production Deployment Guide

## 📋 **Pre-Deployment Checklist**

### **1. Environment Variables**

Create `.env.production`:

```bash
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key

# App URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Email (Production SMTP)
EMAIL_FROM=noreply@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Tracking APIs
TRACK123_API_KEY=your-production-key
AFTERSHIP_API_KEY=your-production-key

# Optional: Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

### **2. Build Optimization**

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  reactStrictMode: true,
  swcMinify: true,

  // Remove console logs in production
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  // Optimize images
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },

  // Enable compression
  compress: true,

  // Optimize CSS
  experimental: {
    optimizeCss: true,
  },

  // Output standalone for Docker
  output: 'standalone',
};

module.exports = nextConfig;
```

---

### **3. Package.json Scripts**

Add production scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "build:analyze": "ANALYZE=true next build",
    "prod": "NODE_ENV=production next start -p 3000"
  }
}
```

---

## 🏗️ **Build for Production**

### **Step 1: Clean Build**

```bash
# Remove old builds
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
npm ci

# Build for production
npm run build
```

**Expected output**:

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (XX/XX)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB         120 kB
├ ○ /analytics/leads                     8.1 kB         125 kB
├ ○ /analytics/users                     7.9 kB         124 kB
└ ○ /shipments                          12.3 kB         130 kB

○  (Static)  prerendered as static content
```

---

### **Step 2: Test Production Build Locally**

```bash
# Start production server
npm run start

# Or with custom port
npm run start -- -p 3000
```

**Test checklist**:

- [ ] All pages load correctly
- [ ] Charts render properly
- [ ] Authentication works
- [ ] Database connections work
- [ ] No console errors
- [ ] Performance is good

---

## 🐳 **Docker Deployment (Recommended)**

### **Create Dockerfile**

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### **Create docker-compose.yml**

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/api/health']
      interval: 30s
      timeout: 10s
      retries: 3
```

### **Build and Run**

```bash
# Build Docker image
docker build -t gajan-admin:latest .

# Run container
docker run -p 3000:3000 --env-file .env.production gajan-admin:latest

# Or use docker-compose
docker-compose up -d
```

---

## ☁️ **Deployment Options**

### **Option 1: Vercel (Easiest)**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Environment Variables**:

- Add all `.env.production` variables in Vercel Dashboard
- Settings → Environment Variables

---

### **Option 2: Coolify (Self-Hosted)**

See your existing `COOLIFY_DEPLOYMENT.md`

**Quick steps**:

1. Push code to Git repository
2. Connect repository in Coolify
3. Set environment variables
4. Deploy

---

### **Option 3: VPS (DigitalOcean, AWS, etc.)**

```bash
# SSH into server
ssh user@your-server-ip

# Clone repository
git clone https://github.com/your-repo/gajan-admin.git
cd gajan-admin

# Install dependencies
npm ci

# Build
npm run build

# Install PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start npm --name "gajan-admin" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

**Setup Nginx reverse proxy**:

```nginx
# /etc/nginx/sites-available/gajan-admin
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/gajan-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL with Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

---

### **Option 4: Railway**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

---

## 🔒 **Security Checklist**

### **Before Going Live**:

- [ ] Change all default passwords
- [ ] Use strong Supabase service role key
- [ ] Enable RLS (Row Level Security) on all tables
- [ ] Set up CORS properly
- [ ] Enable HTTPS/SSL
- [ ] Set secure headers in `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin'
        }
      ]
    }
  ];
}
```

- [ ] Set up rate limiting
- [ ] Configure CSP (Content Security Policy)
- [ ] Enable 2FA for admin accounts
- [ ] Set up monitoring and alerts

---

## 📊 **Performance Optimization**

### **1. Enable Caching**

```typescript
// app/api/shipments/route.ts
export const revalidate = 60; // Cache for 60 seconds
```

### **2. Optimize Images**

```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  width={200}
  height={50}
  alt="Logo"
  priority // For above-fold images
/>
```

### **3. Code Splitting**

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('@/components/heavy'), {
  loading: () => <p>Loading...</p>,
  ssr: false
});
```

---

## 🔍 **Monitoring**

### **Setup Error Tracking (Sentry)**

```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### **Setup Analytics**

```typescript
// app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
    </html>
  );
}
```

---

## 🚀 **Deployment Commands**

### **Quick Reference**

```bash
# Local production test
npm run build && npm run start

# Docker
docker build -t gajan-admin . && docker run -p 3000:3000 gajan-admin

# Vercel
vercel --prod

# PM2 (VPS)
pm2 restart gajan-admin
pm2 logs gajan-admin

# Check health
curl http://localhost:3000/api/health
```

---

## 📝 **Post-Deployment**

### **Verify Everything Works**:

1. **Authentication**
   - [ ] Login works
   - [ ] Logout works
   - [ ] Password reset works

2. **Core Features**
   - [ ] Dashboard loads
   - [ ] Charts render
   - [ ] Data fetching works
   - [ ] CRUD operations work

3. **Performance**
   - [ ] Page load < 3 seconds
   - [ ] No memory leaks
   - [ ] CPU usage < 30%

4. **Monitoring**
   - [ ] Error tracking active
   - [ ] Analytics tracking
   - [ ] Uptime monitoring

---

## 🆘 **Troubleshooting**

### **Build Fails**

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### **Environment Variables Not Working**

```bash
# Check if loaded
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);

# Restart server after changing .env
```

### **High CPU in Production**

```bash
# Check if dev mode is running
echo $NODE_ENV  # Should be "production"

# Disable source maps
GENERATE_SOURCEMAP=false npm run build
```

---

## 📚 **Additional Resources**

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Deployment](https://vercel.com/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Nginx Configuration](https://nginx.org/en/docs/)

---

**Choose your deployment method and follow the steps above!** 🚀
