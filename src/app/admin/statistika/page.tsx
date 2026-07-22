import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { safe } from '@/lib/db-safe';
import { formatNumber } from '@/lib/utils';
import {
  getAnalyticsSummary,
  getDailySeries,
  getTopPaths,
  getTopVehicles,
  type AnalyticsSummary,
} from '@/lib/analytics/service';
import { PageHeader, StatCard, Card, CardHeader, EmptyRow } from '../ui';

export const dynamic = 'force-dynamic';

const EMPTY_SUMMARY: AnalyticsSummary = {
  today: { views: 0, visitors: 0 },
  last7: { views: 0, visitors: 0 },
  last30: { views: 0, visitors: 0 },
  totalViews: 0,
};

const dayFormatter = new Intl.DateTimeFormat('sq-AL', { day: 'numeric', month: 'short' });

export default async function StatistikaPage() {
  const [summary, series, topVehicles, topPaths] = await Promise.all([
    safe(() => getAnalyticsSummary(), EMPTY_SUMMARY),
    safe(() => getDailySeries(14), []),
    safe(() => getTopVehicles(30, 8), []),
    safe(() => getTopPaths(30, 8), []),
  ]);

  const maxViews = series.reduce((m, d) => Math.max(m, d.views), 0) || 1;
  const maxVehViews = topVehicles.reduce((m, v) => Math.max(m, v.views), 0) || 1;

  return (
    <div>
      <PageHeader
        title="Statistika e vizitorëve"
        description="Sa persona kanë hyrë në faqe, çka po shikojnë më së shumti dhe si po ecën trafiku."
      />

      {/* Headline numbers */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Vizitorë sot"
          value={formatNumber(summary.today.visitors)}
          accent={summary.today.visitors > 0}
          hint={`${formatNumber(summary.today.views)} shikime`}
        />
        <StatCard
          label="Vizitorë (7 ditë)"
          value={formatNumber(summary.last7.visitors)}
          hint={`${formatNumber(summary.last7.views)} shikime`}
        />
        <StatCard
          label="Vizitorë (30 ditë)"
          value={formatNumber(summary.last30.visitors)}
          hint={`${formatNumber(summary.last30.views)} shikime`}
        />
        <StatCard
          label="Shikime sot"
          value={formatNumber(summary.today.views)}
          hint="Faqe të hapura sot"
        />
        <StatCard
          label="Shikime gjithsej"
          value={formatNumber(summary.totalViews)}
          hint="Që nga fillimi"
        />
      </div>

      {/* 14-day trend */}
      <Card className="mt-6">
        <CardHeader title="14 ditët e fundit" meta="Shikime për ditë" />
        <div className="p-5">
          <div className="flex h-40 items-end gap-1.5">
            {series.map((d) => (
              <div key={d.date} className="group flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-brand/80 transition-colors group-hover:bg-brand"
                    style={{ height: `${Math.max(2, (d.views / maxViews) * 100)}%` }}
                    title={`${dayFormatter.format(new Date(d.date))}: ${d.views} shikime, ${d.visitors} vizitorë`}
                  />
                </div>
                <span className="text-[0.6rem] tabular-nums text-ink-faint">
                  {dayFormatter.format(new Date(d.date)).replace('.', '')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Most-viewed vehicles */}
        <Card>
          <CardHeader title="Veturat më të shikuara" meta="30 ditët e fundit" />
          <div className="space-y-3 p-5">
            {topVehicles.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-faint">Ende asnjë shikim.</p>
            ) : (
              topVehicles.map((v) => (
                <div key={v.slug}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <Link
                      href={`/vetura/${v.slug}`}
                      className="inline-flex items-center gap-1 font-medium text-ink hover:text-brand"
                    >
                      {v.name}
                      <ArrowUpRight className="h-3 w-3 text-ink-faint" />
                    </Link>
                    <span className="tabular-nums text-ink-muted">{formatNumber(v.views)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${(v.views / maxVehViews) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Most-viewed pages */}
        <Card>
          <CardHeader title="Faqet më të vizituara" meta="30 ditët e fundit" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-[0.7rem] uppercase tracking-wide text-ink-faint">
                  <th className="px-5 py-2.5 font-semibold">Faqja</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Shikime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {topPaths.length === 0 ? (
                  <EmptyRow colSpan={2}>Ende asnjë shikim.</EmptyRow>
                ) : (
                  topPaths.map((p) => (
                    <tr key={p.path} className="hover:bg-surface-subtle/60">
                      <td className="max-w-0 truncate px-5 py-3 text-ink-muted">
                        <Link href={p.path} className="hover:text-brand">
                          {p.path}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-ink">
                        {formatNumber(p.views)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
