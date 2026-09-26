export interface InspectionSummary {
  panelsRepainted: number | null;
  frameDamage: boolean | null;
}

export function toInspectionSummary(value: unknown): InspectionSummary | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const panels = raw.panels_repainted ?? raw.panelsRepainted;
  const frame = raw.frame_damage ?? raw.frameDamage;
  const panelsRepainted =
    typeof panels === 'number'
      ? panels
      : typeof panels === 'string' && panels.trim() !== '' && Number.isFinite(Number(panels))
        ? Number(panels)
        : null;
  const frameDamage = typeof frame === 'boolean' ? frame : null;
  return panelsRepainted != null || frameDamage != null
    ? { panelsRepainted, frameDamage }
    : null;
}

export function toAccidentCount(value: unknown): number | null {
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'string' && value.trim().toLowerCase() === 'none') return 0;
  return null;
}
