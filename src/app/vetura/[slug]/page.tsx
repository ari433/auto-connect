import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, MapPin, Phone, ShieldCheck, Ship, Sparkles, Store } from 'lucide-react';
import { getVehicleBySlug, getRelatedVehicles } from '@/lib/catalog';
import { safe } from '@/lib/db-safe';
import { site } from '@/lib/site';
import { formatMileage, formatPrice } from '@/lib/utils';
import {
  bodyTypeLabels,
  driveLabels,
  fuelLabels,
  statusLabels,
  transmissionLabels,
} from '@/lib/labels';
import { Badge } from '@/components/ui/badge';
import { Section, SectionHeader } from '@/components/ui/section';
import { Gallery } from '@/components/vehicle/gallery';
import { SpecGrid } from '@/components/vehicle/spec-grid';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { describeVehicle } from '@/lib/vehicles/description';
import { LeadForm } from '@/components/forms/lead-form';
import { VehicleGrid } from '@/components/vehicle/vehicle-grid';
import { VehicleJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await safe(() => getVehicleBySlug(slug), null);
  if (!vehicle) return { title: 'Vetura nuk u gjet' };

  const name = `${vehicle.brand} ${vehicle.model} ${vehicle.variant ?? ''}`.trim();
  const title = `${name} — ${vehicle.year}`;
  const description = `${name}, ${vehicle.year}, ${formatMileage(vehicle.mileageKm)}, ${fuelLabels[vehicle.fuel]}. ${formatPrice(vehicle.price)} — vetëm në AUTO CONNECT.`;
  const images = vehicle.images.slice(0, 4).map((i) => ({ url: i.url, alt: i.alt }));
  const keywords = [
    vehicle.brand,
    `${vehicle.brand} ${vehicle.model}`,
    vehicle.model,
    vehicle.variant ?? '',
    String(vehicle.year),
    fuelLabels[vehicle.fuel],
    'vetura nga Koreja',
    'makina të importuara',
    'Auto Connect Kosovë',
  ].filter(Boolean);

  return {
    title,
    description,
    keywords,
    alternates: { canonical: `/vetura/${vehicle.slug}` },
    openGraph: {
      title,
      description,
      url: `/vetura/${vehicle.slug}`,
      siteName: site.name,
      locale: 'sq_AL',
      images,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map((i) => i.url),
    },
  };
}

export default async function VehiclePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vehicle = await safe(() => getVehicleBySlug(slug), null);
  if (!vehicle) notFound();

  const related = await safe(() => getRelatedVehicles(vehicle, 3), []);
  const name = `${vehicle.brand} ${vehicle.model}`;

  const highlights = [
    { label: 'Viti', value: String(vehicle.year) },
    { label: 'Kilometrazha', value: formatMileage(vehicle.mileageKm) },
    { label: 'Karburanti', value: fuelLabels[vehicle.fuel] },
    { label: 'Transmisioni', value: transmissionLabels[vehicle.transmission] },
    { label: 'Fuqia', value: vehicle.horsepower ? `${vehicle.horsepower} kf` : '—' },
    { label: 'Transmetimi', value: driveLabels[vehicle.drive] },
  ];

  return (
    <>
      <VehicleJsonLd vehicle={vehicle} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Ballina', url: '/' },
          { name: 'Inventari', url: '/inventari' },
          { name: name, url: `/vetura/${vehicle.slug}` },
        ]}
      />

      {/* Breadcrumb */}
      <div className="border-b border-surface-border bg-white">
        <div className="container flex items-center gap-1.5 py-4 text-sm text-ink-muted">
          <Link href="/" className="hover:text-ink">Ballina</Link>
          <ChevronRight className="h-3.5 w-3.5 text-ink-faint" />
          <Link href="/inventari" className="hover:text-ink">Inventari</Link>
          <ChevronRight className="h-3.5 w-3.5 text-ink-faint" />
          <span className="truncate text-ink">{name}</span>
        </div>
      </div>

      <div className="bg-surface-subtle py-8 md:py-12">
        <div className="container grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
          {/* Left: gallery + details */}
          <div className="min-w-0">
            <Gallery images={vehicle.images} title={name} />

            <div className="mt-12">
              <h2 className="text-display-sm">Përshkrimi</h2>
              <p className="mt-4 leading-relaxed text-ink-muted">
                {describeVehicle(vehicle)}
              </p>
            </div>

            <div className="mt-12">
              <h2 className="text-display-sm">Specifikimet</h2>
              <div className="mt-6">
                <SpecGrid vehicle={vehicle} />
              </div>
            </div>

            {vehicle.equipment.length > 0 ? (
              <div className="mt-12">
                <h2 className="text-display-sm">Pajisjet</h2>
                <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {vehicle.equipment.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-ink-soft">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                          <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {vehicle.dealer && (vehicle.dealer.name || vehicle.dealer.location || vehicle.dealer.phone) ? (
              <div className="mt-12">
                <h2 className="text-display-sm">Shitësi</h2>
                <div className="mt-6 rounded-2xl border border-surface-border bg-white p-6">
                  <dl className="grid gap-4 sm:grid-cols-2">
                    {vehicle.dealer.name ? (
                      <div className="flex items-start gap-3">
                        <Store className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                        <div>
                          <dt className="text-xs text-ink-faint">Tregtari</dt>
                          <dd className="text-sm font-medium text-ink">{vehicle.dealer.name}</dd>
                        </div>
                      </div>
                    ) : null}
                    {vehicle.dealer.location ? (
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                        <div>
                          <dt className="text-xs text-ink-faint">Vendndodhja</dt>
                          <dd className="text-sm font-medium text-ink">{vehicle.dealer.location}</dd>
                        </div>
                      </div>
                    ) : null}
                    {vehicle.dealer.phone ? (
                      <div className="flex items-start gap-3">
                        <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                        <div>
                          <dt className="text-xs text-ink-faint">Kontakti</dt>
                          <dd className="text-sm font-medium text-ink">{vehicle.dealer.phone}</dd>
                        </div>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </div>
            ) : null}
          </div>

          {/* Right: sticky summary */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {vehicle.featured ? <Badge tone="brand">Përzgjedhur</Badge> : null}
                    <Badge tone={vehicle.status === 'AVAILABLE' ? 'success' : 'dark'}>
                      {statusLabels[vehicle.status]}
                    </Badge>
                  </div>
                  <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
                  <p className="mt-1 text-ink-muted">{vehicle.variant ?? vehicle.engineLabel}</p>
                </div>
                <FavoriteButton slug={vehicle.slug} variant="inline" />
              </div>

              <div className="mt-5 border-t border-surface-border pt-5">
                <p className="text-[0.72rem] font-medium uppercase tracking-eyebrow text-ink-faint">
                  Çmimi
                </p>
                <p className="text-3xl font-semibold tracking-tight">{formatPrice(vehicle.price)}</p>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-surface-border pt-5">
                {highlights.map((h) => (
                  <div key={h.label}>
                    <dt className="text-xs text-ink-faint">{h.label}</dt>
                    <dd className="mt-0.5 text-sm font-medium text-ink">{h.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 flex flex-col gap-3">
                <a
                  href={`tel:${site.phones[0].replace(/\s/g, '')}`}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-medium text-white transition-colors hover:bg-brand-600"
                >
                  <Phone className="h-4 w-4" />
                  Telefono: {site.phones[0]}
                </a>
                <a
                  href="#kontakto"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-ink/15 px-6 text-sm font-medium text-ink transition-colors hover:border-ink/40"
                >
                  Kërko më shumë informacion
                </a>
              </div>

              <div className="mt-6 flex items-center justify-center gap-4 border-t border-surface-border pt-5 text-xs text-ink-muted">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-brand" /> E inspektuar</span>
                <span className="inline-flex items-center gap-1.5"><Ship className="h-3.5 w-3.5 text-brand" /> Import direkt nga Koreja</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry */}
      <Section id="kontakto" className="bg-white">
        <div className="container">
          <div className="grid gap-10 rounded-3xl border border-surface-border bg-surface-subtle p-8 md:p-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="eyebrow mb-4">
                <Sparkles className="h-4 w-4 text-brand" />
                E interesuar për këtë veturë?
              </p>
              <h2 className="text-display-sm text-balance">
                Lini të dhënat tuaja dhe ju kontaktojmë brenda ditës.
              </h2>
              <p className="mt-4 text-ink-muted">
                Ekipi i AUTO CONNECT do t’ju përgjigjet me të gjitha detajet për {name},
                mundësitë e financimit dhe një test-drive.
              </p>
            </div>
            <div className="rounded-2xl border border-surface-border bg-white p-6 md:p-8">
              <LeadForm
                source="VEHICLE_INQUIRY"
                vehicleSlug={vehicle.slug}
                defaultMessage={`Përshëndetje, jam i interesuar për ${name} (${vehicle.year}). Ju lutem më kontaktoni.`}
                submitLabel="Dërgo kërkesën"
              />
            </div>
          </div>
        </div>
      </Section>

      {related.length > 0 ? (
        <Section className="bg-surface-subtle pt-0">
          <div className="container">
            <SectionHeader eyebrow="Të ngjashme" title="Vetura që mund t’ju pëlqejnë" />
            <div className="mt-10">
              <VehicleGrid vehicles={related} />
            </div>
          </div>
        </Section>
      ) : null}
    </>
  );
}
