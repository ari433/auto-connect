import type { Metadata } from 'next';
import { parseVehicleQuery } from '@/lib/search/query';
import { getFacets, searchVehicles } from '@/lib/catalog';
import { safe } from '@/lib/db-safe';
import { ButtonLink } from '@/components/ui/button';
import { InventoryFilters } from '@/components/search/filters';
import { SearchSortBar } from '@/components/search/toolbar';
import { Pagination } from '@/components/search/pagination';
import { VehicleGrid, EmptyState } from '@/components/vehicle/vehicle-grid';
import type { Facets, VehicleListResult } from '@/types/vehicle';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Inventari',
  description:
    'Shfletoni inventarin e plotë të AUTO CONNECT — vetura premium të importuara nga Koreja e Jugut, me çmime transparente dhe filtrim të avancuar.',
  alternates: { canonical: '/inventari' },
};

const EMPTY_FACETS: Facets = {
  brands: [],
  bodyTypes: [],
  fuels: [],
  transmissions: [],
  drives: [],
  colors: [],
  priceRange: { min: 0, max: 0 },
  yearRange: { min: 2015, max: 2026 },
};

const EMPTY_RESULT: VehicleListResult = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 12,
  totalPages: 1,
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const query = parseVehicleQuery(raw);

  const [facets, result] = await Promise.all([
    safe(() => getFacets(), EMPTY_FACETS),
    safe(() => searchVehicles(query), EMPTY_RESULT),
  ]);

  const hasQuery = Boolean(raw.q);
  const from = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const to = Math.min(result.page * result.pageSize, result.total);

  return (
    <>
      <section className="border-b border-surface-border bg-white">
        <div className="container py-12 md:py-16">
          <p className="eyebrow mb-4">
            <span className="h-px w-6 bg-brand" aria-hidden />
            Inventari
          </p>
          <h1 className="text-display-md">
            {hasQuery ? (
              <>Rezultatet për “{raw.q as string}”</>
            ) : (
              <>Të gjitha veturat</>
            )}
          </h1>
          <p className="mt-3 max-w-xl text-ink-muted">
            {result.total > 0
              ? `${result.total} vetura të disponueshme, të gatshme për ju.`
              : 'Përzgjedhje premium e importuar nga Koreja e Jugut.'}
          </p>
        </div>
      </section>

      <section className="bg-surface-subtle py-10 md:py-14">
        <div className="container">
          <div className="mb-8">
            <SearchSortBar />
          </div>

          <div className="grid gap-8 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr]">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-surface-border bg-white p-6">
                <InventoryFilters facets={facets} total={result.total} />
              </div>
            </div>

            <div>
              {result.items.length > 0 ? (
                <>
                  <div className="mb-5 hidden items-center justify-between lg:flex">
                    <p className="text-sm text-ink-muted">
                      Duke shfaqur <span className="font-medium text-ink">{from}–{to}</span> nga{' '}
                      <span className="font-medium text-ink">{result.total}</span>
                    </p>
                  </div>
                  <VehicleGrid vehicles={result.items} priorityCount={3} />
                  <div className="mt-12">
                    <Pagination
                      page={result.page}
                      totalPages={result.totalPages}
                      searchParams={raw}
                    />
                  </div>
                </>
              ) : (
                <EmptyState
                  title="Asnjë veturë nuk përputhet"
                  description="Provoni të hiqni disa filtra ose ndryshoni kërkimin. Nëse kërkoni diçka specifike, na kontaktoni dhe do ta gjejmë për ju."
                  action={
                    <div className="flex flex-wrap justify-center gap-3">
                      <ButtonLink href="/inventari" variant="dark">
                        Pastro filtrat
                      </ButtonLink>
                      <ButtonLink href="/asistenti" variant="outline">
                        Pyet asistentin
                      </ButtonLink>
                    </div>
                  }
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
