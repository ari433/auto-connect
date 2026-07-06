/**
 * Albanian display labels for domain enums.
 * Keep every customer-facing string here so the interface stays consistently
 * in natural Albanian.
 */
import type {
  BodyType,
  DriveType,
  FuelType,
  Transmission,
  VehicleStatus,
} from '@/types/vehicle';

export const fuelLabels: Record<FuelType, string> = {
  BENZINE: 'Benzinë',
  DIESEL: 'Naftë',
  HYBRID: 'Hibrid',
  PLUG_IN_HYBRID: 'Hibrid me prizë',
  ELECTRIC: 'Elektrik',
  LPG: 'Gaz (LPG)',
};

export const transmissionLabels: Record<Transmission, string> = {
  AUTOMATIC: 'Automatik',
  MANUAL: 'Manual',
  DUAL_CLUTCH: 'Dopio friksion',
  CVT: 'CVT',
};

export const driveLabels: Record<DriveType, string> = {
  FWD: 'Para',
  RWD: 'Prapa',
  AWD: '4x4 (AWD)',
  FOUR_WD: '4x4',
};

export const bodyTypeLabels: Record<BodyType, string> = {
  SEDAN: 'Sedan',
  SUV: 'SUV',
  HATCHBACK: 'Hatchback',
  COUPE: 'Kupe',
  WAGON: 'Karavan',
  VAN: 'Furgon',
  PICKUP: 'Pikap',
  CONVERTIBLE: 'Kabriolet',
};

export const statusLabels: Record<VehicleStatus, string> = {
  AVAILABLE: 'E disponueshme',
  RESERVED: 'E rezervuar',
  IN_TRANSIT: 'Në transport',
  SOLD: 'E shitur',
};

export const leadStatusLabels: Record<string, string> = {
  NEW: 'E re',
  CONTACTED: 'Kontaktuar',
  QUALIFIED: 'Kualifikuar',
  WON: 'Fituar',
  LOST: 'Humbur',
};

export const sortLabels: Record<string, string> = {
  newest: 'Të sapoardhura',
  price_asc: 'Çmimi: nga më i ulëti',
  price_desc: 'Çmimi: nga më i larti',
  mileage_asc: 'Kilometrazha: më e ulët',
  year_desc: 'Viti: më i ri',
};
