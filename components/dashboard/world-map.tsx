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

interface DestinationData {
  country: string;
  countryCode: string;
  shipmentCount: number;
  totalValue: number;
  coordinates: [number, number]; // [longitude, latitude]
}

interface WorldMapProps {
  destinations: DestinationData[];
}

// Country coordinates (major countries for logistics)
const COUNTRY_COORDS: Record<string, [number, number]> = {
  US: [-95, 38], // United States
  CA: [-106, 56], // Canada
  MX: [-102, 23], // Mexico
  BR: [-47, -15], // Brazil
  AR: [-64, -34], // Argentina
  GB: [-3, 54], // United Kingdom
  FR: [2, 46], // France
  DE: [10, 51], // Germany
  IT: [12, 42], // Italy
  ES: [-4, 40], // Spain
  RU: [105, 61], // Russia
  CN: [105, 35], // China
  JP: [138, 36], // Japan
  IN: [78, 20], // India
  AU: [133, -27], // Australia
  ZA: [24, -29], // South Africa
  EG: [30, 26], // Egypt
  AE: [54, 24], // UAE
  SA: [45, 24], // Saudi Arabia
  SG: [103, 1], // Singapore
  TH: [100, 15], // Thailand
  MY: [101, 4], // Malaysia
  ID: [113, -2], // Indonesia
  PH: [122, 12], // Philippines
  KR: [127, 37], // South Korea
  VN: [108, 16], // Vietnam
  LK: [80, 7], // Sri Lanka
  NZ: [174, -41], // New Zealand
};

export function WorldMap({ destinations }: WorldMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  // Convert lat/long to SVG coordinates (simplified projection)
  const projectToSVG = (lon: number, lat: number): [number, number] => {
    const x = ((lon + 180) / 360) * 800;
    const y = ((90 - lat) / 180) * 400;
    return [x, y];
  };

  // Get max shipment count for color scaling
  const maxShipments = Math.max(...destinations.map((d) => d.shipmentCount), 1);

  return (
    <Card className='shadow-md border-border/50 bg-gradient-to-br from-background to-muted/20'>
      <CardHeader>
        <CardTitle className='text-xl flex items-center gap-2'>
          <span className='h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse'></span>
          Shipment Destinations
        </CardTitle>
        <CardDescription>Global distribution of shipments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='relative w-full' style={{ paddingBottom: '50%' }}>
          <svg
            viewBox='0 0 800 400'
            className='absolute inset-0 w-full h-full'
            style={{
              background:
                'linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)',
            }}>
            {/* Grid lines */}
            <defs>
              <pattern
                id='grid'
                width='40'
                height='40'
                patternUnits='userSpaceOnUse'>
                <path
                  d='M 40 0 L 0 0 0 40'
                  fill='none'
                  stroke='rgba(255,255,255,0.05)'
                  strokeWidth='1'
                />
              </pattern>
            </defs>
            <rect width='800' height='400' fill='url(#grid)' />

            {/* Equator and Prime Meridian */}
            <line
              x1='0'
              y1='200'
              x2='800'
              y2='200'
              stroke='rgba(255,255,255,0.1)'
              strokeWidth='1'
            />
            <line
              x1='400'
              y1='0'
              x2='400'
              y2='400'
              stroke='rgba(255,255,255,0.1)'
              strokeWidth='1'
            />

            {/* Destination markers */}
            {destinations.map((dest, idx) => {
              const coords = COUNTRY_COORDS[dest.countryCode];
              if (!coords) return null;

              const [x, y] = projectToSVG(coords[0], coords[1]);
              const intensity = dest.shipmentCount / maxShipments;
              const radius = 4 + intensity * 8; // 4-12px based on volume

              return (
                <g key={idx}>
                  {/* Glow effect */}
                  <circle
                    cx={x}
                    cy={y}
                    r={radius + 4}
                    fill={`rgba(59, 130, 246, ${intensity * 0.2})`}
                    className='animate-pulse'
                  />

                  {/* Main marker */}
                  <circle
                    cx={x}
                    cy={y}
                    r={radius}
                    fill='#3b82f6'
                    stroke='#60a5fa'
                    strokeWidth='2'
                    className='cursor-pointer transition-all hover:r-[${radius + 2}]'
                    onMouseEnter={() => setHoveredCountry(dest.countryCode)}
                    onMouseLeave={() => setHoveredCountry(null)}
                  />

                  {/* Tooltip */}
                  {hoveredCountry === dest.countryCode && (
                    <g>
                      <rect
                        x={x + 15}
                        y={y - 35}
                        width='140'
                        height='60'
                        rx='6'
                        fill='#1f2937'
                        stroke='#3b82f6'
                        strokeWidth='2'
                      />
                      <text
                        x={x + 22}
                        y={y - 18}
                        fill='white'
                        fontSize='12'
                        fontWeight='bold'>
                        {dest.country}
                      </text>
                      <text x={x + 22} y={y - 4} fill='#9ca3af' fontSize='10'>
                        Shipments: {dest.shipmentCount}
                      </text>
                      <text x={x + 22} y={y + 10} fill='#9ca3af' fontSize='10'>
                        Value: ${dest.totalValue.toLocaleString()}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className='mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground'>
          <div className='flex items-center gap-2'>
            <div className='w-3 h-3 rounded-full bg-blue-500'></div>
            <span>Active Destinations</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 rounded-full bg-blue-500'></div>
            <span>Low Volume</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 rounded-full bg-blue-500'></div>
            <span>High Volume</span>
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
