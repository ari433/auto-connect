import { ArrowRight } from 'lucide-react';
import { getLatestVehicles } from '@/lib/catalog';
import { safe } from '@/lib/db-safe';
import { Hero } from '@/components/home/hero';
import { Faq, HomeContact, Process } from '@/components/home/sections';
import { Section, SectionHeader } from '@/components/ui/section';
import { ButtonLink } from '@/components/ui/button';
import { VehicleGrid, EmptyState } from '@/components/vehicle/vehicle-grid';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // A single query drives both the hero and the grid, so a transient failure
  // can't leave the page showing only a partial/tiny fallback set.
  const latest = await safe(() => getLatestVehicles(12), []);

  const heroFeature = latest[0];
  const showcase = latest;

  return (
    <>
      <Hero feature={heroFeature} />

      {/* Të Rejat e Fundit */}
      <Section className="bg-surface-subtle">
        <div className="container">
          <SectionHeader
            eyebrow="Inventari"
            title="Të Rejat e Fundit"
            description="Zbuloni veturat më të reja që i kemi shtuar së fundmi në inventarin tonë nga Korea."
            action={
              <ButtonLink href="/inventari" variant="outline">
                Shiko Të Gjitha
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
                  <ButtonLink href="/#kontakt" variant="dark">
                    Na Kontaktoni
                  </ButtonLink>
                }
              />
            )}
          </div>
        </div>
      </Section>

      <Process />
      <Faq />
      <HomeContact />
    </>
  );
}
