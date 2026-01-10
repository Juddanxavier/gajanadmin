<!-- @format -->

# Mock Data System Documentation

## Overview

The application includes a comprehensive mock data system that allows you to
toggle between real database data and generated mock data for all analytics
charts. This is useful for:

- **Development**: Test UI with realistic data patterns without needing a
  populated database
- **Demos**: Show the application with impressive-looking data
- **Testing**: Verify chart rendering and interactions with consistent data
- **Design**: Evaluate visual layouts with various data scenarios

## How to Use

### Enabling Mock Data

1. Navigate to **Settings** page
2. Click on the **Developer** tab
3. Toggle **"Use Mock Data for Analytics"** switch to ON
4. Refresh any analytics page to see mock data

### Disabling Mock Data

1. Go to **Settings** → **Developer** tab
2. Toggle the switch to OFF
3. Refresh analytics pages to see real data

## What Gets Mocked

When mock data is enabled, the following pages use generated data:

### 1. **Shipment Analytics** (`/shipments/analytics`)

- **Stats**: Total, delivered, in transit, pending, exceptions, avg delivery
  days
- **Trends**: 90 days of shipment volume with realistic patterns
- **Patterns**: Lower volume on weekends, 70-85% delivery rate

### 2. **User Analytics** (`/analytics/users`)

- **Stats**: Total users, active users, admins, staff, customers, tenants
- **Trends**: Gradual user growth over 90 days
- **Patterns**: 60-80% active rate, 5-10% admin rate

### 3. **Lead Analytics** (`/analytics/leads`)

- **Stats**: Total leads, converted, active, lost
- **Trends**: 90 days of lead activity
- **Patterns**: 20-40% conversion rate, more leads on weekdays

## Technical Implementation

### Mock Data Generator

**File**: `lib/utils/mock-data-generator.ts`

**Functions**:

```typescript
// Shipments
generateMockShipmentTrends(days: number): ShipmentTrendData[]
generateMockShipmentStats(): ShipmentStats

// Users
generateMockUserTrends(days: number): UserTrendData[]
generateMockUserStats(): UserStats

// Leads
generateMockLeadTrends(days: number): LeadTrendData[]
generateMockLeadStats(): LeadStats
```

### Storage

The mock data setting is stored in **localStorage** with key: `use-mock-data`

**Values**:

- `'true'` = Mock data enabled
- `'false'` or `null` = Real data (default)

### Integration Points

Each analytics page checks localStorage on data load:

```typescript
const loadData = async () => {
  const useMockData = localStorage.getItem('use-mock-data') === 'true';

  if (useMockData) {
    // Use generated mock data
    setData(generateMockData());
  } else {
    // Fetch real data from API
    const result = await fetchRealData();
    setData(result.data);
  }
};
```

### Modified Files

**Settings Page**:

- `app/(dashboard)/settings/page.tsx` - Added Developer tab with toggle

**Analytics Pages**:

- `app/(dashboard)/shipments/analytics/page.tsx`
- `app/(dashboard)/analytics/users/page.tsx`
- `app/(dashboard)/analytics/leads/page.tsx`

**Utilities**:

- `lib/utils/mock-data-generator.ts` - Mock data generation logic

## Mock Data Characteristics

### Realistic Patterns

The mock data generator creates realistic patterns:

**Shipments**:

- Weekday volume: 8-23 shipments/day
- Weekend volume: 3-11 shipments/day
- Delivery rate: 70-85%
- Exception rate: 5-10%

**Users**:

- Growth: 1-6 new users/day
- Active rate: 60-80% of total
- Admin rate: 5-10% of total
- Cumulative growth over time

**Leads**:

- Weekday leads: 5-17 leads/day
- Weekend leads: 2-7 leads/day
- Conversion rate: 20-40%
- Lost rate: 10-20%

### Data Volume

- **Default**: 90 days of historical data
- **Configurable**: Can be adjusted in generator functions
- **Consistent**: Same patterns across multiple calls

## Benefits

✅ **No Database Required**: Test charts without populating database  
✅ **Consistent Testing**: Same data patterns for reproducible tests  
✅ **Realistic Patterns**: Includes weekday/weekend variations  
✅ **Easy Toggle**: Switch between real and mock data instantly  
✅ **Persistent**: Setting saved in localStorage  
✅ **Visual Feedback**: Clear indication when mock data is active

## Limitations

⚠️ **Client-Side Only**: Mock data is generated in the browser  
⚠️ **Not Persisted**: Refreshing generates new random values  
⚠️ **Analytics Only**: Only affects analytics charts, not tables or details  
⚠️ **No Historical Accuracy**: Data is randomly generated, not based on real
patterns

## Future Enhancements

Potential improvements:

1. **Seed-based Generation**: Consistent data across refreshes
2. **Customizable Patterns**: Adjust volume, conversion rates, etc.
3. **Export Mock Data**: Save generated data for testing
4. **More Chart Types**: Extend to other visualizations
5. **API Mocking**: Mock entire API responses, not just data

## Troubleshooting

### Mock Data Not Showing

1. **Check Toggle**: Ensure switch is ON in Settings → Developer
2. **Refresh Page**: Analytics pages need to be refreshed after toggling
3. **Clear Cache**: Try clearing browser cache and localStorage
4. **Check Console**: Look for "Using mock data" log messages

### Charts Still Empty

1. **Check Debug Logs**: AreaChart component logs data to console
2. **Verify Data Structure**: Ensure mock data matches expected format
3. **Check Date Format**: Dates should be ISO format (YYYY-MM-DD)

### Toggle Not Persisting

1. **localStorage Access**: Ensure browser allows localStorage
2. **Incognito Mode**: localStorage may not persist in private browsing
3. **Browser Support**: Verify browser supports localStorage API

## Example Usage

### For Development

```typescript
// 1. Enable mock data in settings
localStorage.setItem('use-mock-data', 'true');

// 2. Navigate to analytics page
// Charts will show generated data

// 3. Disable when ready to test with real data
localStorage.setItem('use-mock-data', 'false');
```

### For Demos

1. Enable mock data before demo
2. Show impressive analytics with realistic patterns
3. Disable after demo to return to real data

### For Testing

1. Enable mock data for consistent test data
2. Test chart interactions and filtering
3. Verify responsive design with various data volumes

## Code Examples

### Adding Mock Data to New Analytics Page

```typescript
import { generateMockData } from '@/lib/utils/mock-data-generator';

const loadData = async () => {
  const useMockData = localStorage.getItem('use-mock-data') === 'true';

  if (useMockData) {
    setData(generateMockData());
  } else {
    const result = await fetchData();
    setData(result.data);
  }
};
```

### Creating New Mock Generator

```typescript
// In lib/utils/mock-data-generator.ts

export function generateMockMyData(days: number = 90) {
  const data = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.floor(Math.random() * 100),
    });
  }

  return data;
}
```

## Summary

The mock data system provides a powerful way to develop, test, and demo the
application with realistic data patterns. It's easy to toggle, generates
consistent patterns, and requires no database setup. Perfect for rapid
development and impressive demos!
