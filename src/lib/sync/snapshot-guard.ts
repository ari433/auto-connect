/** Pure validation guard for daily third-party inventory snapshots.
 * No database writes; reject incomplete or suspicious snapshots before sync.
 */
export interface SnapshotRow {
  ref: string;
  brand: string;
  model: string;
  year: number;
  mileageKm: number;
  priceKrw: number;
  imageUrls: string[];
}
export interface SnapshotValidation {
  ok: boolean;
  reasons: string[];
  count: number;
  uniqueCount: number;
}
export function validateInventorySnapshot(
  rows: readonly SnapshotRow[],
  options: { minimumCount?: number; previousCount?: number; maxDropFraction?: number } = {},
): SnapshotValidation {
  const reasons: string[] = [];
  const minimumCount = options.minimumCount ?? 20;
  const maxDropFraction = options.maxDropFraction ?? 0.25;
  const ids = new Set<string>();
  let invalid = 0;
  for (const row of rows) {
    if (!row.ref?.trim() || ids.has(row.ref)) {
      invalid++;
    } else {
      ids.add(row.ref);
    }
    if (!row.brand?.trim() || !row.model?.trim() ||
        !Number.isInteger(row.year) || row.year < 1980 || row.year > new Date().getUTCFullYear() + 1 ||
        !Number.isFinite(row.mileageKm) || row.mileageKm < 0 ||
        !Number.isFinite(row.priceKrw) || row.priceKrw <= 0 ||
        !Array.isArray(row.imageUrls) || row.imageUrls.length === 0) invalid++;
  }
  if (rows.length < minimumCount) reasons.push('BELOW_MINIMUM_COUNT');
  if (invalid > 0) reasons.push('INVALID_OR_DUPLICATE_ROWS');
  if (options.previousCount != null && options.previousCount > 0 &&
      rows.length < options.previousCount * (1 - maxDropFraction)) {
    reasons.push('SUSPICIOUS_INVENTORY_DROP');
  }
  return { ok: reasons.length === 0, reasons, count: rows.length, uniqueCount: ids.size };
}
