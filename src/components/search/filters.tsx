'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import type { Facets } from '@/types/vehicle';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Filters are always visible/open — on desktop as a sticky sidebar, on mobile
 * stacked directly above the car grid. No "open filters" tap needed.
 */
export function InventoryFilters({ facets, total }: { facets: Facets; total: number }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
          <SlidersHorizontal className="h-4 w-4 text-brand" />
          Filtrat
        </h2>
        <span className="text-sm text-ink-muted">{total} vetura</span>
      </div>
      <FilterControls facets={facets} />
    </div>
  );
}

/** All draft filter fields, mirrored to URL params on "SHFAQ REZULTATET". */
interface Draft {
  brand: string;
  model: string;
  bodyType: string;
  engine: string;
  fuel: string;
  transmission: string;
  color: string;
  minYear: string;
  maxYear: string;
  minPrice: string;
  maxPrice: string;
  minMileage: string;
  maxMileage: string;
}

const EMPTY_DRAFT: Draft = {
  brand: '',
  model: '',
  bodyType: '',
  engine: '',
  fuel: '',
  transmission: '',
  color: '',
  minYear: '',
  maxYear: '',
  minPrice: '',
  maxPrice: '',
  minMileage: '',
  maxMileage: '',
};

interface DependentOptions {
  models: string[];
  bodyTypes: { value: string; label: string }[];
  engines: string[];
}

function FilterControls({
  facets,
  onApply,
}: {
  facets: Facets;
  onApply?: () => void;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const current = useMemo(() => new URLSearchParams(params.toString()), [params]);

  // Seed the draft from the current URL (first value wins for the single-select
  // dropdowns; ranges are scalar).
  const first = useCallback(
    (key: string) => current.get(key)?.split(',')[0] ?? '',
    [current],
  );
  const [draft, setDraft] = useState<Draft>(() => ({
    brand: first('brand'),
    model: first('model'),
    bodyType: first('bodyType'),
    engine: current.get('engine') ?? '',
    fuel: first('fuel'),
    transmission: first('transmission'),
    color: first('color'),
    minYear: current.get('minYear') ?? '',
    maxYear: current.get('maxYear') ?? '',
    minPrice: current.get('minPrice') ?? '',
    maxPrice: current.get('maxPrice') ?? '',
    minMileage: current.get('minMileage') ?? '',
    maxMileage: current.get('maxMileage') ?? '',
  }));

  // Dependent options for Modeli / Tipi / Motori, refreshed whenever an upstream
  // selection (brand → model → bodyType) changes.
  // Seed body types from the facets we already have so TIPI is usable on first
  // paint; models/engines fill in from the dependent fetch below.
  const [options, setOptions] = useState<DependentOptions>({
    models: [],
    bodyTypes: facets.bodyTypes.map((b) => ({ value: b.value, label: b.label })),
    engines: [],
  });
  useEffect(() => {
    const controller = new AbortController();
    const qs = new URLSearchParams();
    if (draft.brand) qs.set('brand', draft.brand);
    if (draft.model) qs.set('model', draft.model);
    if (draft.bodyType) qs.set('bodyType', draft.bodyType);
    fetch(`/api/filter-options?${qs.toString()}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setOptions({
            models: Array.isArray(d.models) ? d.models : [],
            bodyTypes: Array.isArray(d.bodyTypes) ? d.bodyTypes : [],
            engines: Array.isArray(d.engines) ? d.engines : [],
          });
        }
      })
      .catch(() => {
        /* aborted or offline — leave dependent dropdowns empty */
      });
    return () => controller.abort();
  }, [draft.brand, draft.model, draft.bodyType]);

  const push = useCallback(
    (next: URLSearchParams) => {
      next.delete('page');
      startTransition(() => {
        router.push(`/inventari?${next.toString()}`, { scroll: false });
      });
    },
    [router],
  );

  // Changing an upstream dropdown clears everything downstream of it.
  const setBrand = (v: string) =>
    setDraft((d) => ({ ...d, brand: v, model: '', bodyType: '', engine: '' }));
  const setModel = (v: string) =>
    setDraft((d) => ({ ...d, model: v, bodyType: '', engine: '' }));
  const setBodyType = (v: string) => setDraft((d) => ({ ...d, bodyType: v, engine: '' }));
  const setField = (key: keyof Draft, v: string) =>
    setDraft((d) => ({ ...d, [key]: v }));

  const applyFilters = () => {
    const next = new URLSearchParams();
    const sort = current.get('sort');
    if (sort) next.set('sort', sort);
    const setIf = (key: string, value: string) => {
      if (value) next.set(key, value);
    };
    setIf('brand', draft.brand);
    setIf('model', draft.model);
    setIf('bodyType', draft.bodyType);
    setIf('engine', draft.engine);
    setIf('fuel', draft.fuel);
    setIf('transmission', draft.transmission);
    setIf('color', draft.color);
    setIf('minYear', draft.minYear);
    setIf('maxYear', draft.maxYear);
    setIf('minPrice', draft.minPrice);
    setIf('maxPrice', draft.maxPrice);
    setIf('minMileage', draft.minMileage);
    setIf('maxMileage', draft.maxMileage);
    push(next);
    onApply?.();
  };

  const reset = () => {
    setDraft(EMPTY_DRAFT);
    const next = new URLSearchParams();
    const sort = current.get('sort');
    if (sort) next.set('sort', sort);
    push(next);
  };

  const activeCount = Object.values(draft).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <Select
        label="MARKA"
        placeholder="Zgjidh marken"
        value={draft.brand}
        onChange={setBrand}
        options={facets.brands.map((b) => ({ value: b.value, label: b.label }))}
      />

      <Select
        label="MODELI"
        placeholder="Zgjidh modelin"
        value={draft.model}
        onChange={setModel}
        disabled={options.models.length === 0}
        options={options.models.map((m) => ({ value: m, label: m }))}
      />

      <Select
        label="TIPI"
        placeholder="Zgjidh tipin"
        value={draft.bodyType}
        onChange={setBodyType}
        disabled={options.bodyTypes.length === 0}
        options={options.bodyTypes}
      />

      <Select
        label="MOTORI"
        placeholder="Zgjidh motorin"
        value={draft.engine}
        onChange={(v) => setField('engine', v)}
        disabled={options.engines.length === 0}
        options={options.engines.map((e) => ({ value: e, label: e }))}
      />

      <Select
        label="KARBURANTI"
        placeholder="Cdo Lloj"
        value={draft.fuel}
        onChange={(v) => setField('fuel', v)}
        options={facets.fuels.map((f) => ({ value: f.value, label: f.label }))}
      />

      <Select
        label="MARSHI"
        placeholder="Cdo Lloj"
        value={draft.transmission}
        onChange={(v) => setField('transmission', v)}
        options={facets.transmissions.map((t) => ({ value: t.value, label: t.label }))}
      />

      <RangeRow label="VITI">
        <RangeInput
          placeholder="Nga"
          value={draft.minYear}
          onChange={(v) => setField('minYear', v)}
          aria-label="Viti nga"
        />
        <RangeInput
          placeholder="Deri"
          value={draft.maxYear}
          onChange={(v) => setField('maxYear', v)}
          aria-label="Viti deri"
        />
      </RangeRow>

      <RangeRow label="CMIMI" suffix="EUR">
        <RangeInput
          placeholder="Min"
          value={draft.minPrice}
          onChange={(v) => setField('minPrice', v)}
          aria-label="Çmimi minimal"
        />
        <RangeInput
          placeholder="Max"
          value={draft.maxPrice}
          onChange={(v) => setField('maxPrice', v)}
          aria-label="Çmimi maksimal"
        />
      </RangeRow>

      <RangeRow label="KILOMETRAZHI" suffix="KM">
        <RangeInput
          placeholder="Min"
          value={draft.minMileage}
          onChange={(v) => setField('minMileage', v)}
          aria-label="Kilometrazhi minimal"
        />
        <RangeInput
          placeholder="Max"
          value={draft.maxMileage}
          onChange={(v) => setField('maxMileage', v)}
          aria-label="Kilometrazhi maksimal"
        />
      </RangeRow>

      <Select
        label="NGJYRA E JASHTME"
        placeholder="Cdo Ngjyre"
        value={draft.color}
        onChange={(v) => setField('color', v)}
        options={facets.colors.map((c) => ({ value: c.value, label: c.label }))}
      />

      <div className="flex items-center gap-3 border-t border-surface-border pt-5">
        <Button variant="dark" className="flex-1" onClick={applyFilters}>
          SHFAQ REZULTATET
        </Button>
        {activeCount > 0 ? (
          <Button variant="ghost" onClick={reset}>
            Pastro
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold tracking-wide text-ink">
      {children}
    </label>
  );
}

function Select({
  label,
  placeholder,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'h-10 w-full appearance-none rounded-lg border border-surface-border bg-white px-3 pr-9 text-sm focus:border-ink/30 focus:outline-none focus:ring-2 focus:ring-brand/40',
            disabled ? 'cursor-not-allowed text-ink-faint opacity-60' : 'text-ink',
          )}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
      </div>
    </div>
  );
}

function RangeRow({
  label,
  suffix,
  children,
}: {
  label: string;
  suffix?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        {children}
        {suffix ? (
          <span className="shrink-0 text-xs font-medium text-ink-faint">{suffix}</span>
        ) : null}
      </div>
    </div>
  );
}

function RangeInput({
  value,
  onChange,
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>) {
  return (
    <input
      {...props}
      type="number"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full min-w-0 rounded-lg border border-surface-border bg-white px-3 text-sm focus:border-ink/30 focus:outline-none focus:ring-2 focus:ring-brand/40"
    />
  );
}
