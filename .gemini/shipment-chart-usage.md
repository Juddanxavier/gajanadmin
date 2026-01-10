<!-- @format -->

# Chart Component Usage Map

## ✅ Current Component Architecture

### **ShipmentTrendsChart Component**

**Location:** `components/dashboard/shipment-trends-chart.tsx`

**Implementation:**

```tsx
import { AreaChart } from '@/components/charts/area-chart';

export function ShipmentTrendsChart({ data }) {
  return (
    <AreaChart
      title='Shipment Trends'
      description='Showing shipment volume and delivery performance over time'
      data={data}
      config={chartConfig}
      dataKeys={['delivered', 'total']}
      timeRangeEnabled={true}
      height='250px'
    />
  );
}
```

---

## 📍 Where It's Used

### 1. **Dashboard** (`/dashboard`)

**File:** `app/(dashboard)/dashboard/page.tsx` **Line:** 230

```tsx
import { ShipmentTrendsChart } from '@/components/dashboard/shipment-trends-chart';

// In render:
<ShipmentTrendsChart data={trends} />;
```

**Data Source:** `shipmentService.getShipmentTrends(90)` **Data Format:**

```typescript
{
  date: string;
  total: number;
  delivered: number;
  exception: number;
}
[];
```

---

### 2. **Shipment Analytics** (`/shipments/analytics`)

**File:** `app/(dashboard)/shipments/analytics/page.tsx` **Line:** 99

```tsx
import { ShipmentTrendsChart } from '@/components/dashboard/shipment-trends-chart';

// In render:
<ShipmentTrendsChart data={trendData} />;
```

**Data Source:** `getAnalyticsData()` → `volumeData` (with mock data fallback)
**Data Format:** Same as dashboard

---

## 🎯 Component Hierarchy

```
AreaChart (Base Component)
  ├── ShipmentTrendsChart
  │   ├── Used in: Dashboard
  │   └── Used in: Shipment Analytics
  │
  └── UserTrendsChart
      └── Used in: User Analytics
```

---

## 🔄 Data Flow

### **Dashboard:**

```
ShipmentService.getShipmentTrends(90)
  ↓
Real shipment data from database
  ↓
ShipmentTrendsChart component
  ↓
AreaChart component (renders)
```

### **Shipment Analytics:**

```
getAnalyticsData()
  ↓
volumeData (real data if available)
  ↓
Mock data generation (if < 7 days)
  ↓
ShipmentTrendsChart component
  ↓
AreaChart component (renders)
```

---

## ✅ Benefits of Current Architecture

1. **Single Component**: `ShipmentTrendsChart` is reused in 2 places
2. **Consistent Styling**: Both pages look identical
3. **DRY Principle**: No code duplication
4. **Easy Updates**: Change once, applies everywhere
5. **Maintainable**: Clear component hierarchy

---

## 🎨 Consistent Styling Across All Pages

All charts using `AreaChart` base component have:

- ✅ 5% opacity grid lines
- ✅ 1.5px stroke width
- ✅ Natural curve interpolation
- ✅ Gradient fills (80% → 10%)
- ✅ Time range selector
- ✅ Empty state handling
- ✅ 250px height
- ✅ Responsive design

---

## 📦 How to Use in New Pages

To add the shipment trends chart to any new page:

```tsx
import { ShipmentTrendsChart } from '@/components/dashboard/shipment-trends-chart';

// In your component:
<ShipmentTrendsChart data={yourShipmentData} />;
```

**Data Requirements:**

```typescript
const yourShipmentData = [
  {
    date: '2024-01-01',
    total: 10,
    delivered: 8,
    exception: 1,
  },
  // ... more data points
];
```

---

## 🚀 Summary

✅ **ShipmentTrendsChart is already a reusable component** ✅ **Already used in
Dashboard and Shipment Analytics** ✅ **Built on top of the base AreaChart
component** ✅ **Consistent styling across all pages** ✅ **Easy to add to new
pages**

No changes needed - the architecture is already optimal! 🎉
