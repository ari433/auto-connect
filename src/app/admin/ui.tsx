import type { ReactNode } from 'react';
import type { LeadSource, LeadStatus, SyncStatus } from '@prisma/client';
import { cn } from '@/lib/utils';

/** Local admin-only source labels (no customer-facing equivalent exists). */
export const leadSourceLabels: Record<LeadSource, string> = {
  VEHICLE_INQUIRY: 'Interesim për veturë',
  FINANCING: 'Financim',
  CONTACT_FORM: 'Formular kontakti',
  ASSISTANT: 'Asistenti',
  CALLBACK: 'Kthim telefonate',
};

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-surface-border bg-white shadow-card',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  meta,
}: {
  title: string;
  meta?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-surface-border px-5 py-3.5">
      <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
      {meta ? <div className="text-xs text-ink-faint">{meta}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: boolean;
}) {
  return (
    <Card className="p-4">
      <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </p>
      <p
        className={cn(
          'mt-2 text-2xl font-semibold tracking-tight tabular-nums',
          accent ? 'text-brand' : 'text-ink',
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </Card>
  );
}

/* ---------- Status pills ---------- */

const leadStatusTones: Record<LeadStatus, string> = {
  NEW: 'bg-brand/10 text-brand ring-brand/20',
  CONTACTED: 'bg-blue-50 text-blue-700 ring-blue-200',
  QUALIFIED: 'bg-violet-50 text-violet-700 ring-violet-200',
  WON: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  LOST: 'bg-ink/[0.06] text-ink-muted ring-ink/10',
};

export function LeadStatusPill({ status, label }: { status: LeadStatus; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold ring-1 ring-inset',
        leadStatusTones[status],
      )}
    >
      {label}
    </span>
  );
}

const syncStatusTones: Record<SyncStatus, string> = {
  SUCCESS: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  FAILED: 'bg-brand/10 text-brand ring-brand/20',
  RUNNING: 'bg-amber-50 text-amber-700 ring-amber-200',
};

const syncStatusLabels: Record<SyncStatus, string> = {
  SUCCESS: 'Sukses',
  FAILED: 'Dështoi',
  RUNNING: 'Në ecuri',
};

export function SyncStatusPill({ status }: { status: SyncStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold ring-1 ring-inset',
        syncStatusTones[status],
      )}
    >
      {status === 'RUNNING' ? (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
      ) : null}
      {syncStatusLabels[status]}
    </span>
  );
}

/* ---------- Time helpers ---------- */

const dateTimeFormatter = new Intl.DateTimeFormat('sq-AL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDateTime(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return dateTimeFormatter.format(d);
}

/** Human duration between two instants, e.g. "3.4s" or "1m 12s". */
export function formatDuration(start: Date, end: Date | null): string {
  if (!end) return '—';
  const ms = end.getTime() - start.getTime();
  if (ms < 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return `${m}m ${rem}s`;
}

/** Empty-state row spanning a table. */
export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-ink-faint">
        {children}
      </td>
    </tr>
  );
}
