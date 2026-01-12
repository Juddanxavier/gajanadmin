<!-- @format -->

# World Map for Shipment Destinations

## 📦 Implementation Plan

### Option 1: Simple SVG World Map (Recommended)

**Library**: `react-simple-maps`

- ✅ Lightweight
- ✅ Easy to customize
- ✅ Works with Next.js
- ✅ Good for showing country highlights

**Installation**:

```bash
pnpm add react-simple-maps
```

### Option 2: Interactive Globe

**Library**: `react-globe.gl`

- ✅ 3D globe
- ✅ Very impressive
- ❌ Heavier bundle size

### Option 3: Leaflet Map

**Library**: `react-leaflet`

- ✅ Full-featured
- ✅ Zoom/pan
- ❌ Requires more setup

## 🎯 Recommended: react-simple-maps

### Features to Implement:

1. **World map** showing all countries
2. **Highlight destination countries** with color
3. **Markers** on destination cities
4. **Tooltips** showing:
   - Country name
   - Number of shipments
   - Total value
5. **Color intensity** based on shipment volume

### Data Structure:

```typescript
interface DestinationData {
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2
  city?: string;
  shipmentCount: number;
  totalValue: number;
  coordinates: [number, number]; // [longitude, latitude]
}
```

### Component Structure:

```
components/
  dashboard/
    world-map.tsx          // Main map component
    destination-marker.tsx // Marker for each destination
    map-tooltip.tsx        // Tooltip on hover
```

## 📊 Dashboard Integration

### Layout:

```
┌─────────────────────────────────────┐
│  Dashboard Stats Cards              │
├─────────────────┬───────────────────┤
│  Recent         │  World Map        │
│  Shipments      │  (Destinations)   │
│  (List)         │                   │
│                 │  🗺️               │
│                 │                   │
└─────────────────┴───────────────────┘
```

### Data Source:

- Query shipments table
- Group by destination country
- Count shipments per country
- Calculate total value per country

## 🚀 Next Steps

1. Install `react-simple-maps`
2. Create WorldMap component
3. Fetch destination data from database
4. Add to dashboard page
5. Style with vibrant colors

Would you like me to implement this?
