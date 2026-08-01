import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { safe } from '@/lib/db-safe';
import { formatMileage, formatNumber, formatPrice, sizedImageUrl } from '@/lib/utils';
import { encarListingUrl } from '@/lib/vehicles/encar';
import { PageHeader, Card, EmptyRow, StatCard } from '../ui';
import { VehicleEditor } from './vehicle-editor';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;

function thumb(images: Prisma.JsonValue): string {
  if (Array.isArray(images) && images.length) {
    const first = images[0] as { url?: string };
    if (first?.url) return sizedImageUrl(first.url, 'card');
  }
  return '';
}

export default async function AdminVehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
  const where: Prisma.VehicleWhereInput = q
    ? {
        OR: [
          { brand: { contains: q, mode: 'insensitive' } },
          { model: { contains: q, mode: 'insensitive' } },
          { variant: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {};

  const { vehicles, total } = await safe(
    async () => {
      const [vehicles, total] = await Promise.all([
        prisma.vehicle.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (p - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          select: {
            id: true, slug: true, brand: true, model: true, variant: true,
            year: true, mileageKm: true, price: true, priceOverride: true,
            landedCostEur: true, sourcePriceKrw: true,
            featured: true, hidden: true, images: true,
          },
        }),
        prisma.vehicle.count({ where }),
      ]);
      return { vehicles, total };
    },
    { vehicles: [], total: 0 },
  );

  // Portfolio totals across every visible vehicle whose real cost is known, so
  // the operator can see total spend, total web value and total profit at a
  // glance (not just the current page).
  const totals = await safe(
    () =>
      prisma.$queryRaw<
        { cost: bigint; web: bigint; profit: bigint; withcost: bigint }[]
      >`
        SELECT
          COALESCE(SUM("landedCostEur"), 0) AS cost,
          COALESCE(SUM(COALESCE("priceOverride", "price")), 0) AS web,
          COALESCE(SUM(COALESCE("priceOverride", "price") - "landedCostEur"), 0) AS profit,
          COUNT(*) AS withcost
        FROM "Vehicle"
        WHERE "hidden" = false AND "landedCostEur" IS NOT NULL
      `.then((rows) => rows[0]),
    undefined,
  );

  const totalCost = totals ? Number(totals.cost) : 0;
  const totalWeb = totals ? Number(totals.web) : 0;
  const totalProfit = totals ? Number(totals.profit) : 0;
  const totalWithCost = totals ? Number(totals.withcost) : 0;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (n: number) => `/admin/vetura?${q ? `q=${encodeURIComponent(q)}&` : ''}page=${n}`;

  return (
    <div>
      <PageHeader
        title="Veturat"
        description="Shikoni çdo veturë dhe ndryshoni çmimin, përzgjidhni ose fshiheni nga faqja. Ndryshimet e çmimit ruhen dhe mbijetojnë sinkronizimet."
        actions={
          <span className="rounded-full bg-ink/[0.05] px-3 py-1.5 text-xs font-medium text-ink-muted">
            {formatNumber(total)} gjithsej
          </span>
        }
      />

      {/* Portfolio totals — real cost vs. web value vs. profit */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Kosto totale"
          value={formatPrice(totalCost)}
          hint={`${formatNumber(totalWithCost)} vetura me kosto`}
        />
        <StatCard
          label="Vlera në web"
          value={formatPrice(totalWeb)}
          hint="Shuma e çmimeve në faqe"
        />
        <StatCard
          label="Fitimi total"
          value={formatPrice(totalProfit)}
          accent={totalProfit > 0}
          hint={
            totalCost > 0 ? `+${Math.round((totalProfit / totalCost) * 100)}% mbi koston` : '—'
          }
        />
        <StatCard
          label="Fitimi mesatar"
          value={formatPrice(totalWithCost > 0 ? Math.round(totalProfit / totalWithCost) : 0)}
          hint="Për veturë"
        />
      </div>

      <form className="mb-5" action="/admin/vetura">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Kërko markë, model ose kod (slug)…"
          className="h-10 w-full max-w-sm rounded-xl border border-surface-border bg-white px-4 text-sm focus:border-ink/30 focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      </form>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-[0.7rem] uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3 font-semibold">Vetura</th>
                <th className="px-4 py-3 font-semibold">Kosto reale</th>
                <th className="px-4 py-3 font-semibold">Çmimi në web</th>
                <th className="px-4 py-3 font-semibold">Fitimi</th>
                <th className="px-4 py-3 font-semibold">Menaxho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {vehicles.length === 0 ? (
                <EmptyRow colSpan={5}>Nuk u gjet asnjë veturë.</EmptyRow>
              ) : (
                vehicles.map((v) => {
                  const img = thumb(v.images);
                  const encar = encarListingUrl(v.images as unknown as { url?: string }[]);
                  const effective = v.priceOverride ?? v.price;
                  const cost = v.landedCostEur;
                  const profit = cost != null ? effective - cost : null;
                  const marginPct =
                    cost != null && cost > 0 ? Math.round(((effective - cost) / cost) * 100) : null;
                  return (
                    <tr key={v.id} className={v.hidden ? 'bg-ink/[0.02] opacity-70' : 'hover:bg-surface-subtle/60'}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-sunken">
                            {img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={img} alt="" className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/vetura/${v.slug}`}
                              target="_blank"
                              className="font-medium text-ink hover:text-brand"
                            >
                              {v.brand} {v.model}
                            </Link>
                            <div className="text-xs text-ink-faint">
                              {v.year} · {formatMileage(v.mileageKm)}
                              {v.variant ? ` · ${v.variant}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {cost != null ? (
                          <div className="font-semibold tabular-nums text-ink">{formatPrice(cost)}</div>
                        ) : (
                          <div className="text-ink-faint">—</div>
                        )}
                        {v.sourcePriceKrw != null ? (
                          <div className="text-[0.7rem] text-ink-faint tabular-nums">
                            Koreja: {formatNumber(v.sourcePriceKrw)} ₩
                          </div>
                        ) : null}
                        {encar ? (
                          <a
                            href={encar}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-[0.7rem] font-medium text-amber-700 hover:underline"
                          >
                            🔗 Hap në Encar
                          </a>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold tabular-nums text-ink">{formatPrice(effective)}</div>
                        {v.priceOverride != null ? (
                          <div className="text-[0.7rem] text-brand">manual (auto: {formatPrice(v.price)})</div>
                        ) : (
                          <div className="text-[0.7rem] text-ink-faint">automatik</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {profit != null ? (
                          <>
                            <div
                              className={`font-semibold tabular-nums ${profit >= 0 ? 'text-emerald-600' : 'text-brand'}`}
                            >
                              {profit >= 0 ? '+' : ''}
                              {formatPrice(profit)}
                            </div>
                            {marginPct != null ? (
                              <div className="text-[0.7rem] text-ink-faint">{marginPct >= 0 ? '+' : ''}{marginPct}% mbi koston</div>
                            ) : null}
                          </>
                        ) : (
                          <div className="text-ink-faint">—</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <VehicleEditor
                          id={v.id}
                          sourcePrice={v.price}
                          priceOverride={v.priceOverride}
                          featured={v.featured}
                          hidden={v.hidden}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 ? (
        <div className="mt-5 flex items-center justify-between text-sm">
          <span className="text-ink-faint">Faqja {p} nga {totalPages}</span>
          <div className="flex gap-2">
            {p > 1 ? (
              <Link href={qs(p - 1)} className="rounded-lg border border-surface-border px-3 py-1.5 text-ink-muted hover:border-ink/30">
                ← E mëparshme
              </Link>
            ) : null}
            {p < totalPages ? (
              <Link href={qs(p + 1)} className="rounded-lg border border-surface-border px-3 py-1.5 text-ink-muted hover:border-ink/30">
                Tjetra →
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
