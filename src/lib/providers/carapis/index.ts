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
import { computePriceFromEur, getPricingConfig } from '@/lib/pricing/engine';

if (typeof window !== 'undefined') {
  throw new Error('The Carapis provider must never be imported on the client.');
}

/* ── Configuration (all env-overridable) ─────────────────────────────────── */

const CONFIG = {
  baseUrl: (process.env.CARAPIS_BASE_URL ?? 'https://api.carapis.com').replace(/\/$/, ''),
  /**
   * List path. The live catalog endpoint is `/apix/catalog_api/vehicles/`
   * (page-based). Versioning is a one-env-var change — set CARAPIS_VEHICLES_PATH.
   */
  vehiclesPath: process.env.CARAPIS_VEHICLES_PATH ?? '/apix/catalog_api/vehicles/',
  apiKey: process.env.CARAPIS_API_KEY ?? '',
  /**
   * Restrict to a single upstream source, e.g. "encar" for South-Korea-only
   * inventory. Empty = all sources. The live catalog aggregates many markets;
   * set CARAPIS_SOURCE_CODE=encar to show only Korean (Encar) vehicles.
   */
  sourceCode: (process.env.CARAPIS_SOURCE_CODE ?? 'encar').trim(),
  /**
   * Only currently-available listings. Defaults to true — it is both the right
   * subset for a storefront and a much faster query than the full history.
   * Set CARAPIS_AVAILABLE_ONLY=false to include sold vehicles too.
   */
  availableOnly: process.env.CARAPIS_AVAILABLE_ONLY !== 'false',
  /** KRW → EUR conversion rate, shared with the pricing engine. */
  fxKrwToEur: Number(
    process.env.CARAPIS_KRW_EUR_RATE ?? process.env.PRICING_FX_KRW_EUR ?? 0.00069,
  ),
  /** USD → EUR conversion rate (the live catalog prices in USD). */
  fxUsdToEur: Number(process.env.PRICING_FX_USD_EUR ?? 0.92),
  /** Flat demo markup added to the customer-facing EUR price. */
  demoMarkupEur: Number(process.env.PRICING_DEMO_MARKUP_EUR ?? 0),
  /** Upper bound pulled during a full sync (Free Tier ≈ latest 1000). */
  maxVehicles: Number(process.env.CARAPIS_MAX_VEHICLES ?? 600),
  pageSize: Number(process.env.CARAPIS_PAGE_SIZE ?? 40),
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
  // Live catalog_api paginated shape.
  count?: number;
  page?: number;
  pages?: number;
  has_next?: boolean;
  next?: string | null;
  results?: RawVehicle[];
  // Tolerated alternatives.
  success?: boolean;
  data?: { vehicles?: RawVehicle[]; results?: RawVehicle[]; total?: number };
  vehicles?: RawVehicle[];
  error?: { code?: string; message?: string; detail?: string } | string;
}

/* ── HTTP layer ──────────────────────────────────────────────────────────── */

function buildListUrl(
  filters: CarQuery,
  page: number,
  pageSize: number,
  sourceCode: string = CONFIG.sourceCode,
): string {
  const url = new URL(CONFIG.vehiclesPath, `${CONFIG.baseUrl}/`);
  const p = url.searchParams;
  // Live catalog_api pagination (the API is strict — only valid params allowed).
  p.set('page', String(page));
  p.set('page_size', String(pageSize));
  p.set('available_only', String(CONFIG.availableOnly));
  // Restrict to one source (e.g. Encar / South Korea) when configured.
  // NB: the query parameter is `source` (the response *field* is source_code).
  if (sourceCode) p.set('source', sourceCode);
  // Upstream filters, using the API's exact parameter names.
  if (filters.brand) p.set('brand', filters.brand);
  if (filters.model) p.set('model', filters.model);
  if (filters.yearMin != null) p.set('min_year', String(filters.yearMin));
  if (filters.yearMax != null) p.set('max_year', String(filters.yearMax));
  if (filters.priceMin != null) p.set('min_price', String(filters.priceMin));
  if (filters.priceMax != null) p.set('max_price', String(filters.priceMax));
  return url.toString();
}

/** Extract the vehicle array + total + whether more pages exist, tolerantly. */
function parseEnvelope(body: RawEnvelope): {
  vehicles: RawVehicle[];
  total: number;
  hasNext: boolean;
} {
  const vehicles =
    body.results ??
    body.data?.results ??
    body.data?.vehicles ??
    body.vehicles ??
    (Array.isArray(body) ? (body as RawVehicle[]) : []);
  const total = body.count ?? body.data?.total ?? vehicles.length;
  const hasNext =
    body.has_next ??
    Boolean(body.next) ??
    (body.page != null && body.pages != null ? body.page < body.pages : false);
  return { vehicles, total, hasNext };
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
  hasNext: boolean;
  rateLimit: RateLimit;
}

// While rate-limited, we stop hitting the API until this timestamp — the caller
// serves cached data instead. This prevents a 429 storm from the free-tier cap.
let rateLimitedUntil = 0;

/** Core fetch. Adds Bearer auth only when a key exists (Free Tier needs none). */
async function fetchRaw(
  filters: CarQuery,
  page: number,
  pageSize: number,
  sourceCode: string = CONFIG.sourceCode,
): Promise<RawResult> {
  if (Date.now() < rateLimitedUntil) {
    throw new CarapisError(
      'RATE_LIMIT_EXCEEDED',
      'Në pritje pas kufirit të kërkesave',
      429,
    );
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (CONFIG.apiKey) headers.Authorization = `Bearer ${CONFIG.apiKey}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.timeoutMs);

  let res: Response;
  try {
    res = await fetch(buildListUrl(filters, page, pageSize, sourceCode), {
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
        message = e.message ?? e.detail ?? message;
      }
    } catch {
      /* non-JSON error body */
    }
    const kind = classifyStatus(res.status, code);
    const retryAfter = Number(res.headers.get('Retry-After')) || rateLimit.reset;
    if (kind === 'RATE_LIMIT_EXCEEDED') {
      // Honour the server's actual reset time — it can be many hours on a
      // strict plan. Retrying sooner than that only wastes quota and may
      // extend a sliding window. Cap at 24h purely as a sanity bound.
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      const waitMs = Math.min(Math.max((retryAfter || 60) * 1000, 60_000), ONE_DAY_MS);
      rateLimitedUntil = Date.now() + waitMs;
      console.warn(
        `[carapis] Rate limited — pausing all requests for ${Math.round(waitMs / 60000)} min (until ${new Date(rateLimitedUntil).toLocaleString()}).`,
      );
    }
    throw new CarapisError(kind, `Carapis ${res.status}: ${message}`, res.status, retryAfter);
  }

  const body = (await res.json()) as RawEnvelope;
  const { vehicles, total, hasNext } = parseEnvelope(body);
  return { vehicles, total, hasNext, rateLimit };
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

/** Resolve a possibly-relative media path against the Carapis host. */
function resolveUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('/')) return `${CONFIG.baseUrl}${raw}`;
  return raw;
}

/**
 * Pull a single URL out of a photo entry (string or object).
 * Prefer the real source photo (`original_url`, e.g. ci.encar.com) — that is the
 * genuine Encar image — then fall back to the provider-hosted copy.
 */
function photoUrl(item: unknown): string | null {
  if (typeof item === 'string') return resolveUrl(item);
  if (item && typeof item === 'object') {
    const o = item as Record<string, unknown>;
    return (
      resolveUrl(o.original_url) ??
      resolveUrl(o.url) ??
      resolveUrl(o.thumb_url) ??
      resolveUrl(o.src) ??
      resolveUrl(o.full) ??
      resolveUrl(o.large)
    );
  }
  return null;
}

function extractImages(raw: RawVehicle): string[] {
  const out: string[] = [];
  // Prefer the main thumbnail first (Carapis-hosted, reliable), then photos.
  const main = photoUrl(pick(raw, 'thumb', 'main_image'));
  if (main) out.push(main);

  const src = pick(raw, 'photos', 'images', 'image_urls', 'pictures', 'gallery');
  if (Array.isArray(src)) {
    for (const item of src) {
      const url = photoUrl(item);
      if (url) out.push(url);
    }
  } else if (typeof src === 'string') {
    for (const s of src.split(',')) {
      const url = resolveUrl(s.trim());
      if (url) out.push(url);
    }
  }

  // De-duplicate while preserving order.
  return [...new Set(out)];
}

function eur(priceKrw: number): number {
  // Demo markup is added to the customer-facing EUR figure.
  return Math.round(priceKrw * CONFIG.fxKrwToEur) + CONFIG.demoMarkupEur;
}

/**
 * Convert a USD listing price into the REAL customer price: source price →
 * EUR, then through the same landed-cost pricing engine used for KRW listings
 * (freight, customs duty, VAT, compliance, margin, rounding). This reflects
 * actual import economics — not a flat markup — so cheap and expensive cars
 * alike get a realistic, proportionate price.
 */
function usdToEur(priceUsd: number): number {
  const sourcePriceEur = priceUsd * CONFIG.fxUsdToEur;
  return computePriceFromEur(sourcePriceEur, getPricingConfig()).price;
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
  if (!k || k === 'unknown' || k === 'other' || k === 'n/a') return 'E papërcaktuar';
  for (const [re, label] of COLOR_GLOSSARY) if (re.test(k)) return label;
  return titleCase(str(v));
}

function titleCase(s: string): string {
  return s.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
}

// Proper casing for brands the title-caser would otherwise mangle.
const BRAND_FIX: Record<string, string> = {
  bmw: 'BMW', kia: 'Kia', mg: 'MG', ds: 'DS', gmc: 'GMC', byd: 'BYD',
  'mercedes-benz': 'Mercedes-Benz', benz: 'Mercedes-Benz', vw: 'Volkswagen',
  'land rover': 'Land Rover', 'ssangyong': 'SsangYong', kg: 'KG Mobility',
};

function normalizeBrand(v: unknown): string {
  const raw = str(v).trim();
  if (!raw) return '';
  return BRAND_FIX[raw.toLowerCase()] ?? titleCase(raw);
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

// Field readers matched to the live catalog_api shape (with tolerant aliases).
const readBrand = (raw: RawVehicle) => normalizeBrand(pick(raw, 'brand_name', 'brand', 'manufacturer', 'make'));
const readModel = (raw: RawVehicle) => str(pick(raw, 'model_name', 'model'));
const readYear = (raw: RawVehicle) => int(pick(raw, 'year', 'model_year'));
const readMileage = (raw: RawVehicle) => int(pick(raw, 'mileage', 'mileage_km', 'odometer', 'km'));
const readPriceUsd = (raw: RawVehicle) => int(pick(raw, 'price_usd', 'price', 'price_krw'));
const readFuel = (raw: RawVehicle) => pick(raw, 'fuel_type', 'fuel');
const readTransmission = (raw: RawVehicle) => pick(raw, 'transmission', 'gearbox');
const readBody = (raw: RawVehicle) => pick(raw, 'body_type', 'body', 'car_type');
const readColor = (raw: RawVehicle) => pick(raw, 'color', 'exterior_color', 'colour');
const readAddedAt = (raw: RawVehicle) =>
  pick(raw, 'first_seen_at', 'created_at', 'listed_at', 'last_seen_at');

/** Raw Carapis vehicle → the Albanian `Car` contract served to the frontend. */
export function mapToCar(raw: RawVehicle): Car {
  const priceUsd = readPriceUsd(raw);
  return {
    id: str(pick(raw, 'id', 'vehicle_id', 'vin')),
    brand: readBrand(raw),
    model: readModel(raw),
    year: readYear(raw),
    // priceKRW keeps the source figure (USD) for reference/sorting.
    priceKRW: priceUsd,
    priceEUR: usdToEur(priceUsd),
    mileageKm: readMileage(raw),
    fuel: albanianFuel(readFuel(raw)),
    transmission: albanianTransmission(readTransmission(raw)),
    color: albanianColor(readColor(raw)),
    images: extractImages(raw),
    addedAt: toIso(readAddedAt(raw)),
    encarUrl: str(pick(raw, 'source_url', 'url', 'detail_url')) || undefined,
  };
}

/** Raw Carapis vehicle → the richer `ProviderVehicle` used everywhere else. */
export function mapToProviderVehicle(raw: RawVehicle): ProviderVehicle {
  const id = str(pick(raw, 'id', 'vehicle_id', 'vin'));
  const priceUsd = readPriceUsd(raw);
  const engineCc = int(pick(raw, 'displacement', 'engine_cc', 'engine_volume'), 0) || undefined;
  const horsepower = int(pick(raw, 'horsepower', 'power', 'hp'), 0) || undefined;
  const options = pick(raw, 'options', 'equipment', 'features');
  const variant = str(pick(raw, 'trim', 'grade', 'badge', 'variant')) || undefined;

  return {
    ref: id,
    vin: str(pick(raw, 'vin')) || `CARAPIS-${id}`,
    brand: readBrand(raw),
    model: readModel(raw),
    variant,
    year: readYear(raw),
    mileageKm: readMileage(raw),
    fuel: enumFuel(readFuel(raw)),
    transmission: enumTransmission(readTransmission(raw)),
    drive: enumDrive(pick(raw, 'drive_type', 'drive', 'drivetrain', 'driveline')),
    bodyType: enumBody(readBody(raw)),
    engineLabel:
      str(pick(raw, 'engine', 'engine_name')) ||
      variant ||
      (engineCc ? `${(engineCc / 1000).toFixed(1)}L` : albanianFuel(readFuel(raw))),
    engineCc,
    horsepower,
    exteriorColor: albanianColor(readColor(raw)),
    interiorColor: pick(raw, 'interior_color') ? albanianColor(pick(raw, 'interior_color')) : undefined,
    doors: int(pick(raw, 'doors'), 0) || undefined,
    seats: int(pick(raw, 'seat_count', 'seats', 'passengers'), 0) || undefined,
    generation: str(pick(raw, 'generation')) || undefined,
    ownerCount: int(pick(raw, 'owner_count'), 0) || undefined,
    hasAccident: typeof pick(raw, 'has_accident') === 'boolean' ? (pick(raw, 'has_accident') as boolean) : undefined,
    inspectionPassed:
      typeof pick(raw, 'inspection_passed') === 'boolean' ? (pick(raw, 'inspection_passed') as boolean) : undefined,
    priceKrw: 0,
    // Source prices are USD → convert directly; the pricing engine is bypassed.
    priceEur: usdToEur(priceUsd),
    imageUrls: extractImages(raw),
    equipment: Array.isArray(options) ? options.map((o) => str(o)).filter(Boolean) : [],
    conditionNotes: cleanDescription(str(pick(raw, 'description', 'condition'))) || undefined,
    featured: false,
  };
}

/** Turn the provider's markdown description into clean, readable Albanian-page text. */
function cleanDescription(s: string): string {
  if (!s) return '';
  return s
    .replace(/\*\*/g, '')
    .replace(/#{1,6}\s*/g, '\n\n')
    .replace(/\s+-\s+/g, '\n• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Fetch the full detail record for one vehicle (rich specs + description). */
export async function fetchVehicleDetail(id: string): Promise<ProviderVehicle | null> {
  if (!id) return null;
  if (Date.now() < rateLimitedUntil) return null; // don't spend requests while capped
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (CONFIG.apiKey) headers.Authorization = `Bearer ${CONFIG.apiKey}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.timeoutMs);
  try {
    const url = `${CONFIG.baseUrl}${CONFIG.vehiclesPath}${encodeURIComponent(id)}/`;
    const res = await fetch(url, { headers, cache: 'no-store', signal: controller.signal });
    if (!res.ok) return null;
    const raw = (await res.json()) as RawVehicle;
    return mapToProviderVehicle(raw);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
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
  const pageSize = query.limit ?? CONFIG.pageSize;
  // Translate the public limit/offset contract into page-based pagination.
  const page = query.offset ? Math.floor(query.offset / pageSize) + 1 : 1;
  try {
    const { vehicles, total, rateLimit } = await fetchRaw(query, page, pageSize);
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

/**
 * Pull up to `cap` vehicles by paging through the catalog for one source.
 * Self-healing: if the API rejects the page size (HTTP 400), shrink it and
 * retry the same page — so it works whatever the upstream page_size cap is.
 */
async function pullPages(cap: number, sourceCode: string): Promise<ProviderVehicle[]> {
  const collected: ProviderVehicle[] = [];
  let pageSize = Math.max(5, CONFIG.pageSize);
  let page = 1;
  const maxRequests = 80; // hard backstop on total requests
  for (let req = 0; collected.length < cap && req < maxRequests; req++) {
    let result: RawResult;
    try {
      result = await fetchRaw({}, page, pageSize, sourceCode);
    } catch (err) {
      // Likely the page size is above the API's cap — halve it and retry.
      if (err instanceof CarapisError && err.status === 400 && pageSize > 5) {
        pageSize = Math.max(5, Math.floor(pageSize / 2));
        continue;
      }
      throw err;
    }
    if (!result.vehicles.length) break;
    collected.push(...result.vehicles.map(mapToProviderVehicle));
    if (!result.hasNext) break;
    page += 1;
  }
  return collected;
}

/** Provider adapter for the sync engine — paginates the full filtered set. */
export const carapisProvider: VehicleProvider = {
  id: 'carapis',
  displayName: 'Carapis (Encar)',
  async fetchInventory(options?: FetchOptions): Promise<ProviderVehicle[]> {
    const cap = Math.min(options?.limit ?? CONFIG.maxVehicles, CONFIG.maxVehicles);

    try {
      let collected: ProviderVehicle[] = [];
      // Try the configured source (e.g. "encar"). If that value is invalid or
      // yields nothing, fall back to unfiltered so the storefront is never empty.
      if (CONFIG.sourceCode) {
        try {
          collected = await pullPages(cap, CONFIG.sourceCode);
        } catch (e) {
          // Never retry on a rate limit — that only makes it worse. Propagate so
          // the caller serves cached data.
          if (e instanceof CarapisError && e.code === 'RATE_LIMIT_EXCEEDED') throw e;
          console.warn(
            `[carapis] source="${CONFIG.sourceCode}" failed (${e instanceof Error ? e.message : e}) — retrying without the filter.`,
          );
          collected = [];
        }
        if (collected.length === 0) {
          collected = await pullPages(cap, '');
        }
      } else {
        collected = await pullPages(cap, '');
      }
      return collected.slice(0, cap);
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
