'use client';

import { useMemo, useState } from 'react';
import { computeFinancing, FINANCING_DEFAULTS } from '@/lib/pricing/financing';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function FinancingCalculator({
  price,
  className,
  compact = false,
}: {
  price: number;
  className?: string;
  compact?: boolean;
}) {
  const [downPayment, setDownPayment] = useState(
    Math.round((price * FINANCING_DEFAULTS.defaultDownRate) / 100) * 100,
  );
  const [termMonths, setTermMonths] = useState<number>(FINANCING_DEFAULTS.defaultTerm);

  const minDown = Math.round((price * FINANCING_DEFAULTS.minDownRate) / 100) * 100;
  const maxDown = Math.round((price * 0.6) / 100) * 100;

  const result = useMemo(
    () =>
      computeFinancing({
        price,
        downPayment,
        termMonths,
        annualRate: FINANCING_DEFAULTS.annualRate,
      }),
    [price, downPayment, termMonths],
  );

  return (
    <div className={cn('rounded-2xl border border-surface-border bg-white p-6', className)}>
      {!compact && (
        <div className="mb-6 flex items-baseline justify-between">
          <h3 className="text-lg font-semibold tracking-tight">Kalkulator financimi</h3>
          <span className="text-xs text-ink-faint">
            Interes {(FINANCING_DEFAULTS.annualRate * 100).toFixed(1)}% / vit
          </span>
        </div>
      )}

      <div className="rounded-xl bg-ink p-5 text-white">
        <p className="text-[0.72rem] font-medium uppercase tracking-eyebrow text-white/50">
          Këst mujor i vlerësuar
        </p>
        <p className="mt-1 text-4xl font-semibold tracking-tight">
          {formatPrice(result.monthly)}
          <span className="ml-1 text-base font-normal text-white/60">/ muaj</span>
        </p>
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <label htmlFor="down" className="font-medium text-ink">
              Parapagesa
            </label>
            <span className="font-semibold text-ink">{formatPrice(downPayment)}</span>
          </div>
          <input
            id="down"
            type="range"
            min={minDown}
            max={maxDown}
            step={500}
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            className="ac-range w-full"
          />
          <div className="mt-1 flex justify-between text-xs text-ink-faint">
            <span>{formatPrice(minDown)}</span>
            <span>{formatPrice(maxDown)}</span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-ink">Afati (muaj)</label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {FINANCING_DEFAULTS.terms.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTermMonths(t)}
                className={cn(
                  'rounded-lg border py-2 text-sm font-medium transition-colors',
                  termMonths === t
                    ? 'border-ink bg-ink text-white'
                    : 'border-surface-border text-ink-muted hover:border-ink/30',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <dl className="mt-6 space-y-2 border-t border-surface-border pt-5 text-sm">
        <Row label="Shuma e financuar" value={formatPrice(result.financedAmount)} />
        <Row label="Interesi total" value={formatPrice(result.totalInterest)} />
        <Row label="Total për t’u paguar" value={formatPrice(result.totalPayable)} strong />
      </dl>

      <p className="mt-4 text-xs leading-relaxed text-ink-faint">
        Vlerësim informativ. Kushtet finale përcaktohen nga institucioni financiar partner.
      </p>

      <style>{`
        .ac-range { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 999px; background: #E7E7E9; outline: none; }
        .ac-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 999px; background: #D6001C; cursor: pointer; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(214,0,28,0.4); }
        .ac-range::-moz-range-thumb { width: 20px; height: 20px; border-radius: 999px; background: #D6001C; cursor: pointer; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(214,0,28,0.4); }
      `}</style>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={cn('tabular-nums', strong ? 'font-semibold text-ink' : 'text-ink-soft')}>
        {value}
      </dd>
    </div>
  );
}
