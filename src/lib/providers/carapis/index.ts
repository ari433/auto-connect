/**
 * ─────────────────────────────────────────────────────────────────────────
 *  CARAPIS PROVIDER — the single source of all Carapis-specific logic.
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  Carapis is the official, normalized Encar feed (API access — NOT scraping).
 *
 *  Everything that knows the Carapis *base URL*, *path*, *auth*, *field names*
 *  and *response envelope* lives in THIS FILE and nowhere else. If Carapis
 *  versions its path (`/encar` → `/v1/encar`) or renames a field, this is the
 *  only file you touch — and most of it is overridable via env with no code
 *  change at all.
 *
 *  This module is server-only. The API key is read from `process.env` and is
 *  never returned to, nor importable by, the browser.
 * ─────────────────────────────────────────────────────────────────────────
 */
import type { Car, CarQuery } from '@/types/car';
import type {
  BodyType,
  DriveType,
  FuelType,
  Transmission,
} from '@/types/vehicle';
import type {
  FetchOptions,
  ProviderVehicle,
  VehicleProvider,
} from '@/lib/providers/types';
import { inventorySnapshot } from './fallback-dataset';

if (typeof window !== 'undefined') {
  throw new Error('The Carapis provider must never be imported on the client.');
}

/* ── Configuration (all env-overridable) ─────────────────────────────────── */

const CONFIG = {
  baseUrl: (process.env.CARAPIS_BASE_URL ?? 'https://api.carapis.com').replace(/\/$/, ''),
  /** List path. Versioning (`/encar` vs `/v1/encar`) is a one-env-var change. */
  vehiclesPath: process.env.CARAPIS_VEHICLES_PATH ?? '/encar/vehicles',
  apiKey: process.env.CARAPIS_API_KEY ?? '',
  /** KRW → EUR conversion rate, shared with the pricing engine. */
  fxKrwToEur: Number(
    process.env.CARAPIS_KRW_EUR_RATE ?? process.env.PRICING_FX_KRW_EUR ?? 0.00069,
  ),
  /** Upper bound pulled during a full sync (Free Tier ≈ latest 1000). */
  maxVehicles: Number(process.env.CARAPIS_MAX_VEHICLES ?? 1000),
  pageSize: Number(process.env.CARAPIS_PAGE_SIZE ?? 100),
  timeoutMs: Number(process.env.CARAPIS_TIMEOUT_MS ?? 15000),
  /**
   * When the API is unreachable AND no key is configured (local/offline dev),
   * fall back to the bundled snapshot so the platform is never empty. Disable
   * with CARAPIS_ALLOW_FALLBACK=false to force hard failures in production.
   */
  allowOfflineFallback: process.env.CARAPIS_ALLOW_FALLBACK !== 'false',
} as const;

/* ── Typed errors ────────────────────────────────────────────────────────── */

export type CarapisErrorCode =
  | 'INVALID_API_KEY'
  | 'RATE_LIMIT_EXCEEDED'
  | 'VEHICLE_NOT_FOUND'
  | 'UPSTREAM_ERROR'
  | 'NETWORK_ERROR';

export class CarapisError extends Error {
  readonly code: CarapisErrorCode;
  readonly status: number;
  readonly retryAfter?: number;

  constructor(code: CarapisErrorCode, message: string, status: number, retryAfter?: number) {
    super(message);
    this.name = 'CarapisError';
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
  }

  /** HTTP status to surface to our own API clients. */
  get httpStatus(): number {
    switch (this.code) {
      case 'INVALID_API_KEY':
        return 401;
      case 'RATE_LIMIT_EXCEEDED':
        return 429;
      case 'VEHICLE_NOT_FOUND':
        return 404;
      default:
        return 502;
    }
  }
}

export interface RateLimit {
  limit?: number;
  remaining?: number;
  reset?: number;
}

/* ── Raw upstream shapes (defensive: fields are read tolerantly) ──────────── */

type RawVehicle = Record<string, unknown>;

interface RawEnvelope {
  success?: boolean;
  data?: { vehicles?: RawVehicle[]; total?: number; limit?: number; offset?: number };
  vehicles?: RawVehicle[];
  error?: { code?: string; message?: string } | string;
}

/* ── HTTP layer ──────────────────────────────────────────────────────────── */

function buildListUrl(query: CarQuery): string {
  const url = new URL(CONFIG.vehiclesPath, `${CONFIG.baseUrl}/`);
  const p = url.searchParams;
  p.set('limit', String(query.limit ?? CONFIG.pageSize));
  if (query.offset) p.set('offset', String(query.offset));
  if (query.brand) p.set('brand', query.brand);
  if (query.model) p.set('model', query.model);
  if (query.yearMin != null) p.set('year_min', String(query.yearMin));
  if (query.yearMax != null) p.set('year_max', String(query.yearMax));
  if (query.priceMin != null) p.set('price_min', String(query.priceMin));
  if (query.priceMax != null) p.set('price_max', String(query.priceMax));
  return url.toString();
}

function readRateLimit(res: Response): RateLimit {
  const n = (h: string) => {
    const v = res.headers.get(h);
    return v != null ? Number(v) : undefined;
  };
  return {
    limit: n('X-RateLimit-Limit'),
    remaining: n('X-RateLimit-Remaining'),
    reset: n('X-RateLimit-Reset'),
  };
}

function classifyStatus(status: number, code?: string): CarapisErrorCode {
  const upper = code?.toUpperCase();
  if (upper === 'INVALID_API_KEY' || status === 401 || status === 403) return 'INVALID_API_KEY';
  if (upper === 'RATE_LIMIT_EXCEEDED' || status === 429) return 'RATE_LIMIT_EXCEEDED';
  if (upper === 'VEHICLE_NOT_FOUND' || status === 404) return 'VEHICLE_NOT_FOUND';
  return 'UPSTREAM_ERROR';
}

interface RawResult {
  vehicles: RawVehicle[];
  total: number;
  rateLimit: RateLimit;
}

/** Core fetch. Adds Bearer auth only when a key exists (Free Tier needs none). */
async function fetchRaw(query: CarQuery): Promise<RawResult> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (CONFIG.apiKey) headers.Authorization = `Bearer ${CONFIG.apiKey}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.timeoutMs);

  let res: Response;
  try {
    res = await fetch(buildListUrl(query), {
      headers,
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (err) {
    // Never logs the key; only the failure reason.
    throw new CarapisError(
      'NETWORK_ERROR',
      `Carapis është i paarritshëm: ${(err as Error).message}`,
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  const rateLimit = readRateLimit(res);

  if (!res.ok) {
    let code: string | undefined;
    let message = res.statusText;
    try {
      const body = (await res.json()) as RawEnvelope;
      const e = body.error;
      if (typeof e === 'string') message = e;
      else if (e) {
        code = e.code;
        message = e.message ?? message;
      }
    } catch {
      /* non-JSON error body */
    }
    const kind = classifyStatus(res.status, code);
    const retryAfter = Number(res.headers.get('Retry-After')) || rateLimit.reset;
    throw new CarapisError(kind, `Carapis ${res.status}: ${message}`, res.status, retryAfter);
  }

  const body = (await res.json()) as RawEnvelope;
  const vehicles = body.data?.vehicles ?? body.vehicles ?? [];
  const total = body.data?.total ?? vehicles.length;
  return { vehicles, total, rateLimit };
}

/* ── Field access helpers (tolerant of naming variants) ──────────────────── */

const pick = (raw: RawVehicle, ...keys: string[]): unknown => {
  for (const k of keys) {
    const v = raw[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
};

const str = (v: unknown, fallback = ''): string => (v == null ? fallback : String(v));
const int = (v: unknown, fallback = 0): number => {
  const n = typeof v === 'number' ? v : parseInt(String(v).replace(/[^\d.-]/g, ''), 10);
  return Number.isFinite(n) ? n : fallback;
};

function toIso(v: unknown): string {
  if (v == null) return new Date(0).toISOString();
  const d = new Date(typeof v === 'number' ? v : String(v));
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
}

function extractImages(raw: RawVehicle): string[] {
  const src = pick(raw, 'images', 'photos', 'image_urls', 'imageUrls');
  const out: string[] = [];
  const push = (item: unknown) => {
    if (!item) return;
    if (typeof item === 'string') out.push(item);
    else if (typeof item === 'object') {
      const url = (item as Record<string, unknown>).url ?? (item as Record<string, unknown>).src;
      if (typeof url === 'string') out.push(url);
    }
  };
  if (Array.isArray(src)) src.forEach(push);
  else if (typeof src === 'string') src.split(',').map((s) => s.trim()).forEach(push);
  return out.filter(Boolean);
}

function eur(priceKrw: number): number {
  return Math.round(priceKrw * CONFIG.fxKrwToEur);
}

/** Convert a KRW amount to EUR using the configured rate. */
export function convertKrwToEur(priceKrw: number): number {
  return eur(priceKrw);
}

/* ── Glossaries: upstream value → Albanian label ─────────────────────────── */

function normKey(v: unknown): string {
  return str(v).trim().toLowerCase();
}

function albanianFuel(v: unknown): string {
  const k = normKey(v);
  if (/gasolin|petrol|benzin|가솔린/.test(k)) return 'Benzinë';
  if (/diesel|naft|dizel|디젤/.test(k)) return 'Naftë (Dizel)';
  if (/plug|플러그/.test(k)) return 'Hibrid me prizë';
  if (/hybrid|하이브리드/.test(k)) return 'Hibrid';
  if (/electric|\bev\b|전기/.test(k)) return 'Elektrik';
  if (/lpg|gas|가스/.test(k)) return 'Gaz (LPG)';
  return v ? titleCase(str(v)) : 'Tjetër';
}

function albanianTransmission(v: unknown): string {
  const k = normKey(v);
  if (/cvt/.test(k)) return 'CVT (Automatik)';
  if (/dct|dual|dsg|dopio/.test(k)) return 'Automatik (Dopio friksion)';
  if (/auto|자동/.test(k)) return 'Automatik';
  if (/manual|수동/.test(k)) return 'Manual';
  return v ? titleCase(str(v)) : 'Automatik';
}

const COLOR_GLOSSARY: [RegExp, string][] = [
  [/pearl|white|흰|화이트/, 'E bardhë'],
  [/black|검|블랙/, 'E zezë'],
  [/silver|은색|실버/, 'Argjend'],
  [/gray|grey|회색|그레이/, 'Gri'],
  [/navy|남색/, 'Blu e errët'],
  [/blue|파랑|블루|파란/, 'Blu'],
  [/red|빨강|레드|빨간/, 'E kuqe'],
  [/green|초록|그린/, 'Jeshile'],
  [/brown|갈색|브라운/, 'Kafe'],
  [/beige|베이지/, 'Bezhë'],
  [/gold|금색|골드/, 'Ari'],
  [/orange|주황|오렌지/, 'Portokalli'],
  [/yellow|노랑|옐로/, 'E verdhë'],
  [/purple|보라/, 'Vjollcë'],
];

function albanianColor(v: unknown): string {
  const k = normKey(v);
  for (const [re, label] of COLOR_GLOSSARY) if (re.test(k)) return label;
  return v ? titleCase(str(v)) : 'E papërcaktuar';
}

function titleCase(s: string): string {
  return s.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
}

/* ── Enum glossaries (for the DB / sync path) ────────────────────────────── */

function enumFuel(v: unknown): FuelType {
  const k = normKey(v);
  if (/diesel|naft|dizel|디젤/.test(k)) return 'DIESEL';
  if (/plug|플러그/.test(k)) return 'PLUG_IN_HYBRID';
  if (/hybrid|하이브리드/.test(k)) return 'HYBRID';
  if (/electric|\bev\b|전기/.test(k)) return 'ELECTRIC';
  if (/lpg|gas|가스/.test(k)) return 'LPG';
  return 'BENZINE';
}

function enumTransmission(v: unknown): Transmission {
  const k = normKey(v);
  if (/cvt/.test(k)) return 'CVT';
  if (/dct|dual|dsg/.test(k)) return 'DUAL_CLUTCH';
  if (/manual|수동/.test(k)) return 'MANUAL';
  return 'AUTOMATIC';
}

function enumDrive(v: unknown): DriveType {
  const k = normKey(v);
  if (/awd|4wd|all|4x4|사륜/.test(k)) return 'AWD';
  if (/rwd|rear|후륜/.test(k)) return 'RWD';
  if (/4wd/.test(k)) return 'FOUR_WD';
  return 'FWD';
}

function enumBody(v: unknown): BodyType {
  const k = normKey(v);
  if (/suv|rv/.test(k)) return 'SUV';
  if (/hatch/.test(k)) return 'HATCHBACK';
  if (/coupe|쿠페/.test(k)) return 'COUPE';
  if (/wagon|estate/.test(k)) return 'WAGON';
  if (/van|mpv|미니밴/.test(k)) return 'VAN';
  if (/pickup|truck/.test(k)) return 'PICKUP';
  if (/convert|cabrio/.test(k)) return 'CONVERTIBLE';
  return 'SEDAN';
}

/* ── Mappers ─────────────────────────────────────────────────────────────── */

/** Raw Carapis vehicle → the Albanian `Car` contract served to the frontend. */
export function mapToCar(raw: RawVehicle): Car {
  const priceKRW = int(pick(raw, 'price', 'price_krw', 'priceKrw'));
  const encarUrl = str(pick(raw, 'url', 'detail_url', 'source_url', 'encar_url', 'encarUrl')) || undefined;
  return {
    id: str(pick(raw, 'id', 'vehicle_id', 'vin')),
    brand: str(pick(raw, 'brand', 'manufacturer', 'make')),
    model: str(pick(raw, 'model', 'model_name')),
    year: int(pick(raw, 'year', 'model_year')),
    priceKRW,
    priceEUR: eur(priceKRW),
    mileageKm: int(pick(raw, 'mileage', 'mileage_km', 'odometer', 'km')),
    fuel: albanianFuel(pick(raw, 'fuel_type', 'fuel', 'fuelType')),
    transmission: albanianTransmission(pick(raw, 'transmission', 'gearbox')),
    color: albanianColor(pick(raw, 'color', 'exterior_color', 'colour')),
    images: extractImages(raw),
    addedAt: toIso(pick(raw, 'created_at', 'createdAt', 'listed_at', 'registered_at')),
    encarUrl,
  };
}

/** Raw Carapis vehicle → the richer `ProviderVehicle` used by the sync engine. */
export function mapToProviderVehicle(raw: RawVehicle): ProviderVehicle {
  const id = str(pick(raw, 'id', 'vehicle_id', 'vin'));
  const priceKrw = int(pick(raw, 'price', 'price_krw', 'priceKrw'));
  const engineCc = int(pick(raw, 'displacement', 'engine_cc', 'engine_volume'), 0) || undefined;
  const horsepower = int(pick(raw, 'horsepower', 'power', 'hp'), 0) || undefined;
  const options = pick(raw, 'options', 'equipment', 'features');

  return {
    ref: id,
    vin: str(pick(raw, 'vin')) || `CARAPIS-${id}`,
    brand: str(pick(raw, 'brand', 'manufacturer', 'make')),
    model: str(pick(raw, 'model', 'model_name')),
    variant: str(pick(raw, 'trim', 'grade', 'badge', 'variant')) || undefined,
    year: int(pick(raw, 'year', 'model_year')),
    mileageKm: int(pick(raw, 'mileage', 'mileage_km', 'odometer', 'km')),
    fuel: enumFuel(pick(raw, 'fuel_type', 'fuel')),
    transmission: enumTransmission(pick(raw, 'transmission', 'gearbox')),
    drive: enumDrive(pick(raw, 'drive', 'drivetrain', 'driveline')),
    bodyType: enumBody(pick(raw, 'body_type', 'body', 'car_type')),
    engineLabel:
      str(pick(raw, 'engine', 'engine_name')) ||
      (engineCc ? `${(engineCc / 1000).toFixed(1)}L` : albanianFuel(pick(raw, 'fuel_type', 'fuel'))),
    engineCc,
    horsepower,
    exteriorColor: albanianColor(pick(raw, 'color', 'exterior_color')),
    interiorColor: pick(raw, 'interior_color') ? albanianColor(pick(raw, 'interior_color')) : undefined,
    doors: int(pick(raw, 'doors'), 0) || undefined,
    seats: int(pick(raw, 'seats', 'passengers'), 0) || undefined,
    priceKrw,
    imageUrls: extractImages(raw),
    equipment: Array.isArray(options) ? options.map((o) => str(o)).filter(Boolean) : [],
    conditionNotes: str(pick(raw, 'description', 'condition')) || undefined,
    featured: false,
  };
}

/* ── Offline fallback (dev only, no key) ─────────────────────────────────── */

function shouldFallback(err: unknown): boolean {
  // Fallback is a DEV/offline convenience only: it never triggers once a key is
  // configured, so production always surfaces real upstream errors. Without a
  // key, any refusal to serve (blocked host, 401/403, upstream 5xx) drops to the
  // bundled snapshot so local development is never blocked. Genuine rate limits
  // still propagate so the 429 handling stays observable.
  if (!CONFIG.allowOfflineFallback || CONFIG.apiKey) return false;
  if (!(err instanceof CarapisError)) return false;
  return err.code !== 'RATE_LIMIT_EXCEEDED';
}

/* ── Public API ──────────────────────────────────────────────────────────── */

export interface FetchCarsResult {
  cars: Car[];
  total: number;
  rateLimit: RateLimit;
  /** True when the bundled snapshot was served (API unreachable, no key). */
  fromFallback: boolean;
}

/** Fetch a single page of inventory, mapped to the `Car` contract. */
export async function fetchCars(query: CarQuery = {}): Promise<FetchCarsResult> {
  try {
    const { vehicles, total, rateLimit } = await fetchRaw(query);
    return { cars: vehicles.map(mapToCar), total, rateLimit, fromFallback: false };
  } catch (err) {
    if (shouldFallback(err)) {
      console.warn('[carapis] API unreachable and no key set — serving bundled snapshot.');
      const cars = inventorySnapshot.map(providerVehicleToCar);
      return { cars, total: cars.length, rateLimit: {}, fromFallback: true };
    }
    throw err;
  }
}

/** Provider adapter for the sync engine — paginates the full filtered set. */
export const carapisProvider: VehicleProvider = {
  id: 'carapis',
  displayName: 'Carapis (Encar)',
  async fetchInventory(options?: FetchOptions): Promise<ProviderVehicle[]> {
    const cap = Math.min(options?.limit ?? CONFIG.maxVehicles, CONFIG.maxVehicles);
    const collected: ProviderVehicle[] = [];

    try {
      let offset = 0;
      // Bounded pagination — never loops beyond the configured cap.
      while (collected.length < cap) {
        const limit = Math.min(CONFIG.pageSize, cap - collected.length);
        const { vehicles, total } = await fetchRaw({ limit, offset });
        if (!vehicles.length) break;
        collected.push(...vehicles.map(mapToProviderVehicle));
        offset += vehicles.length;
        if (offset >= total) break;
      }
      return collected;
    } catch (err) {
      if (shouldFallback(err)) {
        console.warn('[carapis] Sync fallback → bundled snapshot.');
        return inventorySnapshot.slice(0, cap);
      }
      throw err;
    }
  },
};

/** Map a bundled ProviderVehicle → Car (used only by the offline fallback). */
function providerVehicleToCar(v: ProviderVehicle): Car {
  return {
    id: v.ref,
    brand: v.brand,
    model: v.model,
    year: v.year,
    priceKRW: v.priceKrw,
    priceEUR: eur(v.priceKrw),
    mileageKm: v.mileageKm,
    fuel: albanianFuel(v.fuel),
    transmission: albanianTransmission(v.transmission),
    color: albanianColor(v.exteriorColor),
    images: v.imageUrls,
    addedAt: new Date(0).toISOString(),
  };
}

/** Effective config snapshot for diagnostics (never exposes the key). */
export function carapisStatus() {
  return {
    baseUrl: CONFIG.baseUrl,
    vehiclesPath: CONFIG.vehiclesPath,
    hasApiKey: Boolean(CONFIG.apiKey),
    tier: CONFIG.apiKey ? 'paid' : 'free',
    fxKrwToEur: CONFIG.fxKrwToEur,
    maxVehicles: CONFIG.maxVehicles,
  };
}
