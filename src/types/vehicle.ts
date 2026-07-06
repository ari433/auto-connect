/**
 * Domain types for the AUTO CONNECT catalogue.
 * These are the shapes the frontend consumes from our own REST API —
 * never a provider payload. The provider layer maps into these.
 */

export type FuelType =
  | 'BENZINE'
  | 'DIESEL'
  | 'HYBRID'
  | 'PLUG_IN_HYBRID'
  | 'ELECTRIC'
  | 'LPG';

export type Transmission = 'AUTOMATIC' | 'MANUAL' | 'DUAL_CLUTCH' | 'CVT';

export type DriveType = 'FWD' | 'RWD' | 'AWD' | 'FOUR_WD';

export type BodyType =
  | 'SEDAN'
  | 'SUV'
  | 'HATCHBACK'
  | 'COUPE'
  | 'WAGON'
  | 'VAN'
  | 'PICKUP'
  | 'CONVERTIBLE';

export type VehicleStatus = 'AVAILABLE' | 'RESERVED' | 'IN_TRANSIT' | 'SOLD';

export interface VehicleImage {
  url: string;
  alt: string;
}

/** Public vehicle shape — safe to send to the browser (no VIN, no cost basis). */
export interface Vehicle {
  id: string;
  slug: string;
  brand: string;
  model: string;
  variant: string | null;
  year: number;
  mileageKm: number;
  fuel: FuelType;
  transmission: Transmission;
  drive: DriveType;
  bodyType: BodyType;
  engineLabel: string;
  engineCc: number | null;
  horsepower: number | null;
  exteriorColor: string;
  interiorColor: string | null;
  doors: number | null;
  seats: number | null;
  /** Final customer-facing price in EUR, from the pricing engine. */
  price: number;
  status: VehicleStatus;
  featured: boolean;
  images: VehicleImage[];
  equipment: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

/** Admin-only extension of a vehicle: includes sensitive commercial data. */
export interface AdminVehicle extends Vehicle {
  vin: string;
  sourceRef: string;
  sourcePriceKrw: number | null;
  landedCostEur: number | null;
  marginEur: number;
}

export interface VehicleListResult {
  items: Vehicle[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FacetBucket {
  value: string;
  label: string;
  count: number;
}

export interface Facets {
  brands: FacetBucket[];
  bodyTypes: FacetBucket[];
  fuels: FacetBucket[];
  transmissions: FacetBucket[];
  priceRange: { min: number; max: number };
  yearRange: { min: number; max: number };
}
