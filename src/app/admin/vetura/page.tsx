import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { safe } from '@/lib/db-safe';
import { formatMileage, formatNumber, formatPrice, sizedImageUrl } from '@/lib/utils';
import { PageHeader, Card, EmptyRow } from '../ui';
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
            featured: true, hidden: true, images: true,
          },
        }),
        prisma.vehicle.count({ where }),
      ]);
      return { vehicles, total };
    },
    { vehicles: [], total: 0 },
  );

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

      <form className="mb-5" action="/admin/vetura">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Kërko markë ose model…"
          className="h-10 w-full max-w-sm rounded-xl border border-surface-border bg-white px-4 text-sm focus:border-ink/30 focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      </form>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-[0.7rem] uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3 font-semibold">Vetura</th>
                <th className="px-4 py-3 font-semibold">Çmimi aktual</th>
                <th className="px-4 py-3 font-semibold">Menaxho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {vehicles.length === 0 ? (
                <EmptyRow colSpan={3}>Nuk u gjet asnjë veturë.</EmptyRow>
              ) : (
                vehicles.map((v) => {
                  const img = thumb(v.images);
                  const effective = v.priceOverride ?? v.price;
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
                        <div className="font-semibold tabular-nums text-ink">{formatPrice(effective)}</div>
                        {v.priceOverride != null ? (
                          <div className="text-[0.7rem] text-brand">manual (auto: {formatPrice(v.price)})</div>
                        ) : (
                          <div className="text-[0.7rem] text-ink-faint">automatik</div>
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
