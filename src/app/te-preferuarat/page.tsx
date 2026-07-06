'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import type { Vehicle } from '@/types/vehicle';
import { useFavorites } from '@/components/favorites/favorites-provider';
import { Section } from '@/components/ui/section';
import { ButtonLink } from '@/components/ui/button';
import {
  VehicleGrid,
  VehicleGridSkeleton,
  EmptyState,
} from '@/components/vehicle/vehicle-grid';

interface VehicleResponse {
  vehicle: Vehicle;
  related: Vehicle[];
}

export default function FavoritesPage() {
  const { favorites, ready } = useFavorites();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;

    if (favorites.length === 0) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function load(slugs: string[]) {
      const results = await Promise.all(
        slugs.map(async (slug): Promise<Vehicle | null> => {
          try {
            const res = await fetch('/api/vehicles/' + slug);
            if (!res.ok) return null; // skip 404s gracefully
            const data = (await res.json()) as VehicleResponse;
            return data.vehicle ?? null;
          } catch {
            return null;
          }
        }),
      );

      if (cancelled) return;

      // Preserve the order of the saved favorites list.
      const bySlug = new Map(
        results
          .filter((v): v is Vehicle => v !== null)
          .map((v) => [v.slug, v] as const),
      );
      setVehicles(slugs.map((s) => bySlug.get(s)).filter((v): v is Vehicle => Boolean(v)));
      setLoading(false);
    }

    load(favorites);

    return () => {
      cancelled = true;
    };
  }, [ready, favorites]);

  const showSkeleton = !ready || loading;
  const count = vehicles.length;

  return (
    <Section className="bg-surface-subtle">
      <div className="container">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4">
            <Heart className="h-4 w-4 text-brand" />
            Të preferuarat
          </p>
          <h1 className="text-display-md text-balance">Të preferuarat</h1>
          <p className="mt-4 text-base leading-relaxed text-ink-muted md:text-lg">
            {showSkeleton
              ? 'Po ngarkojmë veturat që keni ruajtur…'
              : count > 0
                ? `${count} ${count === 1 ? 'veturë e ruajtur' : 'vetura të ruajtura'} — gati kur të jeni ju.`
                : 'Këtu ruhen veturat që ju pëlqejnë më shumë, gjithmonë brenda dorës.'}
          </p>
        </div>

        <div className="mt-12">
          {showSkeleton ? (
            <VehicleGridSkeleton count={favorites.length || 3} />
          ) : count > 0 ? (
            <VehicleGrid vehicles={vehicles} />
          ) : (
            <EmptyState
              title="Ende asnjë veturë e preferuar"
              description="Shfletoni inventarin dhe prekni ikonën e zemrës te veturat që ju pëlqejnë — do t’i gjeni të gjitha këtu."
              action={
                <ButtonLink href="/inventari" variant="dark">
                  Eksploro inventarin
                </ButtonLink>
              }
            />
          )}
        </div>
      </div>
    </Section>
  );
}
