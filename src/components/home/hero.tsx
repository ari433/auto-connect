import Link from 'next/link';
import { ArrowRight, ShieldCheck, Ship, Star } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { VehicleImage } from '@/components/vehicle/vehicle-image';
import { formatPrice } from '@/lib/utils';
import type { Vehicle } from '@/types/vehicle';

export function Hero({ feature }: { feature?: Vehicle }) {
  return (
    <section className="relative overflow-hidden bg-surface-subtle">
      <div className="container relative grid items-center gap-12 pb-16 pt-10 md:pb-24 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        <div className="max-w-xl">
          <p className="eyebrow mb-6 animate-fade-up">
            <span className="h-px w-8 bg-brand" aria-hidden />
            Import premium nga Koreja e Jugut
          </p>
          <h1 className="text-display-xl animate-fade-up text-balance [animation-delay:60ms]">
            Këtu fillon vetura <span className="text-brand">juaj</span> e re.
          </h1>
          <p className="mt-6 max-w-lg animate-fade-up text-lg leading-relaxed text-ink-muted [animation-delay:120ms]">
            Përzgjedhje e kuruar automjetesh premium, të sjella drejtpërdrejt për ju
            nga Koreja e Jugut, me çmime transparente dhe dorëzim deri në Kosovë.
          </p>

          <div className="mt-9 flex animate-fade-up flex-wrap items-center gap-3 [animation-delay:180ms]">
            <ButtonLink href="/inventari" size="lg">
              Eksploro inventarin
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/asistenti" variant="outline" size="lg">
              Pyet asistentin
            </ButtonLink>
          </div>

          <dl className="mt-12 grid animate-fade-up grid-cols-3 gap-6 border-t border-surface-border pt-8 [animation-delay:240ms]">
            <Stat value="100%" label="Të inspektuara" />
            <Stat value="35–45 ditë" label="Kohë dorëzimi" />
            <Stat value="Çmim final" label="Pa taksa shtesë" />
          </dl>
        </div>

        {feature ? (
          <Link
            href={`/vetura/${feature.slug}`}
            className="group relative animate-fade-in [animation-delay:200ms]"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-surface-sunken shadow-float">
              <VehicleImage
                src={feature.images[0]?.url ?? ''}
                alt={feature.images[0]?.alt ?? `${feature.brand} ${feature.model}`}
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="transition-transform duration-[1200ms] ease-premium group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />

              <div className="absolute left-5 top-5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-ink backdrop-blur">
                  <Star className="h-3.5 w-3.5 fill-brand text-brand" />
                  Përzgjedhja e javës
                </span>
              </div>

              <div className="absolute inset-x-5 bottom-5 flex items-end justify-between text-white">
                <div>
                  <p className="text-sm text-white/70">
                    {feature.year} · {feature.engineLabel}
                  </p>
                  <p className="text-xl font-semibold tracking-tight">
                    {feature.brand} {feature.model}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/60">nga</p>
                  <p className="text-xl font-semibold">{formatPrice(feature.price)}</p>
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <div className="relative hidden aspect-[4/3] overflow-hidden rounded-3xl bg-gradient-to-br from-ink to-ink-soft lg:block">
            <div className="absolute inset-0 grid place-items-center text-white/40">
              <Ship className="h-16 w-16" />
            </div>
          </div>
        )}
      </div>

      <div className="border-y border-surface-border bg-white">
        <div className="container flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-4 text-sm text-ink-muted">
          <Trust icon={<ShieldCheck className="h-4 w-4 text-brand" />} text="Inspektim i plotë teknik" />
          <Trust icon={<Ship className="h-4 w-4 text-brand" />} text="Transport i sigurt detar" />
          <Trust icon={<Star className="h-4 w-4 text-brand" />} text="Histori e verifikuar" />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="text-2xl font-semibold tracking-tight text-ink">{value}</dt>
      <dd className="mt-1 text-sm text-ink-muted">{label}</dd>
    </div>
  );
}

function Trust({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-medium">
      {icon}
      {text}
    </span>
  );
}
