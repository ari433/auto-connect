import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { safe } from '@/lib/db-safe';
import { getLeadStats } from '@/lib/leads/service';
import { leadStatusLabels } from '@/lib/labels';
import { formatPrice, formatNumber } from '@/lib/utils';
import type { LeadStatus } from '@prisma/client';
import {
  PageHeader,
  StatCard,
  Card,
  CardHeader,
  LeadStatusPill,
  EmptyRow,
  leadSourceLabels,
  formatDateTime,
} from './ui';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [
    totalVehicles,
    availableVehicles,
    leadStats,
    priceAgg,
    lastSync,
    latestLeads,
    byBrand,
  ] = await Promise.all([
    safe(() => prisma.vehicle.count(), 0),
    safe(() => prisma.vehicle.count({ where: { status: 'AVAILABLE' } }), 0),
    safe(() => getLeadStats(), { total: 0, byStatus: {} as Record<string, number> }),
    safe(
      () => prisma.vehicle.aggregate({ _sum: { price: true } }),
      { _sum: { price: null } },
    ),
    safe(
      () => prisma.syncRun.findFirst({ orderBy: { startedAt: 'desc' } }),
      null,
    ),
    safe(
      () =>
        prisma.lead.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { vehicle: { select: { brand: true, model: true } } },
        }),
      [],
    ),
    safe(
      () =>
        prisma.vehicle.groupBy({
          by: ['brand'],
          _count: { _all: true },
          orderBy: { _count: { brand: 'desc' } },
          take: 8,
        }),
      [],
    ),
  ]);

  const newLeads = leadStats.byStatus['NEW'] ?? 0;
  const catalogueValue = priceAgg._sum.price ?? 0;
  const maxBrandCount = byBrand.reduce((m, b) => Math.max(m, b._count._all), 0) || 1;

  const syncStatusText = lastSync
    ? lastSync.status === 'SUCCESS'
      ? 'Sukses'
      : lastSync.status === 'FAILED'
        ? 'Dështoi'
        : 'Në ecuri'
    : 'Asnjë';

  return (
    <div>
      <PageHeader
        title="Përmbledhje"
        description="Pamje e përgjithshme e inventarit, kërkesave dhe sinkronizimit të fundit."
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Vetura gjithsej"
          value={formatNumber(totalVehicles)}
          hint={`${formatNumber(availableVehicles)} të disponueshme`}
        />
        <StatCard
          label="Të disponueshme"
          value={formatNumber(availableVehicles)}
          hint={
            totalVehicles > 0
              ? `${Math.round((availableVehicles / totalVehicles) * 100)}% e katalogut`
              : '—'
          }
        />
        <StatCard
          label="Kërkesa gjithsej"
          value={formatNumber(leadStats.total)}
          hint={`${formatNumber(newLeads)} të reja`}
        />
        <StatCard
          label="Kërkesa të reja"
          value={formatNumber(newLeads)}
          accent={newLeads > 0}
          hint="Presin kontaktim"
        />
        <StatCard
          label="Sinkronizimi i fundit"
          value={syncStatusText}
          hint={lastSync ? formatDateTime(lastSync.startedAt) : 'Ende pa sinkronizim'}
        />
        <StatCard
          label="Vlera e katalogut"
          value={formatPrice(catalogueValue)}
          hint="Shuma e çmimeve"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Latest leads */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Kërkesat e fundit"
            meta={
              <Link
                href="/admin/leads"
                className="inline-flex items-center gap-1 font-medium text-ink hover:text-brand"
              >
                Të gjitha <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-[0.7rem] uppercase tracking-wide text-ink-faint">
                  <th className="px-5 py-2.5 font-semibold">Emri</th>
                  <th className="px-5 py-2.5 font-semibold">Telefoni</th>
                  <th className="px-5 py-2.5 font-semibold">Burimi</th>
                  <th className="px-5 py-2.5 font-semibold">Statusi</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {latestLeads.length === 0 ? (
                  <EmptyRow colSpan={5}>Ende asnjë kërkesë.</EmptyRow>
                ) : (
                  latestLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-surface-subtle/60">
                      <td className="px-5 py-3 font-medium text-ink">{lead.name}</td>
                      <td className="px-5 py-3 tabular-nums text-ink-muted">{lead.phone}</td>
                      <td className="px-5 py-3 text-ink-muted">
                        {leadSourceLabels[lead.source]}
                      </td>
                      <td className="px-5 py-3">
                        <LeadStatusPill
                          status={lead.status}
                          label={leadStatusLabels[lead.status] ?? lead.status}
                        />
                      </td>
                      <td className="px-5 py-3 text-right text-ink-faint">
                        {formatDateTime(lead.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Inventory by brand */}
        <Card>
          <CardHeader title="Inventari sipas markës" />
          <div className="space-y-3 p-5">
            {byBrand.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-faint">Nuk ka të dhëna.</p>
            ) : (
              byBrand.map((b) => (
                <div key={b.brand}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{b.brand}</span>
                    <span className="tabular-nums text-ink-muted">
                      {formatNumber(b._count._all)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${(b._count._all / maxBrandCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Lead status distribution */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {(['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST'] as LeadStatus[]).map((s) => (
          <Card key={s} className="flex items-center justify-between p-4">
            <LeadStatusPill status={s} label={leadStatusLabels[s] ?? s} />
            <span className="text-lg font-semibold tabular-nums text-ink">
              {formatNumber(leadStats.byStatus[s] ?? 0)}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
