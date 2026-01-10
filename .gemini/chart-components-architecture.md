<!-- @format -->

# Chart Components Architecture

## Overview

All area/line trend charts in the application use a centralized `AreaChart`
component to ensure consistency and maintainability.

## Core Component

### `components/charts/area-chart.tsx`

The base reusable area chart component that all trend charts should use.

**Features:**

- Time range filtering (7d, 30d, 90d)
- Multiple data series support
- Gradient fills
- Responsive design
- Empty state handling
- Consistent styling

**Props:**

```typescript
interface AreaChartProps {
  title: string; // Chart title
  description: string; // Chart description
  data: any[]; // Array of data points with date field
  config: ChartConfig; // Chart configuration (colors, labels)
  dataKeys: string[]; // Keys to plot (e.g., ['total', 'delivered'])
  timeRangeEnabled?: boolean; // Show time range selector (default: true)
  height?: string; // Chart height (default: '250px')
}
```

## Specific Chart Components

All specific chart components are thin wrappers around `AreaChart`:

### 1. `components/dashboard/shipment-trends-chart.tsx`

**Usage:** Dashboard and Shipment Analytics pages **Data Keys:**
`['delivered', 'total']` **Height:** `250px`

### 2. `components/users/user-trends-chart.tsx`

**Usage:** User Analytics page **Data Keys:** `['total']` **Height:** `250px`

### 3. `components/leads/lead-trends-chart.tsx`

**Usage:** Lead Analytics page **Data Keys:** `['converted', 'total', 'lost']`
**Height:** `350px`

## How to Create a New Trend Chart

1. Create a new file in the appropriate component folder
2. Import the `AreaChart` component
3. Define your chart config with colors and labels
4. Create a wrapper component that passes props to `AreaChart`

**Example:**

```typescript
/** @format */

'use client';

import { AreaChart } from '@/components/charts/area-chart';
import { type ChartConfig } from '@/components/ui/chart';

interface MyTrendsChartProps {
  data: {
    date: string;
    metric1: number;
    metric2: number;
  }[];
}

const chartConfig = {
  metric1: {
    label: 'Metric 1',
    color: 'var(--chart-1)',
  },
  metric2: {
    label: 'Metric 2',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

export function MyTrendsChart({ data }: MyTrendsChartProps) {
  return (
    <AreaChart
      title='My Analytics'
      description='Description of what this chart shows'
      data={data}
      config={chartConfig}
      dataKeys={['metric1', 'metric2']}
      timeRangeEnabled={true}
      height='250px'
    />
  );
}
```

## Available Chart Colors

Use these CSS variables in your chart config:

- `var(--chart-1)` - Primary color
- `var(--chart-2)` - Secondary color
- `var(--chart-3)` - Tertiary color
- `var(--chart-4)` - Quaternary color
- `var(--chart-5)` - Quinary color
- `var(--destructive)` - Error/warning color

## Making Global Changes

To modify all trend charts at once, edit `components/charts/area-chart.tsx`:

**Common modifications:**

- Grid styling: Line 151-153
- Axis styling: Line 154-167
- Tooltip styling: Line 168-181
- Area styling: Line 182-192
- Line thickness: Line 189 (`strokeWidth`)
- Gradient opacity: Line 137-145

## Other Chart Types

### Pie & Bar Charts

`components/users/user-charts.tsx` uses Recharts directly for Pie and Bar charts
since these don't fit the AreaChart pattern.

### Mini Charts (Sparklines)

`components/dashboard/stat-card.tsx` contains embedded mini area charts for stat
cards.

## Best Practices

1. ✅ **DO** use the centralized `AreaChart` for all trend/time-series charts
2. ✅ **DO** keep wrapper components minimal (config + props only)
3. ✅ **DO** use consistent color variables from the theme
4. ✅ **DO** provide meaningful titles and descriptions
5. ❌ **DON'T** duplicate chart implementation code
6. ❌ **DON'T** hardcode colors - use CSS variables
7. ❌ **DON'T** create custom chart implementations unless absolutely necessary

## Debugging

The `AreaChart` component includes debug logging. Check browser console for:

- Data length (original and filtered)
- Data keys being plotted
- Sample data point

If charts aren't showing:

1. Check console for debug logs
2. Verify data array has `date` field
3. Verify data keys match your data structure
4. Check that data values are numbers, not strings
