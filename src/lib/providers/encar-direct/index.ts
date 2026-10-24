/**
 * ─────────────────────────────────────────────────────────────────────────
 *  ENCAR-DIRECT PROVIDER — talks to Encar's own public search/detail API.
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  Unlike the `carapis` provider (a paid, normalized, rate-limited feed), this
 *  module calls car.encar.com's OWN public frontend API directly — the exact
 *  endpoints the encar.com website itself uses:
 *
 *    list:   GET https://api.encar.com/search/car/list/general
 *    detail: GET https://api.encar.com/v1/readside/vehicle/{id}
 *
 *  Confirmed working with no API key/auth, 2026-10-24.
 *
 *  Intended to run on a long-lived host (a small VPS, cron'd once a day), NOT
 *  on Vercel serverless — a full run makes one request per vehicle (listing
 *  detail) and is deliberately paced to stay polite to an undocumented API,
 *  which a 10s serverless timeout cannot accommodate.
 *
 *  Field notes (from a real sample, see git history for the raw payloads):
 *   - List `Price` / detail `advertisement.price` are in units of 10,000 KRW
 *     ("만원") — multiply by 10,000 to get real KRW for the pricing engine.
 *   - `category.manufacturerEnglishName` / `modelGroupEnglishName` /
 *     `gradeEnglishName` give usable English names directly — no Korean→
 *     English brand/model dictionary needed.
 *   - `options.standard/choice` are opaque numeric codes with no label in this
 *     response — Encar doesn't publish a code→label map here, so equipment is
 *     deliberately left empty rather than showing raw codes.
 *   - `contents.text` is the Korean DEALER'S own marketing blurb (shop name,
 *     directions, boilerplate) — never shown to customers; our own Albanian
 *     description generator builds the listing text from structured fields.
 *   - `contact.*` (Korean dealer phone/address) is intentionally NOT mapped
 *     into `dealer` — AUTO CONNECT never exposes the Korean source identity.
 *   - `condition.accident.recordView` means "a report exists to view", NOT
 *     "this vehicle had an accident" — left unmapped rather than guessed.
 * ─────────────────────────────────────────────────────────────────────────
 */
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

if (typeof window !== 'undefined') {
  throw new Error('The encar-direct provider must never be imported on the client.');
}

/* ── Configuration (all env-overridable) ─────────────────────────────────── */

const CONFIG = {
  baseUrl: (process.env.ENCAR_DIRECT_BASE_URL ?? 'https://api.encar.com').replace(/\/$/, ''),
  photoBaseUrl: (process.env.ENCAR_DIRECT_PHOTO_BASE_URL ?? 'https://ci.encar.com').replace(/\/$/, ''),
  /** Encar's own query DSL — confirmed default: not hidden, actual cars. */
  query: process.env.ENCAR_DIRECT_QUERY ?? '(And.Hidden.N._.CarType.Y.)',
  pageSize: Number(process.env.ENCAR_DIRECT_PAGE_SIZE ?? 50),
  /** Deliberately bounded — a full daily refresh batch, not the whole 100k+ catalogue. */
  maxVehicles: Number(process.env.ENCAR_DIRECT_MAX_VEHICLES ?? 1000),
  timeoutMs: Number(process.env.ENCAR_DIRECT_TIMEOUT_MS ?? 15000),
  /** Pause between PER-VEHICLE detail requests — stay polite to an undocumented API. */
  detailDelayMs: Number(process.env.ENCAR_DIRECT_DETAIL_DELAY_MS ?? 250),
  fxKrwToEur: Number(process.env.PRICING_FX_KRW_EUR ?? 0.00069),
  userAgent:
    process.env.ENCAR_DIRECT_USER_AGENT ??
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
} as const;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* ── Raw upstream shapes (defensive: fields are read tolerantly) ──────────── */

interface RawListItem {
  Id: string;
  Manufacturer?: string;
  Model?: string;
  Price?: number;
  Mileage?: number;
  Year?: number;
  FuelType?: string;
  SalesStatus?: string;
}

interface RawListEnvelope {
  Count?: number;
  SearchResults?: RawListItem[];
}

interface RawDetail {
  category?: {
    manufacturerName?: string;
    manufacturerEnglishName?: string;
    modelName?: string;
    modelGroupName?: string;
    modelGroupEnglishName?: string;
    gradeName?: string;
    gradeEnglishName?: string;
    yearMonth?: string;
  };
  advertisement?: {
    price?: number;
    status?: string;
  };
  spec?: {
    mileage?: number;
    displacement?: number;
    transmissionName?: string;
    fuelName?: string;
    colorName?: string;
    seatCount?: number;
    bodyName?: string;
  };
  photos?: { path?: string; type?: string }[];
  vin?: string;
  vehicleId?: number;
}

/* ── HTTP layer ──────────────────────────────────────────────────────────── */

async function getJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': CONFIG.userAgent, Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Encar ${res.status}: ${res.statusText}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function buildListUrl(offset: number, limit: number): string {
  const url = new URL('/search/car/list/general', CONFIG.baseUrl);
  url.searchParams.set('count', 'true');
  url.searchParams.set('q', CONFIG.query);
  url.searchParams.set('sr', `|ModifiedDate|${offset}|${limit}`);
  return url.toString();
}

function buildDetailUrl(id: string): string {
  return `${CONFIG.baseUrl}/v1/readside/vehicle/${id}`;
}

/* ── Glossaries: raw Encar value → our enums (Korean terms matched directly) ── */

function normKey(v: unknown): string {
  return String(v ?? '').trim().toLowerCase();
}

function enumFuel(v: unknown): FuelType {
  const k = normKey(v);
  if (/diesel|디젤/.test(k)) return 'DIESEL';
  if (/plug|플러그/.test(k)) return 'PLUG_IN_HYBRID';
  if (/hybrid|하이브리드/.test(k)) return 'HYBRID';
  if (/electric|전기/.test(k)) return 'ELECTRIC';
  if (/gasolin|petrol|가솔린/.test(k)) return 'BENZINE';
  if (/lpg|가스/.test(k)) return 'LPG';
  return 'BENZINE';
}

function enumTransmission(v: unknown): Transmission {
  const k = normKey(v);
  if (/cvt/.test(k)) return 'CVT';
  if (/dct|dual|dsg/.test(k)) return 'DUAL_CLUTCH';
  if (/manual|수동/.test(k)) return 'MANUAL';
  return 'AUTOMATIC'; // covers "오토" (auto) and "자동" (automatic)
}

function enumDrive(v: unknown): DriveType {
  const k = normKey(v);
  if (/awd|all|4x4|사륜/.test(k)) return 'AWD';
  if (/rwd|rear|후륜/.test(k)) return 'RWD';
  if (/4wd/.test(k)) return 'FOUR_WD';
  return 'FWD';
}

function enumBody(v: unknown): BodyType {
  const k = normKey(v);
  if (/suv/.test(k)) return 'SUV';
  if (/hatch/.test(k)) return 'HATCHBACK';
  if (/coupe|쿠페/.test(k)) return 'COUPE';
  if (/wagon|estate|왜건/.test(k)) return 'WAGON';
  // Encar's "RV" bucket (recreational vehicle) covers minivans/MPVs.
  if (/\brv\b|van|mpv|미니밴/.test(k)) return 'VAN';
  if (/pickup|truck|트럭/.test(k)) return 'PICKUP';
  if (/convert|cabrio/.test(k)) return 'CONVERTIBLE';
  return 'SEDAN';
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
  if (!k) return 'E papërcaktuar';
  for (const [re, label] of COLOR_GLOSSARY) if (re.test(k)) return label;
  return String(v);
}

/* ── Mapping ─────────────────────────────────────────────────────────────── */

function photoUrls(detail: RawDetail): string[] {
  const photos = detail.photos ?? [];
  // Exterior shots first, then interior, then option close-ups.
  const order: Record<string, number> = { OUTER: 0, INNER: 1, OPTION: 2 };
  const sorted = [...photos].sort(
    (a, b) => (order[a.type ?? ''] ?? 9) - (order[b.type ?? ''] ?? 9),
  );
  const out: string[] = [];
  for (const p of sorted) {
    if (p.path) out.push(`${CONFIG.photoBaseUrl}${p.path}`);
  }
  return [...new Set(out)];
}

function mapToProviderVehicle(listItem: RawListItem, detail: RawDetail): ProviderVehicle | null {
  const id = listItem.Id;
  const cat = detail.category ?? {};
  const spec = detail.spec ?? {};
  const ad = detail.advertisement ?? {};

  const brand = cat.manufacturerEnglishName?.trim() || cat.manufacturerName?.trim();
  const model = cat.modelGroupEnglishName?.trim() || cat.modelGroupName?.trim() || cat.modelName?.trim();
  if (!brand || !model) return null; // can't build a usable listing without these

  // Price is in units of 10,000 KRW ("만원") on both the list and detail payload.
  const priceManwon = ad.price ?? listItem.Price ?? 0;
  const priceKrw = Math.round(priceManwon * 10_000);
  if (!priceKrw) return null;

  const yearMonth = cat.yearMonth ?? String(listItem.Year ?? '');
  const year = Number(yearMonth.slice(0, 4)) || new Date().getFullYear();

  const variant = cat.gradeEnglishName?.trim() || cat.gradeName?.trim() || undefined;
  const images = photoUrls(detail);
  const engineCc = spec.displacement || undefined;

  return {
    ref: id,
    vin: detail.vin || `ENCAR-${id}`,
    brand,
    model,
    variant,
    year,
    mileageKm: spec.mileage ?? listItem.Mileage ?? 0,
    fuel: enumFuel(spec.fuelName ?? listItem.FuelType),
    transmission: enumTransmission(spec.transmissionName),
    drive: enumDrive(spec.bodyName),
    bodyType: enumBody(spec.bodyName),
    engineLabel: variant || (engineCc ? `${(engineCc / 1000).toFixed(1)}L` : brand),
    engineCc,
    exteriorColor: albanianColor(spec.colorName),
    seats: spec.seatCount || undefined,
    priceKrw,
    imageUrls: images,
    equipment: [], // Encar's option codes have no label in this response — never show raw codes.
    // No dealer / conditionNotes: never expose the Korean source identity or
    // the dealer's own marketing text; our own description builder takes over.
  };
}

/* ── Fetching ────────────────────────────────────────────────────────────── */

async function fetchDetail(id: string): Promise<RawDetail | null> {
  try {
    return await getJson<RawDetail>(buildDetailUrl(id));
  } catch {
    return null; // a single bad listing must never fail the whole batch
  }
}

async function* streamInventory(options: FetchOptions = {}): AsyncGenerator<ProviderVehicle[]> {
  const limit = options.limit ?? CONFIG.maxVehicles;
  let offset = 0;
  let pulled = 0;

  while (pulled < limit) {
    const batchSize = Math.min(CONFIG.pageSize, limit - pulled);
    const { SearchResults } = await getJson<RawListEnvelope>(buildListUrl(offset, batchSize));
    if (!SearchResults?.length) return;

    const batch: ProviderVehicle[] = [];
    for (const item of SearchResults) {
      if (item.SalesStatus === 'CONTRACT') continue; // reserved/under contract — skip
      const detail = await fetchDetail(item.Id);
      await sleep(CONFIG.detailDelayMs); // stay polite between requests
      if (!detail) continue;
      const mapped = mapToProviderVehicle(item, detail);
      if (mapped) batch.push(mapped);
    }

    if (batch.length) yield batch;
    pulled += SearchResults.length;
    offset += SearchResults.length;
    if (SearchResults.length < batchSize) return; // reached the end upstream
  }
}

async function fetchInventory(options: FetchOptions = {}): Promise<ProviderVehicle[]> {
  const out: ProviderVehicle[] = [];
  for await (const batch of streamInventory(options)) out.push(...batch);
  return out;
}

export const encarDirectProvider: VehicleProvider = {
  id: 'encar-direct',
  displayName: 'Encar (Direct)',
  fetchInventory,
  streamInventory,
};
