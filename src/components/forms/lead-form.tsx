'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';

type Source = 'VEHICLE_INQUIRY' | 'FINANCING' | 'CONTACT_FORM' | 'CALLBACK';

export function LeadForm({
  source,
  vehicleSlug,
  downPayment,
  termMonths,
  defaultMessage,
  submitLabel = 'Dërgo kërkesën',
  title,
  description,
}: {
  source: Source;
  vehicleSlug?: string;
  downPayment?: number;
  termMonths?: number;
  defaultMessage?: string;
  submitLabel?: string;
  title?: string;
  description?: string;
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          phone: data.get('phone'),
          email: data.get('email') || undefined,
          message: data.get('message') || undefined,
          source,
          vehicleSlug,
          downPayment,
          termMonths,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Diçka shkoi keq');
      }
      setStatus('success');
      form.reset();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Diçka shkoi keq');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-600 text-white">
          <Check className="h-6 w-6" />
        </span>
        <h3 className="text-lg font-semibold text-ink">Faleminderit!</h3>
        <p className="text-sm text-ink-muted">
          Kërkesa juaj u dërgua me sukses. Ekipi i AUTO CONNECT do t’ju kontaktojë së shpejti.
        </p>
        <Button variant="outline" size="sm" onClick={() => setStatus('idle')}>
          Dërgo një tjetër
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {title ? (
        <div className="mb-2">
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Emri dhe mbiemri" htmlFor="name">
          <Input id="name" name="name" required placeholder="p.sh. Arben Krasniqi" />
        </Field>
        <Field label="Telefoni" htmlFor="phone">
          <Input id="phone" name="phone" required inputMode="tel" placeholder="p.sh. 045 000 000" />
        </Field>
      </div>

      <Field label="Email (opsional)" htmlFor="email">
        <Input id="email" name="email" type="email" placeholder="ju@example.com" />
      </Field>

      <Field label="Mesazhi" htmlFor="message">
        <Textarea
          id="message"
          name="message"
          defaultValue={defaultMessage}
          placeholder="Si mund t’ju ndihmojmë?"
        />
      </Field>

      {error ? <p className="text-sm text-brand">{error}</p> : null}

      <Button type="submit" size="lg" className="w-full" disabled={status === 'loading'}>
        {status === 'loading' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Duke dërguar…
          </>
        ) : (
          submitLabel
        )}
      </Button>
      <p className="text-center text-xs text-ink-faint">
        Duke dërguar, ju pranoni që të kontaktoheni nga AUTO CONNECT.
      </p>
    </form>
  );
}
