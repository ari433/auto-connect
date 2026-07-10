/**
 * Guard against corrupted source prices.
 *
 * A subset of Encar listings arrive with their KRW price inflated by ~10× (a
 * data-entry/parsing artifact upstream). The inflation is self-consistent (the
 * USD figure tracks the bad KRW) and, for some models, affects the majority of
 * listings — so a plain per-model median is not robust.
 *
 * What IS stable: real used cars overwhelmingly sit below ~€70k, while inflated
 * ones (≈10× of €8k–€30k cars) land at €80k+. So we anchor on the "normal" band
 * (≤ €70k, dominated by genuine prices), take the median there per model (or per
 * brand as a fallback), and drop any high-priced listing that exceeds a few times
 * that anchor. Genuine luxury models with no normal-band peers (Bentley, etc.)
 * are kept, since there is no honest reference to flag them against.
 */
type PricedVehicle = { brand: string; model: string; price: number };

const SUSPECT_ABOVE_EUR = Number(process.env.CATALOG_PRICE_SUSPECT_EUR ?? 70_000);
const MODEL_MULT = Number(process.env.CATALOG_PRICE_MODEL_MULT ?? 3);
const BRAND_MULT = Number(process.env.CATALOG_PRICE_BRAND_MULT ?? 3);
const MIN_MODEL_NORMAL = 2;
const MIN_BRAND_NORMAL = 4;

// Brands that are legitimately expensive. When a high-priced listing has no
// model/brand price reference to judge it against, we keep it only for these —
// a rare non-premium brand priced far above the normal band is almost always a
// corrupted price, not a genuine six-figure car.
const PREMIUM_BRANDS = new Set([
  'porsche', 'bentley', 'ferrari', 'lamborghini', 'rolls-royce', 'rolls royce',
  'mclaren', 'aston martin', 'maserati',
]);

function median(nums: number[]): number {
  const a = [...nums].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

function push(map: Map<string, number[]>, key: string, value: number): void {
  const arr = map.get(key);
  if (arr) arr.push(value);
  else map.set(key, [value]);
}

function medianMap(source: Map<string, number[]>, minSamples: number): Map<string, number> {
  const out = new Map<string, number>();
  for (const [k, arr] of source) if (arr.length >= minSamples) out.set(k, median(arr));
  return out;
}

/**
 * Build a predicate that is true for a plausibly-priced vehicle. Prices within
 * the normal band are always kept; only high prices without a supporting model/
 * brand reference are dropped.
 */
export function buildPriceSanityFilter(
  vehicles: PricedVehicle[],
): (v: PricedVehicle) => boolean {
  const normalByModel = new Map<string, number[]>();
  const normalByBrand = new Map<string, number[]>();
  for (const v of vehicles) {
    if (v.price > 0 && v.price <= SUSPECT_ABOVE_EUR) {
      push(normalByModel, `${v.brand}|${v.model}`, v.price);
      push(normalByBrand, v.brand, v.price);
    }
  }
  const modelMedian = medianMap(normalByModel, MIN_MODEL_NORMAL);
  const brandMedian = medianMap(normalByBrand, MIN_BRAND_NORMAL);

  return (v) => {
    if (!(v.price > 0)) return false;
    if (v.price <= SUSPECT_ABOVE_EUR) return true; // normal band — always real

    const mm = modelMedian.get(`${v.brand}|${v.model}`);
    if (mm != null) return v.price <= MODEL_MULT * mm;

    const bm = brandMedian.get(v.brand);
    if (bm != null) return v.price <= BRAND_MULT * bm;

    // No reference: keep only for genuinely-premium brands.
    return PREMIUM_BRANDS.has(v.brand.trim().toLowerCase());
  };
}
