<!-- @format -->

# 🗺️ World Map - Shipment Destinations

## ✅ **Already Created!**

I've set up a complete world map system that shows active shipment destinations.

---

## 📁 **Files Created**

### **1. WorldMap Component**

`components/dashboard/world-map.tsx`

**Features**:

- ✅ SVG-based world map (no external dependencies!)
- ✅ Blue markers for each destination
- ✅ Marker size based on shipment volume
- ✅ Pulsing glow effect
- ✅ Interactive tooltips on hover
- ✅ Top 5 destinations list
- ✅ Dark mode compatible

### **2. Destination Data Service**

`app/(dashboard)/shipments/actions/destinations.ts`

**Functions**:

- `getShipmentDestinations()` - All shipments
- `getActiveShipmentDestinations()` - Only in-transit shipments

**Features**:

- ✅ Groups shipments by country
- ✅ Counts shipments per destination
- ✅ Calculates total value
- ✅ Maps country names to ISO codes

### **3. Example Page**

`app/(dashboard)/shipments/map/page.tsx`

**URL**: `/shipments/map`

---

## 🎨 **What It Looks Like**

```
┌─────────────────────────────────────────┐
│ 🗺️ Shipment Destinations               │
│ Global distribution of shipments        │
├─────────────────────────────────────────┤
│                                         │
│   🌍 Dark Blue World Map                │
│                                         │
│   ● India (Large blue dot - 50 ships)   │
│   ● Sri Lanka (Medium dot - 30 ships)   │
│   ● Singapore (Small dot - 10 ships)    │
│                                         │
│   [Hover shows tooltip with details]    │
│                                         │
├─────────────────────────────────────────┤
│ Legend: ● Active  • Low  ● High         │
├─────────────────────────────────────────┤
│ Top Destinations:                       │
│ #1 India        50 shipments  $50,000   │
│ #2 Sri Lanka    30 shipments  $30,000   │
│ #3 Singapore    10 shipments  $15,000   │
└─────────────────────────────────────────┘
```

---

## 🚀 **How to Use**

### **Option 1: Add to Dashboard** (Recommended)

Update `app/(dashboard)/page.tsx`:

```typescript
import { WorldMap } from '@/components/dashboard/world-map';
import { getActiveShipmentDestinations } from '@/app/(dashboard)/shipments/actions/destinations';

export default async function DashboardPage() {
  // Fetch destination data
  const destinationsResult = await getActiveShipmentDestinations();
  const destinations = destinationsResult.success
    ? destinationsResult.data.map(d => ({ ...d, coordinates: [0, 0] as [number, number] }))
    : [];

  return (
    <div className='space-y-6'>
      {/* Other dashboard content */}

      {/* World Map */}
      <WorldMap destinations={destinations} />
    </div>
  );
}
```

### **Option 2: Dedicated Map Page**

Already created at `/shipments/map`

Just add to your navigation menu:

```typescript
// In sidebar or navbar
<Link href="/shipments/map">
  <Globe className="h-4 w-4" />
  Shipment Map
</Link>
```

### **Option 3: Shipment Analytics Page**

Add to `app/(dashboard)/shipments/analytics/page.tsx`:

```typescript
import { WorldMap } from '@/components/dashboard/world-map';
import { getShipmentDestinations } from '@/app/(dashboard)/shipments/actions/destinations';

// In your component
const destinationsResult = await getShipmentDestinations();
const destinations = destinationsResult.data.map(d => ({
  ...d,
  coordinates: [0, 0] as [number, number]
}));

// In JSX
<WorldMap destinations={destinations} />
```

---

## 🌍 **Supported Countries**

Pre-configured with 28 major countries:

### **Americas**

- United States (US)
- Canada (CA)
- Mexico (MX)
- Brazil (BR)
- Argentina (AR)

### **Europe**

- United Kingdom (GB)
- France (FR)
- Germany (DE)
- Italy (IT)
- Spain (ES)
- Russia (RU)

### **Asia**

- China (CN)
- Japan (JP)
- **India (IN)** ⭐
- Singapore (SG)
- Thailand (TH)
- Malaysia (MY)
- Indonesia (ID)
- Philippines (PH)
- South Korea (KR)
- Vietnam (VN)
- **Sri Lanka (LK)** ⭐

### **Middle East**

- UAE (AE)
- Saudi Arabia (SA)
- Egypt (EG)

### **Oceania**

- Australia (AU)
- New Zealand (NZ)

### **Africa**

- South Africa (ZA)

---

## 🔧 **Adding More Countries**

### **Step 1: Add Country Code**

Edit `components/dashboard/world-map.tsx`:

```typescript
const COUNTRY_COORDS: Record<string, [number, number]> = {
  // ... existing countries
  BD: [90, 24], // Bangladesh
  PK: [69, 30], // Pakistan
  NP: [84, 28], // Nepal
  // Add more as needed
};
```

### **Step 2: Add Country Name Mapping**

Edit `app/(dashboard)/shipments/actions/destinations.ts`:

```typescript
function getCountryCode(countryName: string): string | null {
  const countryMap: Record<string, string> = {
    // ... existing mappings
    Bangladesh: 'BD',
    Pakistan: 'PK',
    Nepal: 'NP',
    // Add more as needed
  };
  // ... rest of function
}
```

---

## 📊 **Data Format**

### **Input Data Structure**:

```typescript
interface DestinationData {
  country: string; // "India"
  countryCode: string; // "IN"
  shipmentCount: number; // 50
  totalValue: number; // 50000
  coordinates: [number, number]; // [78, 20] (optional, uses COUNTRY_COORDS)
}
```

### **Example Data**:

```typescript
const destinations = [
  {
    country: 'India',
    countryCode: 'IN',
    shipmentCount: 50,
    totalValue: 50000,
    coordinates: [0, 0], // Not used, WorldMap has built-in coords
  },
  {
    country: 'Sri Lanka',
    countryCode: 'LK',
    shipmentCount: 30,
    totalValue: 30000,
    coordinates: [0, 0],
  },
];
```

---

## 🎯 **Features**

### **Visual Features**:

- ✅ **Dark blue gradient background**
- ✅ **Grid lines** for reference
- ✅ **Equator and Prime Meridian** lines
- ✅ **Pulsing markers** with glow effect
- ✅ **Size-based on volume** (4-12px radius)
- ✅ **Interactive tooltips** on hover
- ✅ **Legend** showing marker sizes
- ✅ **Top 5 destinations** list below map

### **Data Features**:

- ✅ **Auto-groups** by country
- ✅ **Counts shipments** per destination
- ✅ **Calculates total value**
- ✅ **Filters active shipments** (in-transit only)
- ✅ **Handles multiple formats** (City, Country or just Country)

---

## 💡 **Use Cases**

### **1. Dashboard Overview**

Show all active shipment destinations at a glance

### **2. Analytics Page**

Visualize historical shipment distribution

### **3. Real-time Monitoring**

Track current in-transit shipments

### **4. Reports**

Include in executive reports/presentations

---

## 🔄 **Real-time Updates**

### **Auto-refresh every 30 seconds**:

```typescript
useEffect(() => {
  loadDestinations();

  const interval = setInterval(() => {
    loadDestinations();
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, []);
```

### **Manual refresh button**:

```typescript
<Button onClick={loadDestinations} variant="outline">
  <RefreshCw className="h-4 w-4 mr-2" />
  Refresh
</Button>
```

---

## 🎨 **Customization**

### **Change Colors**:

```typescript
// In WorldMap component
fill = '#3b82f6'; // Blue (default)
fill = '#10b981'; // Green
fill = '#f59e0b'; // Amber
fill = '#ef4444'; // Red
```

### **Change Marker Size**:

```typescript
// In WorldMap component
const radius = 4 + intensity * 8; // 4-12px (default)
const radius = 6 + intensity * 10; // 6-16px (larger)
const radius = 2 + intensity * 6; // 2-8px (smaller)
```

### **Show Different Data**:

```typescript
// All shipments (not just active)
const result = await getShipmentDestinations();

// Only active (in-transit)
const result = await getActiveShipmentDestinations();
```

---

## 📝 **Example Integration**

### **Add to Main Dashboard**:

```typescript
// app/(dashboard)/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { WorldMap } from '@/components/dashboard/world-map';
import { getActiveShipmentDestinations } from '@/app/(dashboard)/shipments/actions/destinations';

export default function DashboardPage() {
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    loadDestinations();
  }, []);

  const loadDestinations = async () => {
    const result = await getActiveShipmentDestinations();
    if (result.success) {
      setDestinations(result.data.map(d => ({
        ...d,
        coordinates: [0, 0]
      })));
    }
  };

  return (
    <div className='space-y-6'>
      <h1>Dashboard</h1>

      {/* Other dashboard content */}

      {/* World Map */}
      <WorldMap destinations={destinations} />
    </div>
  );
}
```

---

## ✅ **Ready to Use!**

The world map is fully functional and ready to display your shipment
destinations.

### **Quick Start**:

1. **Visit** `/shipments/map` to see it in action
2. **Or add to dashboard** using the code above
3. **Customize** colors and sizes as needed

### **Next Steps**:

- [ ] Add to your dashboard page
- [ ] Add to navigation menu
- [ ] Test with real shipment data
- [ ] Customize colors/sizes if needed
- [ ] Add more countries if needed

---

**Your shipment destinations are now visualized on a beautiful world map!** 🗺️✨
