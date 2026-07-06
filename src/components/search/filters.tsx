'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import type { Facets } from '@/types/vehicle';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const MULTI_KEYS = ['brand', 'bodyType', 'fuel', 'transmission'] as const;

export function InventoryFilters({ facets, total }: { facets: Facets; total: number }) {
  const [open, setOpen] = useState(false);
  const activeCount = useActiveCount();

  return (
    <>
      {/* Mobile trigger */}
      <div className="flex items-center justify-between lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-white px-4 py-2.5 text-sm font-medium"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtrat
          {activeCount > 0 ? (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-xs text-white">
              {activeCount}
            </span>
          ) : null}
        </button>
        <span className="text-sm text-ink-muted">{total} vetura</span>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <FilterControls facets={facets} />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-[60] lg:hidden',
          open ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn(
            'absolute inset-0 bg-ink/40 transition-opacity duration-300',
            open ? 'opacity-100' : 'opacity-0',
          )}
        />
        <div
          className={cn(
            'absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto bg-surface-subtle p-5 shadow-float transition-transform duration-300 ease-premium',
            open ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Filtrat</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink/5"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <FilterControls facets={facets} onApply={() => setOpen(false)} />
        </div>
      </div>
    </>
  );
}

function useActiveCount() {
  const params = useSearchParams();
  return useMemo(() => {
    let count = 0;
    params.forEach((_v, k) => {
      if (['page', 'sort', 'pageSize'].includes(k)) return;
      count += 1;
    });
    return count;
  }, [params]);
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

  const push = useCallback(
    (next: URLSearchParams) => {
      next.delete('page');
      startTransition(() => {
        router.push(`/inventari?${next.toString()}`, { scroll: false });
      });
    },
    [router],
  );

  const getMulti = (key: string) => current.get(key)?.split(',').filter(Boolean) ?? [];

  const toggleMulti = (key: string, value: string) => {
    const next = new URLSearchParams(current.toString());
    const set = new Set(getMulti(key));
    set.has(value) ? set.delete(value) : set.add(value);
    if (set.size) next.set(key, [...set].join(','));
    else next.delete(key);
    push(next);
  };

  const setScalar = (key: string, value: string) => {
    const next = new URLSearchParams(current.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    push(next);
  };

  const reset = () => {
    const next = new URLSearchParams();
    const sort = current.get('sort');
    if (sort) next.set('sort', sort);
    push(next);
  };

  const activeCount = Array.from(current.keys()).filter(
    (k) => !['page', 'sort', 'pageSize'].includes(k),
  ).length;

  return (
    <div className="space-y-7">
      <FilterGroup title="Marka" defaultOpen>
        <div className="flex flex-col gap-1">
          {facets.brands.map((b) => (
            <CheckRow
              key={b.value}
              label={b.label}
              count={b.count}
              checked={getMulti('brand').includes(b.value)}
              onChange={() => toggleMulti('brand', b.value)}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Karoseria" defaultOpen>
        <div className="flex flex-wrap gap-2">
          {facets.bodyTypes.map((b) => (
            <Chip
              key={b.value}
              label={b.label}
              active={getMulti('bodyType').includes(b.value)}
              onClick={() => toggleMulti('bodyType', b.value)}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Karburanti">
        <div className="flex flex-wrap gap-2">
          {facets.fuels.map((f) => (
            <Chip
              key={f.value}
              label={f.label}
              active={getMulti('fuel').includes(f.value)}
              onClick={() => toggleMulti('fuel', f.value)}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Transmisioni">
        <div className="flex flex-wrap gap-2">
          {facets.transmissions.map((t) => (
            <Chip
              key={t.value}
              label={t.label}
              active={getMulti('transmission').includes(t.value)}
              onClick={() => toggleMulti('transmission', t.value)}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Çmimi (EUR)">
        <div className="flex items-center gap-2">
          <NumberInput
            placeholder={formatPrice(facets.priceRange.min)}
            defaultValue={current.get('minPrice') ?? ''}
            onCommit={(v) => setScalar('minPrice', v)}
            aria-label="Çmimi minimal"
          />
          <span className="text-ink-faint">—</span>
          <NumberInput
            placeholder={formatPrice(facets.priceRange.max)}
            defaultValue={current.get('maxPrice') ?? ''}
            onCommit={(v) => setScalar('maxPrice', v)}
            aria-label="Çmimi maksimal"
          />
        </div>
      </FilterGroup>

      <FilterGroup title="Viti">
        <div className="flex items-center gap-2">
          <NumberInput
            placeholder={String(facets.yearRange.min)}
            defaultValue={current.get('minYear') ?? ''}
            onCommit={(v) => setScalar('minYear', v)}
            aria-label="Viti minimal"
          />
          <span className="text-ink-faint">—</span>
          <NumberInput
            placeholder={String(facets.yearRange.max)}
            defaultValue={current.get('maxYear') ?? ''}
            onCommit={(v) => setScalar('maxYear', v)}
            aria-label="Viti maksimal"
          />
        </div>
      </FilterGroup>

      <FilterGroup title="Kilometrazha maksimale">
        <NumberInput
          placeholder="p.sh. 60000"
          defaultValue={current.get('maxMileage') ?? ''}
          onCommit={(v) => setScalar('maxMileage', v)}
          aria-label="Kilometrazha maksimale"
        />
      </FilterGroup>

      <div className="flex items-center gap-3 border-t border-surface-border pt-5">
        <Button variant="dark" className="flex-1" onClick={onApply}>
          Shfaq rezultatet
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

function FilterGroup({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-surface-border pb-6 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-semibold text-ink"
      >
        {title}
        <span className={cn('text-ink-faint transition-transform', open && 'rotate-45')}>+</span>
      </button>
      {open ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

function CheckRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-ink/[0.03]">
      <span className="flex items-center gap-2.5">
        <span
          className={cn(
            'grid h-[18px] w-[18px] place-items-center rounded-[6px] border transition-colors',
            checked ? 'border-brand bg-brand text-white' : 'border-surface-border bg-white',
          )}
        >
          {checked ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </span>
        <span className={cn(checked ? 'font-medium text-ink' : 'text-ink-soft')}>{label}</span>
      </span>
      <span className="text-xs text-ink-faint">{count}</span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
    </label>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
        active
          ? 'border-ink bg-ink text-white'
          : 'border-surface-border bg-white text-ink-muted hover:border-ink/30',
      )}
    >
      {label}
    </button>
  );
}

function NumberInput({
  onCommit,
  defaultValue,
  ...props
}: {
  onCommit: (value: string) => void;
  defaultValue?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'defaultValue'>) {
  const [value, setValue] = useState(defaultValue ?? '');
  return (
    <input
      {...props}
      type="number"
      inputMode="numeric"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onCommit(value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
      className="h-10 w-full rounded-lg border border-surface-border bg-white px-3 text-sm focus:border-ink/30 focus:outline-none focus:ring-2 focus:ring-brand/40"
    />
  );
}
