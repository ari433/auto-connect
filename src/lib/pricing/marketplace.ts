/**
 * AUTO CONNECT — marketplace price adjustment.
 *
 * The original Encar/Carapis selling price is NEVER shown to customers. Every
 * customer-facing figure is the imported base price (already converted to EUR)
 * plus a fixed marketplace margin that covers Auto Connect's service:
 *
 *   base ≤ €10,000  →  base + €2,000
 *   base >  €10,000  →  base + €3,000
 *
 * This is the single place that rule lives. It is applied once, at the provider
 * boundary, so it propagates automatically to search, cards, detail pages,
 * related/featured/latest, filters, sorting, the sync/DB path and every API
 * response — there is no second implementation to keep in sync.
 *
 * The thresholds default to the values above but stay env-overridable, matching
 * the rest of the pricing configuration.
 */

function num(env: string | undefined, fallback: number): number {
  const parsed = env ? Number(env) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

const THRESHOLD_EUR = num(process.env.PRICING_MARKUP_THRESHOLD_EUR, 10_000);
const MARKUP_LOW_EUR = num(process.env.PRICING_MARKUP_LOW_EUR, 2_000);
const MARKUP_HIGH_EUR = num(process.env.PRICING_MARKUP_HIGH_EUR, 3_000);

/**
 * Turn an imported base price (EUR) into the final customer-facing price.
 * A non-positive or unusable base yields 0 so callers never surface a bogus
 * "€2,000" price for a vehicle whose upstream price is missing.
 */
export function applyMarketplaceMarkup(baseEur: number): number {
  if (!Number.isFinite(baseEur) || baseEur <= 0) return 0;
  const markup = baseEur <= THRESHOLD_EUR ? MARKUP_LOW_EUR : MARKUP_HIGH_EUR;
  return Math.round(baseEur) + markup;
}
