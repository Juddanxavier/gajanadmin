/** @format */

'use client';

import { useTheme } from 'next-themes';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup,
} from 'react-simple-maps';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

interface ShipmentMapProps {
  originCountry?: string;
  destinationCountry?: string;
}

// Simple logic to approximate coordinates for demo/fallback
// In a real app, you'd geocode these countries to lat/lng
interface Coordinates {
  [key: string]: [number, number];
}

const countryCoordinates: Coordinates = {
  US: [-95.7129, 37.0902],
  'United States': [-95.7129, 37.0902],
  CN: [104.1954, 35.8617],
  China: [104.1954, 35.8617],
  IN: [78.9629, 20.5937],
  India: [78.9629, 20.5937],
  GB: [-3.436, 55.3781],
  'United Kingdom': [-3.436, 55.3781],
  DE: [10.4515, 51.1657],
  Germany: [10.4515, 51.1657],
  FR: [2.2137, 46.2276],
  France: [2.2137, 46.2276],
  AU: [133.7751, -25.2744],
  Australia: [133.7751, -25.2744],
  JP: [138.2529, 36.2048],
  Japan: [138.2529, 36.2048],
  AE: [53.8478, 23.4241],
  'United Arab Emirates': [53.8478, 23.4241],
  CA: [-106.3468, 56.1304],
  Canada: [-106.3468, 56.1304],
  // Add more defaults as needed
};

// Fallback utility to try and find coords
function getCoords(countryName?: string): [number, number] | null {
  if (!countryName) return null;
  const key = Object.keys(countryCoordinates).find(
    (k) =>
      k.toLowerCase() === countryName.toLowerCase() ||
      k.toLowerCase() === countryName.split(',').pop()?.trim().toLowerCase(),
  );
  if (key) return countryCoordinates[key];

  // Default to center if unknown? Or just null
  return null;
}

export function ShipmentMap({
  originCountry,
  destinationCountry,
}: ShipmentMapProps) {
  const { theme } = useTheme();

  const from = getCoords(originCountry);
  const to = getCoords(destinationCountry);

  const isDark = theme === 'dark';

  // Premium Map Styling
  const defaultColor = '#e2e8f0'; // slate-200
  const defaultStroke = '#cbd5e1'; // slate-300
  const darkColor = '#1e293b'; // slate-800
  const darkStroke = '#334155'; // slate-700
  const activeColor = '#3b82f6'; // blue-500

  return (
    <div className='w-full h-[400px] bg-slate-100/50 dark:bg-slate-900/50 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 relative'>
      <div className='absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-800/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]' />

      <ComposableMap
        projection='geoMercator'
        projectionConfig={{
          scale: 140,
          center: [0, 25],
        }}
        style={{ width: '100%', height: '100%' }}>
        <ZoomableGroup zoom={1} minZoom={0.7} maxZoom={3}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const isOrigin =
                  originCountry &&
                  (geo.properties.name === originCountry ||
                    geo.id === originCountry);
                const isDest =
                  destinationCountry &&
                  (geo.properties.name === destinationCountry ||
                    geo.id === destinationCountry);
                const isRoute = isOrigin || isDest;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={
                      isRoute
                        ? isDark
                          ? '#3b82f6'
                          : '#60a5fa' // Highlight route countries
                        : isDark
                          ? darkColor
                          : defaultColor
                    }
                    stroke={isDark ? darkStroke : defaultStroke}
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none', transition: 'all 250ms' },
                      hover: {
                        fill: isRoute
                          ? '#2563eb'
                          : isDark
                            ? '#334155'
                            : '#cbd5e1',
                        outline: 'none',
                      },
                      pressed: { outline: 'none' },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* Connection Line */}
          {from && to && (
            <Line
              from={from}
              to={to}
              stroke='#8b5cf6' // Violet
              strokeWidth={3}
              strokeLinecap='round'
              strokeDasharray='4 8' // More spaced dots
              className='animate-[dash_1s_linear_infinite]'
            />
          )}

          {/* Markers with Pulses */}
          {from && (
            <Marker coordinates={from}>
              <circle r={6} fill='#3b82f6' stroke='#fff' strokeWidth={2} />
              <circle
                r={10}
                fill='#3b82f6'
                opacity={0.3}
                className='animate-ping'
              />
            </Marker>
          )}

          {to && (
            <Marker coordinates={to}>
              <circle r={6} fill='#22c55e' stroke='#fff' strokeWidth={2} />
              <circle
                r={10}
                fill='#22c55e'
                opacity={0.3}
                className='animate-ping'
              />
            </Marker>
          )}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
