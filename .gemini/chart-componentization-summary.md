<!-- @format -->

# Chart Componentization - Complete Summary

## ✅ Completed Refactoring

All **area/line trend charts** now use the centralized `AreaChart` component.

### Centralized Components

#### Base Component

**`components/charts/area-chart.tsx`** (202 lines)

- Reusable area chart with time filtering
- Handles empty states
- Consistent styling across all charts
- Debug logging built-in

#### Wrapper Components (All use AreaChart)

1. **`components/dashboard/shipment-trends-chart.tsx`** (41 lines)
   - Used in: Dashboard, Shipment Analytics
   - Metrics: Total Created, Delivered
   - Height: 250px

2. **`components/users/user-trends-chart.tsx`** (35 lines)
   - Used in: User Analytics
   - Metrics: Total Users
   - Height: 250px

3. **`components/leads/lead-trends-chart.tsx`** (45 lines) ⭐ **NEWLY
   REFACTORED**
   - Used in: Lead Analytics
   - Metrics: Total Leads, Converted, Lost/Failed
   - Height: 350px
   - **Reduced from 228 lines to 45 lines (80% reduction)**

### Other Chart Components (Not Refactored - Different Chart Types)

4. **`components/users/user-charts.tsx`** (98 lines)
   - Pie Chart: Role distribution
   - Bar Chart: Tenant distribution
   - Uses Recharts directly (appropriate for these chart types)

5. **`components/dashboard/stat-card.tsx`** (62 lines)
   - Mini sparkline charts for stat cards
   - Simple line charts embedded in cards
   - Uses Recharts directly (appropriate for mini charts)

## Impact

### Before Refactoring

- LeadTrendsChart: 228 lines of duplicated code
- Inconsistent styling across charts
- Changes required editing multiple files

### After Refactoring

- LeadTrendsChart: 45 lines (wrapper only)
- Consistent styling automatically
- Changes made in ONE place affect all charts

## How to Make Changes

### Change ALL Trend Charts

Edit: `components/charts/area-chart.tsx`

**Examples:**

```typescript
// Line thickness (Line 189)
strokeWidth={1.5}  // Make thinner: 1.0, thicker: 2.0

// Grid opacity (Line 152)
className='stroke-muted/5'  // More visible: /10, /20

// Gradient opacity (Lines 137-145)
stopOpacity={0.8}  // Top
stopOpacity={0.1}  // Bottom
```

### Change ONE Specific Chart

Edit the wrapper component:

**Example - Change LeadTrendsChart height:**

```typescript
// components/leads/lead-trends-chart.tsx
export function LeadTrendsChart({ data }: LeadTrendsChartProps) {
  return (
    <AreaChart
      // ... other props
      height='400px'  // Changed from 350px
    />
  );
}
```

**Example - Change colors:**

```typescript
const chartConfig = {
  total: {
    label: 'Total Leads',
    color: 'var(--chart-3)', // Changed from --chart-1
  },
  // ...
} satisfies ChartConfig;
```

## File Structure

```
components/
├── charts/
│   └── area-chart.tsx          ⭐ BASE - Edit here for global changes
├── dashboard/
│   ├── shipment-trends-chart.tsx  ✅ Uses AreaChart
│   └── stat-card.tsx              📊 Mini charts (different type)
├── users/
│   ├── user-trends-chart.tsx      ✅ Uses AreaChart
│   ├── user-stats.tsx             📊 Uses StatCard
│   └── user-charts.tsx            📊 Pie/Bar charts (different type)
└── leads/
    └── lead-trends-chart.tsx      ✅ Uses AreaChart (NEWLY REFACTORED)
```

## Usage Examples

### In Pages

```typescript
// Dashboard
import { ShipmentTrendsChart } from '@/components/dashboard/shipment-trends-chart';
<ShipmentTrendsChart data={trends} />

// User Analytics
import { UserTrendsChart } from '@/components/users/user-trends-chart';
<UserTrendsChart data={trends.map(t => ({ date: t.date, total: t.totalUsers }))} />

// Lead Analytics
import { LeadTrendsChart } from '@/components/leads/lead-trends-chart';
<LeadTrendsChart data={trends} />
```

## Data Format

All trend charts expect:

```typescript
{
  date: string;        // ISO format: 'YYYY-MM-DD'
  [key: string]: number; // Your metrics
}[]
```

## Benefits

✅ **Consistency** - All charts look and behave the same  
✅ **Maintainability** - Edit once, update everywhere  
✅ **Smaller Codebase** - 80% reduction in chart code  
✅ **Debugging** - Built-in console logging  
✅ **Type Safety** - TypeScript interfaces enforced  
✅ **Reusability** - Easy to add new trend charts

## Next Steps

To add a new trend chart:

1. Create wrapper component (30-50 lines)
2. Define chart config (colors, labels)
3. Pass props to `AreaChart`
4. Done! ✨

**Example:**

```typescript
// components/orders/order-trends-chart.tsx
import { AreaChart } from '@/components/charts/area-chart';
import { type ChartConfig } from '@/components/ui/chart';

const chartConfig = {
  orders: { label: 'Orders', color: 'var(--chart-1)' },
} satisfies ChartConfig;

export function OrderTrendsChart({ data }) {
  return (
    <AreaChart
      title='Order Trends'
      description='Order volume over time'
      data={data}
      config={chartConfig}
      dataKeys={['orders']}
      timeRangeEnabled={true}
      height='250px'
    />
  );
}
```
