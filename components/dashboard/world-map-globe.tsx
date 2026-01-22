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
  Graticule,
  Sphere,
} from 'react-simple-maps';

interface DestinationData {
  country: string;
  countryCode: string;
  shipmentCount: number;
  totalValue: number;
}

interface WorldMapGlobeProps {
  destinations: DestinationData[];
}

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

export function WorldMapGlobe({ destinations }: WorldMapGlobeProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

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
        <CardTitle className='text-base font-medium'>Global Reach</CardTitle>
        <CardDescription className='text-xs'>
          3D visualization of shipments
        </CardDescription>
      </CardHeader>
      <CardContent className='flex justify-center'>
        <div className='relative w-full max-w-[400px] h-auto aspect-square'>
          <ComposableMap
            projection='geoOrthographic'
            projectionConfig={{
              rotate: [10, -10, 0], // Initial rotation
              scale: 150,
            }}>
            {/* The Ocean/Sphere background */}
            <Sphere
              stroke='#E4E5E6'
              strokeWidth={0.5}
              id='sphere'
              fill='#f8fafc'
            />

            {/* Grid Lines */}
            <Graticule stroke='#E4E5E6' strokeWidth={0.5} />

            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const geoId = geo.id;
                  const countryData = getCountryData(geoId);
                  const isHighlighted = countryData || hoveredCountry === geoId;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      // Fill: Purple if active, gray if not
                      fill={countryData ? '#8b5cf6' : '#cbd5e1'}
                      stroke='#ffffff'
                      strokeWidth={0.5}
                      style={{
                        default: { outline: 'none' },
                        hover: {
                          fill: '#7c3aed',
                          outline: 'none',
                          cursor: 'pointer',
                        },
                        pressed: { outline: 'none' },
                      }}
                      onMouseEnter={() => {
                        if (countryData) setHoveredCountry(geoId);
                      }}
                      onMouseLeave={() => setHoveredCountry(null)}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>

          {/* Simple Tooltip for the Globe */}
          {hoveredCountry && getCountryData(hoveredCountry) && (
            <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-popover/90 text-popover-foreground px-3 py-2 rounded shadow-sm text-xs border border-border backdrop-blur-sm'>
              <div className='font-bold'>
                {getCountryData(hoveredCountry)?.country}
              </div>
              <div>
                {getCountryData(hoveredCountry)?.shipmentCount} Shipments
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
