'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SyncResult {
  status: 'SUCCESS' | 'FAILED';
  fetched: number;
  created: number;
  updated: number;
  removed: number;
  message?: string;
}

const metrics: { key: keyof SyncResult; label: string }[] = [
  { key: 'fetched', label: 'Marrë' },
  { key: 'created', label: 'Krijuar' },
  { key: 'updated', label: 'Përditësuar' },
  { key: 'removed', label: 'Hequr' },
];

export function SyncTrigger() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      if (res.status === 401) {
        setError('I paautorizuar. Kërkohet token administrimi për të nisur sinkronizimin.');
        return;
      }
      const data = (await res.json()) as SyncResult & { error?: string };
      if (!res.ok || data.status === 'FAILED') {
        setError(data.message || data.error || 'Sinkronizimi dështoi. Provoni përsëri.');
        setResult(data.status ? data : null);
        return;
      }
      setResult(data);
      startTransition(() => router.refresh());
    } catch {
      setError('Nuk u arrit lidhja me serverin. Provoni përsëri.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      <Button onClick={run} disabled={loading} size="sm">
        <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
        {loading ? 'Duke sinkronizuar…' : 'Sinko tani'}
      </Button>

      {result && !error ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Përfundoi
          </span>
          {metrics.map((m) => (
            <span
              key={m.key}
              className="rounded-full bg-ink/[0.05] px-2.5 py-1 text-xs text-ink-muted"
            >
              {m.label}:{' '}
              <span className="font-semibold tabular-nums text-ink">
                {result[m.key] as number}
              </span>
            </span>
          ))}
        </div>
      ) : null}

      {error ? (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand/10 px-3 py-1.5 text-sm font-medium text-brand">
          <AlertTriangle className="h-4 w-4" /> {error}
        </span>
      ) : null}
    </div>
  );
}
