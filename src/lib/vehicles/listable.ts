/**
 * Whether a vehicle is a real, sellable listing.
 *
 * The upstream Encar feed occasionally carries data artifacts — non-cars (e.g.
 * scale models), yearless rows, and brand-new reference entries with placeholder
 * prices of a few hundred euros. None of those are cars Auto Connect can import
 * and sell, so they are excluded at ingestion (both live and sync paths) rather
 * than shown with an implausible price.
 *
 * The thresholds are business-sane defaults (an imported Korean car realistically
 * lands well above a couple thousand euros) and stay env-overridable.
 */
const MIN_PRICE_EUR = Number(process.env.CATALOG_MIN_PRICE_EUR ?? 2500);
// The dealership only sells vehicles from 2016 onward.
const MIN_YEAR = Number(process.env.CATALOG_MIN_YEAR ?? 2016);

export function isListableVehicle(v: { year: number; price: number }): boolean {
  const maxYear = new Date().getFullYear() + 1;
  return (
    Number.isFinite(v.price) &&
    v.price >= MIN_PRICE_EUR &&
    v.year >= MIN_YEAR &&
    v.year <= maxYear
  );
}
