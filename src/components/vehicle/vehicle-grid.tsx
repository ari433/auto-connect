import type { Vehicle } from '@/types/vehicle';
import { VehicleCard, VehicleCardSkeleton } from './vehicle-card';

export function VehicleGrid({
  vehicles,
  priorityCount = 0,
}: {
  vehicles: Vehicle[];
  priorityCount?: number;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((v, i) => (
        <VehicleCard key={v.id} vehicle={v} priority={i < priorityCount} />
      ))}
    </div>
  );
}

export function VehicleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <VehicleCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function EmptyState({
  title = 'Asnjë veturë e gjetur',
  description = 'Provoni të ndryshoni filtrat ose kërkimin tuaj.',
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-border bg-white px-6 py-20 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-surface-sunken text-ink-faint">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
