/** @format */

'use client';

import { useState } from 'react';
import { Package, Ship, Train, Truck, Plane } from 'lucide-react';
import {
  FaDhl,
  FaFedex,
  FaUps,
  FaUsps,
  FaTruck,
  FaPlane,
} from 'react-icons/fa';
import { SiDpd, SiAmazon, SiPostman } from 'react-icons/si';
import { IconType } from 'react-icons';

// Map common variations/aliases to a canonical key
const ALIASES: Record<string, string> = {
  'fedex-express': 'fedex',
  'federal-express': 'fedex',
  'dhl-express': 'dhl',
  'united-parcel-service': 'ups',
  'us-postal-service': 'usps',
  royalmail: 'royal-mail',
  'china-post-ems': 'china-post',
  // Add more as needed
};

const carrierDomains: Record<string, string> = {
  fedex: 'fedex.com',
  ups: 'ups.com',
  dhl: 'dhl.com',
  usps: 'usps.com',
  ontrac: 'ontrac.com',
  lasership: 'lasership.com',
  amazon: 'amazon.com',
  'canada-post': 'canadapost-postescanada.ca',
  'royal-mail': 'royalmail.com',
  dpduk: 'dpd.co.uk',
  hermes: 'evri.com', // Rebranded to Evri
  yodel: 'yodel.co.uk',
  dpd: 'dpd.com',
  gls: 'gls-group.com',
  tnt: 'tnt.com',
  aramex: 'aramex.com',
  'china-post': 'chinapost.com.cn',
  'india-post': 'indiapost.gov.in',
  'australia-post': 'auspost.com.au',
  'singapore-post': 'singpost.com',
  'japan-post': 'japanpost.jp',
  ems: 'ems.post',
  sf: 'sf-express.com',
  '4px': '4px.com',
  yanwen: 'yw56.com.cn',
  'china-ems': 'ems.com.cn',
  cainiao: 'cainiao.com',
  maersk: 'maersk.com',
  msc: 'msc.com',
  'cosco-shipping': 'coscoshipping.com',
  'hapag-lloyd': 'hapag-lloyd.com',
  'one-line': 'one-line.com',
  evergreen: 'evergreen-marine.com',
  'yang-ming': 'yangming.com',
  zim: 'zim.com',
  'db-schenker': 'dbschenker.com',
  'kuehne-nagel': 'kuehne-nagel.com',
  blue_dart: 'bluedart.com',
  delhivery: 'delhivery.com',
  dtodc: 'dtx.com',
  ecom_express: 'ecomexpress.in',
  // Add more specific domains
  'dhl-global-mail': 'dhl.com',
  'dhl-eccomerce': 'dhl.com',
  purolator: 'purolator.com',
  loomis: 'loomis-express.com',
  canpar: 'canpar.com',
};

// Map carriers to React Icons (fa/si) where available
const REACT_ICONS: Record<string, IconType> = {
  fedex: FaFedex,
  ups: FaUps,
  dhl: FaDhl,
  usps: FaUsps,
  amazon: SiAmazon,
  dpd: SiDpd,
  'royal-mail': SiPostman, // Fallback/Closest
};

// Generic fallback icons from Lucide
const carrierIcons: Record<string, any> = {
  fedex: FaFedex,
  ups: FaUps,
  dhl: FaDhl,
  usps: FaUsps,
  maersk: Ship,
  // Fallbacks using Lucide for others
  msc: Ship,
  'cosco-shipping': Ship,
  'hapag-lloyd': Ship,
  'one-line': Ship,
  evergreen: Ship,
  'yang-ming': Ship,
  zim: Ship,
  'db-schenker': Train,
  'kuehne-nagel': Truck,
};

interface CarrierLogoProps {
  code: string | null | undefined;
  className?: string;
  width?: number;
  height?: number;
}

export function CarrierLogo({
  code,
  className = 'h-10 w-10',
  width = 40,
  height = 40,
}: CarrierLogoProps) {
  const [imageError, setImageError] = useState(false);

  if (!code)
    return <Package className={`${className} text-muted-foreground`} />;

  // Normalize
  let normalized = code.toLowerCase().trim();

  // Resolve Aliases
  if (ALIASES[normalized]) {
    normalized = ALIASES[normalized];
  }

  // Try replacing spaces/underscores with hyphens
  if (
    !carrierDomains[normalized] &&
    (normalized.includes('_') || normalized.includes(' '))
  ) {
    const hyphenated = normalized.replace(/[_\s]+/g, '-');
    if (carrierDomains[hyphenated] || ALIASES[hyphenated]) {
      normalized = ALIASES[hyphenated] || hyphenated;
    }
  }

  // 1. Check React Icons first
  if (REACT_ICONS[normalized]) {
    const Icon = REACT_ICONS[normalized];
    return <Icon className={className} style={{ width, height }} />;
  }

  const domain = carrierDomains[normalized];

  // 2. Check Domain / Clearbit
  // If we have a domain and no error, try showing the image
  if (domain && !imageError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://logo.clearbit.com/${domain}`}
        alt={code}
        className={`${className} object-contain rounded-sm`}
        style={{ width, height }}
        onError={(e) => {
          // console.warn("Failed to load carrier logo for:", code, domain);
          setImageError(true);
        }}
      />
    );
  }

  // Fallback to Icon
  // Check exact match or partial match (e.g. "dhl" in "dhl-express")
  let Icon = carrierIcons[normalized] || Package;

  // Custom Fallback logic for types
  if (Icon === Package) {
    if (normalized.includes('post') || normalized.includes('mail'))
      Icon = Package; // Post usually package
    else if (normalized.includes('express') || normalized.includes('air'))
      Icon = Plane;
    else if (
      normalized.includes('freight') ||
      normalized.includes('line') ||
      normalized.includes('ship')
    )
      Icon = Ship;
    else if (normalized.includes('logistics')) Icon = Truck;
  }

  return <Icon className={`${className} text-muted-foreground`} />;
}
