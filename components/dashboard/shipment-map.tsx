/** @format */

'use client';

import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup,
} from 'react-simple-maps';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Using a stable topojson URL
const GEO_URL =
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

interface ShipmentRoute {
  id: string;
  origin: [number, number]; // [lon, lat]
  destination: [number, number];
  status?: string;
}

// Sample coordinates for demo (Full list in real app would be extensive)
const COORDINATES: Record<string, [number, number]> = {
  US: [-95.7129, 37.0902],
  GB: [-3.436, 55.3781],
  IN: [78.9629, 20.5937],
  AU: [133.7751, -25.2744],
  CA: [-106.3468, 56.1304],
  DE: [10.4515, 51.1657],
  FR: [2.2137, 46.2276],
  JP: [138.2529, 36.2048],
  CN: [104.1954, 35.8617],
  BR: [-51.9253, -14.235],
  ZA: [22.9375, -30.5595],
  RU: [105.3188, 61.524],
  NZ: [174.886, -40.9006],
  FJ: [178.065, -17.7134],
  // Add fallback or more as needed
};

const getCoordinates = (code: string): [number, number] => {
  return COORDINATES[code] || [0, 0];
};

interface ShipmentMapProps {
  shipments?: {
    id: string;
    origin_country: string;
    destination_country: string;
    status: string;
  }[];
}

export function ShipmentMap({ shipments = [] }: ShipmentMapProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Transform shipments into routes
  const routes: ShipmentRoute[] = shipments
    .filter(
      (s) =>
        s.origin_country &&
        s.destination_country &&
        COORDINATES[s.origin_country] &&
        COORDINATES[s.destination_country],
    )
    .map((s) => ({
      id: s.id,
      origin: getCoordinates(s.origin_country),
      destination: getCoordinates(s.destination_country),
      status: s.status,
    }));

  return (
    <Card className='col-span-4'>
      <CardHeader>
        <CardTitle>Live Shipments</CardTitle>
      </CardHeader>
      <CardContent className='pl-2'>
        <div className='h-[400px] w-full rounded-md overflow-hidden bg-muted/20 relative'>
          <ComposableMap
            projection='geoMercator'
            projectionConfig={{
              scale: 100, // Reduced scale to fit more
            }}>
            <ZoomableGroup center={[0, 0]} zoom={1}>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={isDark ? '#2D3748' : '#D1D5DB'}
                      stroke={isDark ? '#4A5568' : '#FFF'}
                      strokeWidth={0.5}
                      style={{
                        default: { outline: 'none' },
                        hover: {
                          fill: isDark ? '#4A5568' : '#9CA3AF',
                          outline: 'none',
                        },
                        pressed: { outline: 'none' },
                      }}
                    />
                  ))
                }
              </Geographies>

              {routes.map((route, i) => (
                <Line
                  key={route.id + i}
                  from={route.origin}
                  to={route.destination}
                  stroke='#3b82f6'
                  strokeWidth={2}
                  strokeLinecap='round'
                  className='opacity-60 animate-pulse'
                />
              ))}

              {routes.map((route) => (
                <Marker key={`end-${route.id}`} coordinates={route.destination}>
                  <circle r={3} fill='#ef4444' stroke='#fff' strokeWidth={1} />
                </Marker>
              ))}
              {routes.map((route) => (
                <Marker key={`start-${route.id}`} coordinates={route.origin}>
                  <circle r={3} fill='#10b981' stroke='#fff' strokeWidth={1} />
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>
          <div className='absolute bottom-4 left-4 p-2 bg-background/80 backdrop-blur rounded text-xs'>
            <div className='flex items-center gap-2 mb-1'>
              <span className='w-2 h-2 rounded-full bg-emerald-500'></span>{' '}
              Origin
            </div>
            <div className='flex items-center gap-2'>
              <span className='w-2 h-2 rounded-full bg-red-500'></span>{' '}
              Destination
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
