'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';

export function AdminLogin() {
  const [token, setToken] = useState('');
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(false);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error('bad');
      window.location.reload();
    } catch {
      setError(true);
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-surface-border bg-white p-6 shadow-card sm:p-8">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-white">
        <Lock className="h-5 w-5" />
      </span>
      <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">Hyr në panel</h1>
      <p className="mt-1 text-sm text-ink-muted">Fut fjalëkalimin e administrimit për të vazhduar.</p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Fjalëkalimi i adminit"
          autoFocus
          className="h-11 w-full rounded-xl border border-surface-border bg-white px-4 text-sm focus:border-ink/30 focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        <button
          type="submit"
          disabled={pending || !token}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-6 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {pending ? 'Duke hyrë…' : 'Hyr'}
        </button>
        {error ? (
          <p className="text-sm text-brand">Fjalëkalim i pasaktë. Provo përsëri.</p>
        ) : null}
      </form>
    </div>
  );
}
