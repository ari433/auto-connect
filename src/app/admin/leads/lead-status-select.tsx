'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { LeadStatus } from '@prisma/client';
import { cn } from '@/lib/utils';
import { leadStatusLabels } from '@/lib/labels';

const STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST'];

export function LeadStatusSelect({
  id,
  status,
}: {
  id: string;
  status: LeadStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState<LeadStatus>(status);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onChange(next: LeadStatus) {
    const prev = value;
    setValue(next);
    setError(false);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error('failed');
      startTransition(() => router.refresh());
    } catch {
      setValue(prev);
      setError(true);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div className="relative">
        <select
          aria-label="Ndrysho statusin"
          value={value}
          disabled={pending}
          onChange={(e) => onChange(e.target.value as LeadStatus)}
          className={cn(
            'h-8 cursor-pointer appearance-none rounded-lg border bg-white pl-2.5 pr-7 text-xs font-medium text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-60',
            error ? 'border-brand' : 'border-surface-border hover:border-ink/30',
          )}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B6B70' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.4rem center',
          }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {leadStatusLabels[s] ?? s}
            </option>
          ))}
        </select>
      </div>
      {pending ? (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
      ) : null}
      {error ? <span className="text-[0.7rem] text-brand">Dështoi</span> : null}
    </div>
  );
}
