import Link from 'next/link';
import type { LeadStatus } from '@prisma/client';
import { safe } from '@/lib/db-safe';
import { listLeads, getLeadStats } from '@/lib/leads/service';
import { leadStatusLabels } from '@/lib/labels';
import { formatNumber, cn } from '@/lib/utils';
import {
  PageHeader,
  Card,
  LeadStatusPill,
  EmptyRow,
  leadSourceLabels,
  formatDateTime,
} from '../ui';
import { LeadStatusSelect } from './lead-status-select';

export const dynamic = 'force-dynamic';

const STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST'];

function isLeadStatus(v: string | undefined): v is LeadStatus {
  return v !== undefined && (STATUSES as string[]).includes(v);
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = isLeadStatus(status) ? status : undefined;

  const [leads, stats] = await Promise.all([
    safe(() => listLeads(active), []),
    safe(() => getLeadStats(), { total: 0, byStatus: {} as Record<string, number> }),
  ]);

  return (
    <div>
      <PageHeader
        title="Kërkesat"
        description="Menaxhoni kërkesat e klientëve dhe përditësoni statusin e tyre."
        actions={
          <span className="rounded-full bg-ink/[0.05] px-3 py-1.5 text-xs font-medium text-ink-muted">
            {formatNumber(leads.length)} të shfaqura
          </span>
        }
      />

      {/* Filter chips */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <FilterChip
          href="/admin/leads"
          label="Të gjitha"
          count={stats.total}
          active={!active}
        />
        {STATUSES.map((s) => (
          <FilterChip
            key={s}
            href={`/admin/leads?status=${s}`}
            label={leadStatusLabels[s] ?? s}
            count={stats.byStatus[s] ?? 0}
            active={active === s}
          />
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-[0.7rem] uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3 font-semibold">Klienti</th>
                <th className="px-4 py-3 font-semibold">Kontakti</th>
                <th className="px-4 py-3 font-semibold">Burimi</th>
                <th className="px-4 py-3 font-semibold">Vetura</th>
                <th className="px-4 py-3 font-semibold">Shënime</th>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Statusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {leads.length === 0 ? (
                <EmptyRow colSpan={7}>Nuk u gjet asnjë kërkesë me këtë filtër.</EmptyRow>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="align-top hover:bg-surface-subtle/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{lead.name}</div>
                      <div className="mt-0.5">
                        <LeadStatusPill
                          status={lead.status}
                          label={leadStatusLabels[lead.status] ?? lead.status}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="tabular-nums text-ink">{lead.phone}</div>
                      {lead.email ? (
                        <div className="mt-0.5 text-xs text-ink-faint">{lead.email}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {leadSourceLabels[lead.source]}
                    </td>
                    <td className="px-4 py-3">
                      {lead.vehicle ? (
                        <Link
                          href={`/vetura/${lead.vehicle.slug}`}
                          className="font-medium text-ink hover:text-brand"
                        >
                          {lead.vehicle.brand} {lead.vehicle.model}
                        </Link>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      {lead.notes || lead.message ? (
                        <p className="line-clamp-2 text-xs text-ink-muted">
                          {lead.notes ?? lead.message}
                        </p>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-faint">
                      {formatDateTime(lead.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <LeadStatusSelect id={lead.id} status={lead.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function FilterChip({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-ink bg-ink text-white'
          : 'border-surface-border bg-white text-ink-muted hover:border-ink/30 hover:text-ink',
      )}
    >
      {label}
      <span
        className={cn(
          'rounded-full px-1.5 py-0.5 text-[0.65rem] tabular-nums',
          active ? 'bg-white/20 text-white' : 'bg-ink/[0.06] text-ink-muted',
        )}
      >
        {formatNumber(count)}
      </span>
    </Link>
  );
}
