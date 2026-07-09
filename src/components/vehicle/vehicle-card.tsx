import Link from 'next/link';
import { Calendar, Fuel, Gauge, Settings2 } from 'lucide-react';
import type { Vehicle } from '@/types/vehicle';
import { formatMileage, formatPrice } from '@/lib/utils';
import { fuelLabels, transmissionLabels, statusLabels } from '@/lib/labels';
import { Badge } from '@/components/ui/badge';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { VehicleImage } from './vehicle-image';

export function VehicleCard({
  vehicle,
  priority = false,
}: {
  vehicle: Vehicle;
  priority?: boolean;
}) {
  const href = `/vetura/${vehicle.slug}`;
  const cover = vehicle.images[0];

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card transition-all duration-500 ease-premium hover:-translate-y-1 hover:shadow-card-hover">
      <Link href={href} className="relative block aspect-[16/11] overflow-hidden bg-surface-sunken">
        <VehicleImage
          src={cover?.url ?? ''}
          alt={cover?.alt ?? `${vehicle.brand} ${vehicle.model}`}
          priority={priority}
          watermark
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="transition-transform duration-[900ms] ease-premium group-hover:scale-[1.05]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute left-4 top-4 flex gap-2">
          {vehicle.featured ? <Badge tone="brand">Përzgjedhur</Badge> : null}
          {vehicle.status !== 'AVAILABLE' ? (
            <Badge tone="dark">{statusLabels[vehicle.status]}</Badge>
          ) : null}
        </div>
      </Link>

      <div className="absolute right-4 top-4">
        <FavoriteButton slug={vehicle.slug} />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[1.05rem] font-semibold tracking-tight text-ink">
              {vehicle.brand} {vehicle.model}
            </h3>
            <p className="mt-0.5 truncate text-sm text-ink-muted">
              {vehicle.variant ?? vehicle.engineLabel}
            </p>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-ink-muted">
          <Spec icon={<Calendar className="h-4 w-4" />} value={String(vehicle.year)} />
          <Spec icon={<Gauge className="h-4 w-4" />} value={formatMileage(vehicle.mileageKm)} />
          <Spec icon={<Fuel className="h-4 w-4" />} value={fuelLabels[vehicle.fuel]} />
          <Spec
            icon={<Settings2 className="h-4 w-4" />}
            value={transmissionLabels[vehicle.transmission]}
          />
        </dl>

        <div className="mt-5 flex items-end justify-between border-t border-surface-border pt-4">
          <div>
            <p className="text-[0.7rem] font-medium uppercase tracking-wide text-ink-faint">
              Çmimi
            </p>
            <p className="text-xl font-semibold tracking-tight text-ink">
              {formatPrice(vehicle.price)}
            </p>
          </div>
          <Link
            href={href}
            className="text-sm font-medium text-brand link-underline"
            aria-label={`Shiko detajet për ${vehicle.brand} ${vehicle.model}`}
          >
            Shiko detajet
          </Link>
        </div>
      </div>
    </article>
  );
}

function Spec({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 truncate">
      <span className="text-ink-faint">{icon}</span>
      <span className="truncate text-ink-soft">{value}</span>
    </div>
  );
}

export function VehicleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card">
      <div className="skeleton aspect-[16/11]" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-5 w-2/3 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="skeleton h-4 rounded" />
          <div className="skeleton h-4 rounded" />
          <div className="skeleton h-4 rounded" />
          <div className="skeleton h-4 rounded" />
        </div>
        <div className="skeleton mt-3 h-8 w-1/3 rounded" />
      </div>
    </div>
  );
}
