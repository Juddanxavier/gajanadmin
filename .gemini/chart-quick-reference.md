<!-- @format -->

# Chart Component Quick Reference

## Component Hierarchy

```
components/charts/area-chart.tsx (BASE COMPONENT)
├── components/dashboard/shipment-trends-chart.tsx
├── components/users/user-trends-chart.tsx
└── components/leads/lead-trends-chart.tsx
```

## Current Chart Implementations

### ✅ Centralized (Using AreaChart)

- **ShipmentTrendsChart** - 41 lines
- **UserTrendsChart** - 35 lines
- **LeadTrendsChart** - 45 lines

### 📊 Custom Implementations (Different Chart Types)

- **UserCharts** - Pie & Bar charts (98 lines)
- **StatCard** - Mini sparklines for dashboard stats

## File Sizes After Refactoring

| Component           | Before             | After    | Reduction       |
| ------------------- | ------------------ | -------- | --------------- |
| LeadTrendsChart     | 228 lines          | 45 lines | **80% smaller** |
| ShipmentTrendsChart | Already refactored | 41 lines | -               |
| UserTrendsChart     | Already refactored | 35 lines | -               |

## How to Modify All Charts at Once

Edit **ONE** file: `components/charts/area-chart.tsx`

### Common Modifications

#### Change Line Thickness

```typescript
// Line 189
strokeWidth={1.5}  // Change this value
```

#### Change Grid Opacity

```typescript
// Line 152
className = 'stroke-muted/5'; // Change /5 to /10, /20, etc.
```

#### Change Gradient Opacity

```typescript
// Lines 137-145
stopOpacity={0.8}  // Top gradient
stopOpacity={0.1}  // Bottom gradient
```

#### Change Default Height

```typescript
// Line 52
height = '250px',  // Change default
```

#### Change Time Range Options

```typescript
// Lines 97-105
<SelectItem value='90d'>Last 3 months</SelectItem>
<SelectItem value='30d'>Last 30 days</SelectItem>
<SelectItem value='7d'>Last 7 days</SelectItem>
```

## Usage in Pages

### Dashboard Page

```typescript
import { ShipmentTrendsChart } from '@/components/dashboard/shipment-trends-chart';

<ShipmentTrendsChart data={trends} />
```

### Shipment Analytics Page

```typescript
import { ShipmentTrendsChart } from '@/components/dashboard/shipment-trends-chart';

<ShipmentTrendsChart data={trendData} />
```

### User Analytics Page

```typescript
import { UserTrendsChart } from '@/components/users/user-trends-chart';

<UserTrendsChart data={trends.map(t => ({ date: t.date, total: t.totalUsers }))} />
```

### Lead Analytics Page

```typescript
import { LeadTrendsChart } from '@/components/leads/lead-trends-chart';

<LeadTrendsChart data={trends} />
```

## Data Format Requirements

All charts expect data in this format:

```typescript
{
  date: string;        // ISO date string (YYYY-MM-DD)
  [key: string]: number; // Your metric values
}[]
```

**Example:**

```typescript
[
  { date: '2026-01-01', total: 10, delivered: 8 },
  { date: '2026-01-02', total: 15, delivered: 12 },
  // ...
];
```

## Troubleshooting

### Chart Not Showing?

1. Check browser console for debug logs
2. Verify data has `date` field
3. Ensure values are numbers, not strings
4. Check that `dataKeys` match your data structure

### Chart Too Small/Large?

Pass custom `height` prop to the specific chart wrapper:

```typescript
<AreaChart
  // ... other props
  height='400px'  // Custom height
/>
```

### Need Different Colors?

Edit the `chartConfig` in the specific chart wrapper:

```typescript
const chartConfig = {
  myMetric: {
    label: 'My Metric',
    color: 'var(--chart-3)', // Change color variable
  },
} satisfies ChartConfig;
```
