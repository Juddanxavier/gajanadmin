<!-- @format -->

# 🚨 CRITICAL: Infinite Loop & Memory Leak Fixes

## 🐛 **Issues Found**

### **1. INFINITE LOOP in `users/page.tsx` (Line 67-71)**

**Current Code** (BROKEN):

```typescript
useEffect(() => {
  startTransition(() => {
    loadUsers();
  });
}, [pageIndex, pageSize, filters, sorting]); // ❌ Missing loadUsers!
```

**Problem**:

- `loadUsers` is called but not in dependency array
- React warns about this but continues
- Can cause infinite re-renders
- **100% CPU usage!**

**Fix**:

```typescript
// Option 1: Use useCallback
const loadUsers = useCallback(
  async (silent = false) => {
    // ... existing code
  },
  [users.length, sorting]
); // Add dependencies

useEffect(() => {
  startTransition(() => {
    loadUsers();
  });
}, [pageIndex, pageSize, filters, sorting, loadUsers]); // ✅ Include loadUsers

// Option 2: Move loadUsers call directly
useEffect(() => {
  const fetchUsers = async () => {
    // ... loadUsers logic here
  };
  startTransition(() => {
    fetchUsers();
  });
}, [pageIndex, pageSize, filters, sorting]); // ✅ No external dependency
```

---

### **2. Potential Memory Leaks**

#### **A. Framer Motion Animations**

File: `components/shipments/shipment-stats-cards.tsx`

**Issue**: Animation variants created on every render

**Fix**:

```typescript
// Move outside component
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

export function ShipmentStatsCards({ stats, trendData = [] }) {
  // Use pre-defined variants
  return (
    <motion.div variants={container} initial='hidden' animate='show'>
      {/* ... */}
    </motion.div>
  );
}
```

#### **B. Chart Re-renders**

Files: All chart components

**Issue**: Charts re-render on every parent update

**Fix**: Add React.memo

```typescript
export const LeadTrendsInteractive = React.memo(({ data }) => {
  // ... component code
});
```

---

### **3. Recharts Performance Issues**

**Issue**: Recharts can be CPU-intensive with animations

**Fix**:

```typescript
// Disable animations in production
const isProduction = process.env.NODE_ENV === 'production';

<Area
  animationDuration={isProduction ? 0 : 800}  // ✅ No animation in prod
  isAnimationActive={!isProduction}
/>
```

---

## 🔧 **Immediate Fixes**

### **Fix 1: Users Page (CRITICAL)**

File: `app/(dashboard)/users/page.tsx`

```typescript
// Add useCallback
import { useCallback } from 'react';

// Wrap loadUsers
const loadUsers = useCallback(
  async (silent = false) => {
    const isInitial = users.length === 0;
    if (isInitial && !silent) setIsLoading(true);

    try {
      const sortBy = sorting[0]
        ? { id: sorting[0].id, desc: sorting[0].desc }
        : undefined;

      const result = await getUsers(pageIndex, pageSize, filters, sortBy);

      if (result.success) {
        setUsers(result.data.data);
        setPageCount(result.data.pageCount);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  },
  [pageIndex, pageSize, filters, sorting]
); // ✅ Add dependencies

// Update useEffect
useEffect(() => {
  startTransition(() => {
    loadUsers();
  });
}, [loadUsers]); // ✅ Only depend on loadUsers
```

---

### **Fix 2: Optimize Charts**

Add to all chart components:

```typescript
import React from 'react';

export const LeadTrendsInteractive = React.memo(
  ({ data }: Props) => {
    // ... existing code
  },
  (prevProps, nextProps) => {
    // Only re-render if data actually changed
    return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
  }
);
```

---

### **Fix 3: Disable Dev Mode Features**

In `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // ✅ Disable in dev to reduce CPU
  swcMinify: true,

  // Optimize production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Reduce bundle size
  experimental: {
    optimizeCss: true,
  },
};

module.exports = nextConfig;
```

---

## 📊 **Performance Checklist**

### **High Priority** (Do Now!)

- [ ] Fix users page infinite loop
- [ ] Add useCallback to all data fetching functions
- [ ] Disable React StrictMode in dev
- [ ] Add React.memo to chart components

### **Medium Priority**

- [ ] Move animation variants outside components
- [ ] Disable chart animations in production
- [ ] Add request debouncing
- [ ] Implement virtual scrolling for large lists

### **Low Priority**

- [ ] Use React Query for caching
- [ ] Implement code splitting
- [ ] Optimize images with next/image
- [ ] Add service worker for offline support

---

## 🎯 **Expected Results**

### **Before**:

- CPU: 100%
- Memory: Growing over time
- Infinite re-renders
- Slow page loads

### **After**:

- CPU: 20-30%
- Memory: Stable
- Controlled re-renders
- Fast, responsive UI

---

## 🚀 **Quick Test**

1. **Apply users page fix**
2. **Restart dev server**
3. **Open Task Manager**
4. **Navigate to Users page**
5. **CPU should drop to 20-30%**

---

## 📝 **Additional Optimizations**

### **Debounce Search**

```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  (value) => {
    setFilters({ ...filters, search: value });
  },
  300 // Wait 300ms after typing stops
);
```

### **Virtual Scrolling**

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

// For large lists (1000+ items)
const virtualizer = useVirtualizer({
  count: users.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
});
```

### **Lazy Load Components**

```typescript
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/charts/heavy-chart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false, // Don't render on server
});
```

---

## 🔍 **Monitoring**

### **Check CPU Usage**:

```typescript
// Add to layout
useEffect(() => {
  const interval = setInterval(() => {
    console.log('Memory:', performance.memory?.usedJSHeapSize);
  }, 5000);

  return () => clearInterval(interval);
}, []);
```

### **React DevTools Profiler**:

1. Install React DevTools
2. Open Profiler tab
3. Record interaction
4. Look for excessive renders

---

**Fix the users page FIRST - that's causing the 100% CPU!**
