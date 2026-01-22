/** @format */

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

interface DestinationData {
  country: string;
  countryCode: string;
  shipmentCount: number;
  totalValue: number;
}

interface WorldMapChoroplethProps {
  destinations: DestinationData[];
}

// GeoJSON URL for world map
const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

export function WorldMapChoropleth({ destinations }: WorldMapChoroplethProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  // Get max shipment count for color intensity
  const maxShipments = Math.max(...destinations.map((d) => d.shipmentCount), 1);

  // Map country codes to ISO 3166-1 numeric codes used by world-atlas
  const countryCodeMap: Record<string, string> = {
    US: '840', // United States
    CA: '124', // Canada
    MX: '484', // Mexico
    BR: '076', // Brazil
    AR: '032', // Argentina
    GB: '826', // United Kingdom
    FR: '250', // France
    DE: '276', // Germany
    IT: '380', // Italy
    ES: '724', // Spain
    RU: '643', // Russia
    CN: '156', // China
    JP: '392', // Japan
    IN: '356', // India
    AU: '036', // Australia
    ZA: '710', // South Africa
    EG: '818', // Egypt
    AE: '784', // UAE
    SA: '682', // Saudi Arabia
    SG: '702', // Singapore
    TH: '764', // Thailand
    MY: '458', // Malaysia
    ID: '360', // Indonesia
    PH: '608', // Philippines
    KR: '410', // South Korea
    VN: '704', // Vietnam
    LK: '144', // Sri Lanka
    NZ: '554', // New Zealand
  };

  // Get color for a country based on shipment count
  const getCountryColor = (geoId: string): string => {
    // Find destination by numeric country code
    const dest = destinations.find(
      (d) => countryCodeMap[d.countryCode] === geoId
    );

    if (!dest) return '#e5e7eb'; // Gray for no data

    const intensity = dest.shipmentCount / maxShipments;

    // Purple gradient (light to dark)
    if (intensity > 0.8) return '#7c3aed'; // Dark purple
    if (intensity > 0.6) return '#8b5cf6'; // Medium-dark purple
    if (intensity > 0.4) return '#a78bfa'; // Medium purple
    if (intensity > 0.2) return '#c4b5fd'; // Light purple
    return '#ddd6fe'; // Very light purple
  };

  // Get country data for tooltip
  const getCountryData = (geoId: string) => {
    return destinations.find((d) => countryCodeMap[d.countryCode] === geoId);
  };

  return (
    <Card className='shadow-md border-border/50 bg-card'>
      <CardHeader>
        <CardTitle className='text-base font-medium'>
          Shipment Destinations
        </CardTitle>
        <CardDescription className='text-xs'>
          Global distribution of active shipments
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Removed bg-gray-50 and dark:bg-gray-900 for transparency */}
        <div className='relative w-full rounded-lg p-4'>
          <ComposableMap
            projectionConfig={{
              scale: 147,
            }}
            style={{
              width: '100%',
              height: 'auto',
            }}>
            {/* Removed ZoomableGroup */}
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const geoId = geo.id;
                  const countryData = getCountryData(geoId);

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getCountryColor(geoId)}
                      stroke='#ffffff'
                      strokeWidth={0.5}
                      style={{
                        default: {
                          outline: 'none',
                        },
                        hover: {
                          fill: countryData ? '#6d28d9' : '#d1d5db',
                          outline: 'none',
                          cursor: 'pointer',
                        },
                        pressed: {
                          outline: 'none',
                        },
                      }}
                      onMouseEnter={() => {
                        if (countryData) {
                          setHoveredCountry(geoId);
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredCountry(null);
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>

          {/* Tooltip */}
          {hoveredCountry && getCountryData(hoveredCountry) && (
            <div className='absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl border-2 border-purple-500 z-10'>
              <div className='text-sm font-bold'>
                {getCountryData(hoveredCountry)?.country}
              </div>
              <div className='text-xs text-purple-200 mt-1'>
                {getCountryData(hoveredCountry)?.shipmentCount} shipments
              </div>
              <div className='text-xs text-purple-200'>
                ${getCountryData(hoveredCountry)?.totalValue.toLocaleString()}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className='mt-6 flex items-center justify-between text-xs text-muted-foreground'>
            <span>Fewer visits</span>
            <div className='flex gap-1'>
              <div className='w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded'></div>
              <div
                className='w-6 h-4 rounded'
                style={{ backgroundColor: '#ddd6fe' }}></div>
              <div
                className='w-6 h-4 rounded'
                style={{ backgroundColor: '#c4b5fd' }}></div>
              <div
                className='w-6 h-4 rounded'
                style={{ backgroundColor: '#a78bfa' }}></div>
              <div
                className='w-6 h-4 rounded'
                style={{ backgroundColor: '#8b5cf6' }}></div>
              <div
                className='w-6 h-4 rounded'
                style={{ backgroundColor: '#7c3aed' }}></div>
            </div>
            <span>More visits</span>
          </div>
        </div>

        {/* Top Destinations List */}
        <div className='mt-6 space-y-2'>
          <h4 className='text-sm font-semibold mb-3'>Top Destinations</h4>
          {destinations
            .sort((a, b) => b.shipmentCount - a.shipmentCount)
            .slice(0, 5)
            .map((dest, idx) => (
              <div
                key={idx}
                className='flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors'>
                <div className='flex items-center gap-3'>
                  <span className='text-lg font-bold text-muted-foreground'>
                    #{idx + 1}
                  </span>
                  <div>
                    <div className='font-medium text-sm'>{dest.country}</div>
                    <div className='text-xs text-muted-foreground'>
                      {dest.shipmentCount} shipments
                    </div>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='font-semibold text-sm'>
                    ${dest.totalValue.toLocaleString()}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    Total Value
                  </div>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
