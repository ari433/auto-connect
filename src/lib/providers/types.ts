/**
 * Provider abstraction.
 *
 * AUTO CONNECT sources inventory from an upstream import marketplace. The rest
 * of the application never imports a concrete provider directly — it depends on
 * the `VehicleProvider` interface below. This keeps the provider swappable and
 * ensures the customer-facing app is fully decoupled from the source.
 */
import type {
  BodyType,
  DriveType,
  FuelType,
  Transmission,
} from '@/types/vehicle';

/** Raw vehicle as returned by an upstream provider (pre-pricing, pre-mapping). */
export interface ProviderVehicle {
  /** Stable identifier in the provider's system. */
  ref: string;
  vin: string;
  brand: string;
  model: string;
  variant?: string;
  year: number;
  mileageKm: number;
  fuel: FuelType;
  transmission: Transmission;
  drive: DriveType;
  bodyType: BodyType;
  engineLabel: string;
  engineCc?: number;
  horsepower?: number;
  exteriorColor: string;
  interiorColor?: string;
  doors?: number;
  seats?: number;
  /** Listing price in the source currency (South Korean won). */
  priceKrw: number;
  imageUrls: string[];
  equipment: string[];
  /** Provider-side condition/notes used to build our own description. */
  conditionNotes?: string;
  featured?: boolean;
}

export interface FetchOptions {
  /** Optional cap for incremental syncs / testing. */
  limit?: number;
}

export interface VehicleProvider {
  readonly id: string;
  readonly displayName: string;
  /** Pull the current inventory snapshot from the provider. */
  fetchInventory(options?: FetchOptions): Promise<ProviderVehicle[]>;
}
