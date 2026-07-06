import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  FileSearch,
  Ship,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { Section, SectionHeader } from '@/components/ui/section';
import { ButtonLink } from '@/components/ui/button';

const VALUES = [
  {
    icon: FileSearch,
    title: 'Përzgjedhje e kuruar',
    text: 'Çdo veturë kalon një kontroll të rreptë përzgjedhjeje para se të hyjë në inventarin tonë.',
  },
  {
    icon: BadgeCheck,
    title: 'Histori e verifikuar',
    text: 'Kilometrazha, aksidentet dhe historiku i servisimit — të gjitha të dokumentuara.',
  },
  {
    icon: Banknote,
    title: 'Çmime transparente',
    text: 'Një çmim i qartë, i llogaritur me motorin tonë. Pa surpriza, pa kosto të fshehura.',
  },
  {
    icon: Wrench,
    title: 'Garancion & mbështetje',
    text: 'Garancion deri në 12 muaj dhe mbështetje pas shitjes nga ekipi ynë.',
  },
];

export function ValueProps() {
  return (
    <Section className="bg-white">
      <div className="container">
        <SectionHeader
          eyebrow="Pse AUTO CONNECT"
          title="Blerja e një veture, e menduar sërish."
          description="Ne e trajtojmë importin nga fillimi në fund, që ju të merrni vetëm përvojën — një veturë premium, pa stresin e procesit."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="group rounded-2xl border border-surface-border bg-surface-subtle p-7 transition-colors hover:border-ink/15"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-brand shadow-card transition-transform duration-300 group-hover:-translate-y-0.5">
                <v.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{v.text}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

const STEPS = [
  {
    n: '01',
    icon: FileSearch,
    title: 'Zgjidhni veturën',
    text: 'Shfletoni inventarin ose lëreni asistentin t’ju gjejë përputhjen ideale.',
  },
  {
    n: '02',
    icon: BadgeCheck,
    title: 'Ne e sigurojmë',
    text: 'Verifikojmë gjendjen, dokumentet dhe finalizojmë blerjen në emrin tuaj.',
  },
  {
    n: '03',
    icon: Ship,
    title: 'Transport & doganë',
    text: 'Menaxhojmë transportin detar, doganën dhe homologimin — pa merak për ju.',
  },
  {
    n: '04',
    icon: BadgeCheck,
    title: 'Dorëzim në Kosovë',
    text: 'Vetura ju dorëzohet e gatshme për rrugë, me garancion dhe mbështetje.',
  },
];

export function Process() {
  return (
    <Section className="bg-ink text-white">
      <div className="container">
        <SectionHeader
          eyebrow="Procesi"
          title={<span className="text-white">Nga Koreja te dera juaj.</span>}
          description={
            <span className="text-white/60">
              Katër hapa të thjeshtë. Ne merremi me pjesën e vështirë, ju gëzoni rezultatin.
            </span>
          }
        />
        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="flex flex-col gap-4 bg-ink p-8">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/5 text-brand">
                  <s.icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-white/25">{s.n}</span>
              </div>
              <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="text-sm leading-relaxed text-white/60">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function AssistantTeaser() {
  return (
    <Section className="bg-white">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl border border-surface-border bg-surface-subtle p-8 md:p-14">
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="eyebrow mb-4">
                <Sparkles className="h-4 w-4 text-brand" />
                Asistenti virtual
              </p>
              <h2 className="text-display-sm text-balance">
                Nuk dini nga të filloni? Pyesni asistentin tonë.
              </h2>
              <p className="mt-4 max-w-lg text-ink-muted">
                Përshkruani buxhetin dhe nevojat tuaja në gjuhën e përditshme —
                asistenti do t’ju rekomandojë veturat më të përshtatshme nga inventari, në sekonda.
              </p>
              <ButtonLink href="/asistenti" size="lg" variant="dark" className="mt-8">
                Fillo bisedën
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
            <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-white">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="space-y-3">
                  <p className="rounded-2xl bg-surface-subtle px-4 py-2.5 text-sm text-ink-soft">
                    Kërkoj një SUV familjar deri në 45.000 €, me shtatë ulëse.
                  </p>
                  <p className="rounded-2xl bg-ink px-4 py-2.5 text-sm text-white">
                    Perfekt! Ju rekomandoj Kia Sorento dhe Hyundai Palisade — të dyja me shtatë ulëse
                    dhe brenda buxhetit tuaj. Dëshironi një ofertë financimi?
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

export function CtaBand() {
  return (
    <Section className="bg-surface-subtle">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-brand px-8 py-14 text-center text-white md:py-20">
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-display-sm text-balance text-white">
              Gati për veturën tuaj të radhës?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/85">
              Ekipi i AUTO CONNECT është këtu për t’ju ndihmuar në çdo hap. Na kontaktoni sot.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/inventari" variant="light" size="lg">
                Shiko inventarin
              </ButtonLink>
              <Link
                href="/kontakt"
                className="inline-flex h-[3.25rem] items-center justify-center rounded-full border border-white/40 px-8 text-[0.95rem] font-medium text-white transition-colors hover:bg-white/10"
              >
                Na kontaktoni
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
