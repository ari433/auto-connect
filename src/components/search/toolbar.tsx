'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { SORT_OPTIONS } from '@/lib/search/query';
import { sortLabels } from '@/lib/labels';

export function SearchSortBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(params.get('q') ?? '');

  const update = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    next.delete('page');
    startTransition(() => router.push(`/inventari?${next.toString()}`, { scroll: false }));
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update((p) => (q ? p.set('q', q) : p.delete('q')));
        }}
        className="relative flex-1"
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Kërko markë, model, ngjyrë…"
          className="h-11 w-full rounded-full border border-surface-border bg-white pl-11 pr-4 text-sm focus:border-ink/30 focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      </form>

      <div className="relative">
        <select
          value={params.get('sort') ?? 'newest'}
          onChange={(e) => update((p) => p.set('sort', e.target.value))}
          className="h-11 appearance-none rounded-full border border-surface-border bg-white pl-4 pr-10 text-sm font-medium focus:border-ink/30 focus:outline-none focus:ring-2 focus:ring-brand/40"
          aria-label="Rendit"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {sortLabels[s]}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-faint">
          ▾
        </span>
      </div>
    </div>
  );
}
