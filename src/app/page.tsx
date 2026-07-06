import { ArrowRight } from 'lucide-react';
import { getFeaturedVehicles, getLatestVehicles } from '@/lib/catalog';
import { safe } from '@/lib/db-safe';
import { Hero } from '@/components/home/hero';
import {
  AssistantTeaser,
  CtaBand,
  Process,
  ValueProps,
} from '@/components/home/sections';
import { Section, SectionHeader } from '@/components/ui/section';
import { ButtonLink } from '@/components/ui/button';
import { VehicleGrid, EmptyState } from '@/components/vehicle/vehicle-grid';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [featured, latest] = await Promise.all([
    safe(() => getFeaturedVehicles(6), []),
    safe(() => getLatestVehicles(3), []),
  ]);

  const heroFeature = featured[0] ?? latest[0];
  const showcase = featured.length ? featured : latest;

  return (
    <>
      <Hero feature={heroFeature} />

      <Section className="bg-surface-subtle">
        <div className="container">
          <SectionHeader
            eyebrow="Përzgjedhja jonë"
            title="Vetura të përzgjedhura"
            description="Modelet më të kërkuara nga inventari ynë, të gatshme për ju."
            action={
              <ButtonLink href="/inventari" variant="outline">
                Të gjitha veturat
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            }
          />
          <div className="mt-12">
            {showcase.length ? (
              <VehicleGrid vehicles={showcase} priorityCount={3} />
            ) : (
              <EmptyState
                title="Inventari po përgatitet"
                description="Veturat e para po shtohen. Kontrolloni së shpejti ose na kontaktoni për kërkesa specifike."
                action={
                  <ButtonLink href="/kontakt" variant="dark">
                    Na kontaktoni
                  </ButtonLink>
                }
              />
            )}
          </div>
        </div>
      </Section>

      <ValueProps />
      <Process />
      <AssistantTeaser />
      <CtaBand />
    </>
  );
}
