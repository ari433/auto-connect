import { prisma } from '@/lib/prisma';
import { safe } from '@/lib/db-safe';
import { formatNumber } from '@/lib/utils';
import {
  PageHeader,
  Card,
  CardHeader,
  SyncStatusPill,
  EmptyRow,
  formatDateTime,
  formatDuration,
} from '../ui';
import { SyncTrigger } from './sync-trigger';

export const dynamic = 'force-dynamic';

export default async function AdminSyncPage() {
  const runs = await safe(
    () =>
      prisma.syncRun.findMany({
        orderBy: { startedAt: 'desc' },
        take: 20,
      }),
    [],
  );

  const lastSuccess = runs.find((r) => r.status === 'SUCCESS') ?? null;
  const totalRuns = runs.length;
  const failedRuns = runs.filter((r) => r.status === 'FAILED').length;

  return (
    <div>
      <PageHeader
        title="Sinkronizimi"
        description="Sinkronizimi tërheq feed-in e drejtpërdrejtë të furnizuesit të inventarit dhe përditëson katalogun — krijon vetura të reja, përditëson ekzistueset dhe heq ato që nuk ofrohen më."
      />

      {/* Trigger + config */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Nis sinkronizimin" />
          <div className="p-5">
            <SyncTrigger />
            <p className="mt-3 text-xs text-ink-faint">
              Procesi mund të zgjasë disa sekonda. Faqja përditësohet automatikisht pas
              përfundimit.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Gjendja" />
          <dl className="divide-y divide-surface-border text-sm">
            <div className="flex items-center justify-between px-5 py-3">
              <dt className="text-ink-muted">Sinkronizime të fundit</dt>
              <dd className="font-semibold tabular-nums text-ink">
                {formatNumber(totalRuns)}
              </dd>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <dt className="text-ink-muted">Të dështuara</dt>
              <dd className="font-semibold tabular-nums text-ink">
                {formatNumber(failedRuns)}
              </dd>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <dt className="text-ink-muted">Sukse i fundit</dt>
              <dd className="text-right text-xs text-ink">
                {lastSuccess ? formatDateTime(lastSuccess.startedAt) : '—'}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* History table */}
      <Card className="mt-6">
        <CardHeader
          title="Historiku i sinkronizimeve"
          meta={`${formatNumber(totalRuns)} regjistrime`}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-[0.7rem] uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3 font-semibold">Statusi</th>
                <th className="px-4 py-3 font-semibold">Furnizuesi</th>
                <th className="px-4 py-3 text-right font-semibold">Marrë</th>
                <th className="px-4 py-3 text-right font-semibold">Krijuar</th>
                <th className="px-4 py-3 text-right font-semibold">Përditësuar</th>
                <th className="px-4 py-3 text-right font-semibold">Hequr</th>
                <th className="px-4 py-3 font-semibold">Nisur</th>
                <th className="px-4 py-3 text-right font-semibold">Kohëzgjatja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {runs.length === 0 ? (
                <EmptyRow colSpan={8}>Ende asnjë sinkronizim i regjistruar.</EmptyRow>
              ) : (
                runs.map((run) => (
                  <tr key={run.id} className="align-top hover:bg-surface-subtle/60">
                    <td className="px-4 py-3">
                      <SyncStatusPill status={run.status} />
                      {run.status === 'FAILED' && run.message ? (
                        <p className="mt-1 max-w-[240px] text-xs text-brand/80">
                          {run.message}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{run.provider}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink">
                      {formatNumber(run.fetched)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-700">
                      {run.created > 0 ? `+${formatNumber(run.created)}` : '0'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink">
                      {formatNumber(run.updated)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-muted">
                      {run.removed > 0 ? `−${formatNumber(run.removed)}` : '0'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-faint">
                      {formatDateTime(run.startedAt)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-muted">
                      {formatDuration(run.startedAt, run.finishedAt)}
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
