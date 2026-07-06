import { searchVehicles, getFeaturedVehicles } from '@/lib/catalog';
import { formatPrice, formatMileage } from '@/lib/utils';
import { fuelLabels, bodyTypeLabels } from '@/lib/labels';
import type { VehicleQuery } from '@/lib/search/query';
import type { BodyType, FuelType, Vehicle } from '@/types/vehicle';

/**
 * AUTO CONNECT vehicle assistant.
 *
 * A deterministic, inventory-aware recommender. It parses a natural-language
 * request in Albanian into structured intent, queries our own catalogue, and
 * responds in natural Albanian with concrete suggestions. The recommendation is
 * always grounded in real, available stock — it never invents a vehicle.
 */

export interface AssistantIntent {
  maxPrice?: number;
  minSeats?: number;
  fuels: FuelType[];
  bodyTypes: BodyType[];
  brands: string[];
  wantsSporty: boolean;
  wantsEconomy: boolean;
  wantsFamily: boolean;
}

export interface AssistantReply {
  message: string;
  intent: AssistantIntent;
  vehicles: Vehicle[];
}

const KNOWN_BRANDS = [
  'Genesis', 'Kia', 'Hyundai', 'BMW', 'Mercedes-Benz', 'Audi', 'Porsche',
  'Toyota', 'Tesla', 'Volkswagen', 'Land Rover',
];

/** Parse an Albanian free-text request into structured intent. */
export function parseIntent(text: string): AssistantIntent {
  const t = ` ${text.toLowerCase()} `;

  const fuels = new Set<FuelType>();
  if (/elektrik|rrym|ev\b/.test(t)) fuels.add('ELECTRIC');
  if (/hibrid/.test(t)) fuels.add('HYBRID');
  if (/naft|dizel|diesel/.test(t)) fuels.add('DIESEL');
  if (/benzin/.test(t)) fuels.add('BENZINE');

  const bodyTypes = new Set<BodyType>();
  if (/suv|xhip|terren/.test(t)) bodyTypes.add('SUV');
  if (/sedan|limuzin/.test(t)) bodyTypes.add('SEDAN');
  if (/kupe|coupe/.test(t)) bodyTypes.add('COUPE');
  if (/furgon|van|monovolum/.test(t)) bodyTypes.add('VAN');
  if (/hatchback|kompakt/.test(t)) bodyTypes.add('HATCHBACK');

  const brands = KNOWN_BRANDS.filter((b) =>
    t.includes(b.toLowerCase().replace('-', ' ')) || t.includes(b.toLowerCase()),
  );

  const wantsFamily = /famil|fëmij|femij|7 ulëse|shtatë|hapësir|hapesir/.test(t);
  const wantsSporty = /sport|shpejt|fuqi|kalë|fuqishme|performanc/.test(t);
  const wantsEconomy = /ekonomik|lir[ëe]|buxhet|konsum|pak naft/.test(t);

  const minSeats = wantsFamily ? 7 : undefined;

  return {
    maxPrice: parseBudget(t),
    minSeats,
    fuels: [...fuels],
    bodyTypes: [...bodyTypes],
    brands,
    wantsSporty,
    wantsEconomy,
    wantsFamily,
  };
}

/** Extract a EUR budget from phrases like "deri 30 mijë", "35000€", "40k". */
function parseBudget(t: string): number | undefined {
  // "40k" / "35 k"
  const k = t.match(/(\d{1,3})\s*k\b/);
  if (k) return Number(k[1]) * 1000;

  // "30 mijë" / "30 mije"
  const mije = t.match(/(\d{1,3})\s*(mij[ëe])/);
  if (mije) return Number(mije[1]) * 1000;

  // Plain figures with optional separators: "35000", "35.000", "35,000€"
  const plain = [...t.matchAll(/(\d{2,3}[.,]?\d{3})/g)].map((m) =>
    Number(m[1].replace(/[.,]/g, '')),
  );
  const candidate = plain.filter((n) => n >= 5000 && n <= 200000).sort((a, b) => b - a)[0];
  return candidate;
}

/** Base query with the catalogue defaults filled in. */
function baseQuery(overrides: Partial<VehicleQuery>): VehicleQuery {
  return {
    q: undefined,
    brand: [],
    model: [],
    bodyType: [],
    fuel: [],
    transmission: [],
    drive: [],
    featured: false,
    sort: 'newest',
    page: 1,
    pageSize: 3,
    ...overrides,
  };
}

/** Turn intent into a catalogue query and return grounded recommendations. */
export async function recommend(text: string): Promise<AssistantReply> {
  const intent = parseIntent(text);

  // Family requests without an explicit body type lean toward roomy vehicles.
  const bodyType = intent.bodyTypes.length
    ? intent.bodyTypes
    : intent.wantsFamily
      ? (['SUV', 'VAN'] as BodyType[])
      : [];

  const query = baseQuery({
    brand: intent.brands,
    bodyType,
    fuel: intent.fuels,
    maxPrice: intent.maxPrice,
    minHp: intent.wantsSporty ? 250 : undefined,
    sort: intent.wantsEconomy ? 'price_asc' : 'newest',
  });

  let vehicles = (await searchVehicles(query)).items;

  // Graceful fallback: relax to budget-only, then to featured stock.
  if (vehicles.length === 0 && intent.maxPrice) {
    vehicles = (
      await searchVehicles(baseQuery({ maxPrice: intent.maxPrice, sort: 'price_asc' }))
    ).items;
  }
  if (vehicles.length === 0) {
    vehicles = await getFeaturedVehicles(3);
  }

  return { intent, vehicles, message: composeMessage(intent, vehicles) };
}

/** Compose a natural Albanian response grounded in the results. */
function composeMessage(intent: AssistantIntent, vehicles: Vehicle[]): string {
  if (vehicles.length === 0) {
    return 'Për momentin nuk kam gjetur një veturë që përputhet saktësisht me kërkesën tuaj. Na tregoni pak më shumë për buxhetin dhe përdorimin, ose na kontaktoni direkt — ekipi ynë do t’ju gjejë veturën e duhur.';
  }

  const criteria: string[] = [];
  if (intent.maxPrice) criteria.push(`buxhet deri në ${formatPrice(intent.maxPrice)}`);
  if (intent.wantsFamily) criteria.push('hapësirë për familjen');
  if (intent.wantsSporty) criteria.push('performancë sportive');
  if (intent.wantsEconomy) criteria.push('konsum ekonomik');
  if (intent.bodyTypes.length)
    criteria.push(intent.bodyTypes.map((b) => bodyTypeLabels[b]).join(' / '));
  if (intent.fuels.length)
    criteria.push(intent.fuels.map((f) => fuelLabels[f].toLowerCase()).join(' / '));

  const intro = criteria.length
    ? `Bazuar në kërkesën tuaj (${criteria.join(', ')}), këto janë përzgjedhjet e mia:`
    : 'Këto janë disa nga veturat që rekomandoj për ju:';

  const lines = vehicles.map((v) => {
    const name = `${v.brand} ${v.model}${v.variant ? ` ${v.variant}` : ''}`;
    return `• ${name} (${v.year}) — ${formatPrice(v.price)}, ${formatMileage(v.mileageKm)}, ${fuelLabels[v.fuel].toLowerCase()}.`;
  });

  return `${intro}\n${lines.join('\n')}\n\nDëshironi që t’ju përgatis një ofertë financimi ose të rezervoni një test-drive për ndonjërën prej tyre?`;
}
