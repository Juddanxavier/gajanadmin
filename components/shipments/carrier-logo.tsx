import { Truck, Plane, Package, Ship, Train } from "lucide-react";

const carrierIcons: Record<string, any> = {
  fedex: Plane,
  ups: Truck,
  dhl: Plane,
  usps: Package,
  ontrac: Truck,
  lasership: Truck,
  amazon: Package,
  "canada-post": Package,
  "royal-mail": Package,
  dpduk: Truck,
  hermes: Truck,
  yodel: Truck,
  dpd: Truck,
  gls: Truck,
  tnt: Plane,
  aramex: Plane,
  "china-post": Package,
  "india-post": Package,
  "australia-post": Package,
  "singapore-post": Package,
  "japan-post": Package,
  ems: Plane,
  sf: Plane,
  "4px": Package,
  yanwen: Package,
  "china-ems": Plane,
  cainiao: Package,
  maersk: Ship,
  msc: Ship,
  "cosco-shipping": Ship,
  "hapag-lloyd": Ship,
  "one-line": Ship,
  evergreen: Ship,
  "yang-ming": Ship,
  zim: Ship,
  "db-schenker": Train,
  "kuehne-nagel": Truck,
};

interface CarrierLogoProps {
  code: string;
  className?: string;
}

export function CarrierLogo({ code, className = "h-5 w-5" }: CarrierLogoProps) {
  const normalizedCode = code.toLowerCase().trim();
  const Icon = carrierIcons[normalizedCode] || Package;
  
  return <Icon className={`${className} text-muted-foreground`} />;
}
