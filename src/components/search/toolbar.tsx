'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SORT_OPTIONS } from '@/lib/search/query';
import { sortLabels } from '@/lib/labels';

/**
 * Inventory toolbar — sort only. Free-text search was removed in favour of the
 * always-open dropdown filters, so browsing is driven purely by the filters.
 */
export function SearchSortBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const update = (value: string) => {
    const next = new URLSearchParams(params.toString());
    next.set('sort', value);
    next.delete('page');
    startTransition(() => router.push(`/inventari?${next.toString()}`, { scroll: false }));
  };

  return (
    <div className="flex items-center justify-end">
      <div className="relative">
        <select
          value={params.get('sort') ?? 'newest'}
          onChange={(e) => update(e.target.value)}
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
