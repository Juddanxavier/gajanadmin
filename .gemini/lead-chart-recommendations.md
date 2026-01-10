<!-- @format -->

# Additional Chart Recommendations for Leads Analytics

## 📊 Recommended Charts

Based on your lead data structure, here are professional charts that would
provide valuable insights:

### 1. **Conversion Funnel Chart** ⭐ HIGHLY RECOMMENDED

**Purpose**: Visualize the lead journey from pending → processing →
completed/failed

**Why it's valuable**:

- Shows where leads drop off
- Identifies bottlenecks in the process
- Helps optimize conversion rates

**Data needed**: Count of leads by status

```typescript
{
  pending: 45,
  processing: 23,
  completed: 67,
  failed: 12
}
```

**Chart type**: Funnel or Horizontal Bar Chart

---

### 2. **Top Destinations Map/Chart** ⭐ HIGHLY RECOMMENDED

**Purpose**: Show which destination countries receive the most leads

**Why it's valuable**:

- Identify key markets
- Focus sales efforts on high-demand regions
- Spot emerging markets

**Data needed**: Leads grouped by destination_country

```typescript
[
  { country: 'USA', count: 45, value: 125000 },
  { country: 'UK', count: 32, value: 89000 },
  { country: 'Germany', count: 28, value: 76000 },
];
```

**Chart type**: Horizontal Bar Chart or Pie Chart

---

### 3. **Lead Value Distribution** ⭐ RECOMMENDED

**Purpose**: Show distribution of lead values (pipeline value breakdown)

**Why it's valuable**:

- Identify high-value vs low-value leads
- Focus on most profitable segments
- Understand revenue potential

**Data needed**: Leads grouped by value ranges

```typescript
[
  { range: '$0-$5k', count: 23 },
  { range: '$5k-$10k', count: 45 },
  { range: '$10k-$25k', count: 32 },
  { range: '$25k+', count: 15 },
];
```

**Chart type**: Bar Chart or Donut Chart

---

### 4. **Goods Type Breakdown** ⭐ RECOMMENDED

**Purpose**: Show which types of goods are most commonly shipped

**Why it's valuable**:

- Understand product mix
- Identify specialization opportunities
- Target marketing by goods type

**Data needed**: Leads grouped by goods_type

```typescript
[
  { type: 'Electronics', count: 45, value: 234000 },
  { type: 'Textiles', count: 32, value: 156000 },
  { type: 'Machinery', count: 28, value: 189000 },
];
```

**Chart type**: Pie Chart or Horizontal Bar Chart

---

### 5. **Lead Response Time** 📈 NICE TO HAVE

**Purpose**: Track average time from lead creation to first action

**Why it's valuable**:

- Measure team responsiveness
- Improve customer experience
- Identify process delays

**Data needed**: Time difference between created_at and updated_at

```typescript
[
  { date: '2026-01-01', avgHours: 4.5 },
  { date: '2026-01-02', avgHours: 3.2 },
];
```

**Chart type**: Line Chart

---

### 6. **Origin-Destination Flow** 📈 NICE TO HAVE

**Purpose**: Show popular shipping routes (origin → destination pairs)

**Why it's valuable**:

- Identify key trade routes
- Optimize carrier partnerships
- Understand logistics patterns

**Data needed**: Leads grouped by origin-destination pairs

```typescript
[
  { route: 'China → USA', count: 45 },
  { route: 'India → UK', count: 32 },
  { route: 'Germany → USA', count: 28 },
];
```

**Chart type**: Sankey Diagram or Horizontal Bar Chart

---

### 7. **Conversion Rate by Source** 📈 NICE TO HAVE

**Purpose**: If you track lead sources, show which sources convert best

**Why it's valuable**:

- Optimize marketing spend
- Focus on best-performing channels
- Improve lead quality

**Data needed**: Conversion rate by source (would need source field)

```typescript
[
  { source: 'Website', leads: 100, converted: 35, rate: 35% },
  { source: 'Referral', leads: 50, converted: 25, rate: 50% }
]
```

**Chart type**: Bar Chart with dual axis

---

## 🎯 Top 3 Priority Charts to Add

### 1. **Conversion Funnel** (Status Breakdown)

Shows the complete lead journey - essential for understanding process
efficiency.

### 2. **Top Destinations** (Geographic Analysis)

Helps focus sales and marketing efforts on key markets.

### 3. **Lead Value Distribution** (Revenue Insights)

Critical for understanding revenue potential and prioritizing high-value leads.

---

## 📐 Implementation Complexity

| Chart                   | Complexity | Value     | Priority |
| ----------------------- | ---------- | --------- | -------- |
| Conversion Funnel       | Low        | Very High | ⭐⭐⭐   |
| Top Destinations        | Low        | Very High | ⭐⭐⭐   |
| Lead Value Distribution | Low        | High      | ⭐⭐     |
| Goods Type Breakdown    | Low        | High      | ⭐⭐     |
| Lead Response Time      | Medium     | Medium    | ⭐       |
| Origin-Destination Flow | Medium     | Medium    | ⭐       |
| Conversion by Source    | High\*     | High      | ⭐       |

\*Requires adding source tracking

---

## 🛠️ Easy to Implement with Existing Components

You can use **Recharts** (already in your project) to create:

### Pie Chart (for Destinations, Goods Type)

```tsx
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
```

### Bar Chart (for Value Distribution, Funnel)

```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
```

### Funnel Chart

```tsx
import { FunnelChart, Funnel, LabelList } from 'recharts';
```

---

## 💡 Recommended Layout

```
┌─────────────────────────────────────────────┐
│  Lead Stats Cards (existing)                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Lead Trends Chart (existing - area chart)  │
└─────────────────────────────────────────────┘

┌──────────────────────┬──────────────────────┐
│  Conversion Funnel   │  Top Destinations    │
│  (Status breakdown)  │  (Bar/Pie chart)     │
└──────────────────────┴──────────────────────┘

┌──────────────────────┬──────────────────────┐
│  Value Distribution  │  Goods Type          │
│  (Bar chart)         │  (Pie chart)         │
└──────────────────────┴──────────────────────┘
```

---

## 🚀 Quick Win: Start with These 2

1. **Top Destinations Bar Chart** - Easy to implement, high value
2. **Conversion Funnel** - Shows lead status breakdown visually

Both can be implemented in ~30 minutes using Recharts!

---

## 📝 Next Steps

1. Choose 2-3 charts from the priority list
2. Create reusable chart components (like you did with AreaChart)
3. Add data fetching functions to get aggregated data
4. Update mock data generator to include these metrics
5. Add charts to the leads analytics page

Would you like me to implement any of these charts for you?
