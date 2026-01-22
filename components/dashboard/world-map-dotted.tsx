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
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps';

interface DestinationData {
  country: string;
  countryCode: string;
  shipmentCount: number;
  totalValue: number;
  coordinates: [number, number];
}

interface WorldMapDottedProps {
  destinations: DestinationData[];
}

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Manually defining some dots for a "stylized" look (simplified for example)
// In a real dot map, you generated thousands of points.
// Here we will use the standard map but style it with a pattern or markers.

export function WorldMapDotted({ destinations }: WorldMapDottedProps) {
  // Mapping codes (same as before)
  const countryCodeMap: Record<string, string> = {
    US: '840',
    CA: '124',
    MX: '484',
    BR: '076',
    AR: '032',
    GB: '826',
    FR: '250',
    DE: '276',
    IT: '380',
    ES: '724',
    RU: '643',
    CN: '156',
    JP: '392',
    IN: '356',
    AU: '036',
    ZA: '710',
    EG: '818',
    AE: '784',
    SA: '682',
    SG: '702',
    TH: '764',
    MY: '458',
    ID: '360',
    PH: '608',
    KR: '410',
    VN: '704',
    LK: '144',
    NZ: '554',
  };

  const getCountryData = (geoId: string) => {
    return destinations.find((d) => countryCodeMap[d.countryCode] === geoId);
  };

  return (
    <Card className='shadow-md border-border/50 bg-card'>
      <CardHeader>
        <CardTitle className='text-base font-medium'>Network Map</CardTitle>
        <CardDescription className='text-xs'>
          Connected logistics network
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='relative w-full rounded-lg p-4'>
          {/* SVG Pattern Definition for "Dots" */}
          <svg style={{ height: 0 }}>
            <defs>
              <pattern
                id='dots'
                x='0'
                y='0'
                width='4'
                height='4'
                patternUnits='userSpaceOnUse'>
                <circle
                  cx='2'
                  cy='2'
                  r='1'
                  fill='currentColor'
                  className='text-muted-foreground/30'
                />
              </pattern>
            </defs>
          </svg>

          <ComposableMap
            projectionConfig={{ scale: 147 }}
            style={{ width: '100%', height: 'auto' }}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const geoId = geo.id;
                  const countryData = getCountryData(geoId);

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      // Use dotted pattern for empty, solid color for active
                      fill={countryData ? '#8b5cf6' : 'url(#dots)'}
                      stroke='transparent'
                      style={{
                        default: { outline: 'none' },
                        hover: {
                          fill: countryData ? '#7c3aed' : 'url(#dots)',
                          outline: 'none',
                        },
                        pressed: { outline: 'none' },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* Add styled markers for active destinations to make them pop */}
            {destinations.map((dest, i) => (
              <Marker key={i} coordinates={dest.coordinates}>
                <circle r={4} fill='#fff' stroke='#7c3aed' strokeWidth={2} />
              </Marker>
            ))}
          </ComposableMap>
        </div>
      </CardContent>
    </Card>
  );
}
