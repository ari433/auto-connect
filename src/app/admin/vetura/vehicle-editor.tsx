'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

/** Inline admin controls for one vehicle: custom price, feature, hide. */
export function VehicleEditor({
  id,
  sourcePrice,
  priceOverride,
  featured,
  hidden,
}: {
  id: string;
  sourcePrice: number;
  priceOverride: number | null;
  featured: boolean;
  hidden: boolean;
}) {
  const router = useRouter();
  const [price, setPrice] = useState(String(priceOverride ?? sourcePrice));
  const [fav, setFav] = useState(featured);
  const [hid, setHid] = useState(hidden);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState(false);

  async function patch(body: Record<string, unknown>): Promise<boolean> {
    setErr(false);
    try {
      const res = await fetch(`/api/admin/vehicles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('failed');
      return true;
    } catch {
      setErr(true);
      return false;
    }
  }

  async function savePrice() {
    const n = parseInt(price.replace(/[^\d]/g, ''), 10);
    if (!n || n <= 0) {
      setErr(true);
      return;
    }
    if (await patch({ priceOverride: n })) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      start(() => router.refresh());
    }
  }

  async function resetPrice() {
    if (await patch({ priceOverride: null })) {
      setPrice(String(sourcePrice));
      start(() => router.refresh());
    }
  }

  async function toggle(field: 'featured' | 'hidden', value: boolean) {
    if (field === 'featured') setFav(value);
    else setHid(value);
    if (!(await patch({ [field]: value }))) {
      if (field === 'featured') setFav(!value);
      else setHid(!value);
    } else {
      start(() => router.refresh());
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center rounded-lg border border-surface-border bg-white">
        <span className="pl-2 text-sm text-ink-faint">€</span>
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          inputMode="numeric"
          aria-label="Çmimi"
          className="h-8 w-24 bg-transparent px-1 text-sm tabular-nums focus:outline-none"
        />
      </div>
      <button
        type="button"
        onClick={savePrice}
        disabled={pending}
        className="h-8 rounded-lg bg-ink px-3 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        Ruaj
      </button>
      {priceOverride != null ? (
        <button
          type="button"
          onClick={resetPrice}
          className="h-8 rounded-lg border border-surface-border px-2 text-xs text-ink-muted hover:border-ink/30"
          title="Kthe te çmimi automatik"
        >
          Rikthe
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => toggle('featured', !fav)}
        className={cn(
          'h-8 rounded-lg border px-2.5 text-xs font-medium transition-colors',
          fav ? 'border-brand bg-brand/10 text-brand' : 'border-surface-border text-ink-muted hover:border-ink/30',
        )}
      >
        {fav ? '★ Përzgjedhur' : '☆ Përzgjidh'}
      </button>
      <button
        type="button"
        onClick={() => toggle('hidden', !hid)}
        className={cn(
          'h-8 rounded-lg border px-2.5 text-xs font-medium transition-colors',
          hid ? 'border-ink bg-ink text-white' : 'border-surface-border text-ink-muted hover:border-ink/30',
        )}
      >
        {hid ? 'E fshehur' : 'Fshih'}
      </button>
      {saved ? <span className="text-xs text-emerald-600">✓ U ruajt</span> : null}
      {err ? <span className="text-xs text-brand">Gabim</span> : null}
    </div>
  );
}
