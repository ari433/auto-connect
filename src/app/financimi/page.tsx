import type { Metadata } from 'next';
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  ClipboardCheck,
  FileText,
  Handshake,
  KeyRound,
  Landmark,
  Percent,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Section, SectionHeader } from '@/components/ui/section';
import { ButtonLink } from '@/components/ui/button';
import { FinancingCalculator } from '@/components/vehicle/financing-calculator';
import { LeadForm } from '@/components/forms/lead-form';
import { FINANCING_DEFAULTS } from '@/lib/pricing/financing';

export const metadata: Metadata = {
  title: 'Financimi',
  description:
    'Financoni veturën tuaj premium me AUTO CONNECT — parapagesë fleksibël, afate 12 deri 72 muaj dhe interes nga 6.9% në vit. Miratim i shpejtë përmes partnerëve bankarë.',
  alternates: { canonical: '/financimi' },
};

const RATE_LABEL = `${(FINANCING_DEFAULTS.annualRate * 100).toFixed(1)}%`;

const HIGHLIGHTS = [
  {
    icon: Percent,
    title: `Interes nga ${RATE_LABEL} / vit`,
    text: 'Norma konkurruese, e fiksuar për gjithë kohëzgjatjen — pa surpriza në këstet mujore.',
  },
  {
    icon: CalendarClock,
    title: 'Afate 12–72 muaj',
    text: 'Zgjidhni kohëzgjatjen që i përshtatet buxhetit tuaj, me këste të parashikueshme.',
  },
  {
    icon: Landmark,
    title: 'Parapagesë fleksibël',
    text: 'Nisni nga vetëm 10% parapagesë. Sa më e lartë, aq më i ulët kësti mujor.',
  },
];

const STEPS = [
  {
    n: '01',
    icon: FileText,
    title: 'Apliko online',
    text: 'Plotësoni kërkesën me disa të dhëna bazë. Ekipi ynë ju kontakton brenda 24 orëve për të nisur procesin.',
  },
  {
    n: '02',
    icon: ClipboardCheck,
    title: 'Vlerësim & miratim',
    text: 'Partneri ynë bankar vlerëson kërkesën tuaj dhe kthen një përgjigje parimore zakonisht brenda 48 orëve.',
  },
  {
    n: '03',
    icon: Handshake,
    title: 'Nënshkrimi i kontratës',
    text: 'Firmosni kontratën me kushte të qarta e transparente. Pa tarifa të fshehura, pa gjuhë të ndërlikuar.',
  },
  {
    n: '04',
    icon: KeyRound,
    title: 'Merr veturën',
    text: 'Vetura ju dorëzohet e gatshme për rrugë, ndërsa këstin e paguani rehat çdo muaj.',
  },
];

const BENEFITS = [
  {
    icon: BadgeCheck,
    title: 'Miratim i shpejtë',
    text: 'Përgjigje parimore brenda ditësh, jo javësh. Procesi është dixhital dhe pa burokraci të tepërt.',
  },
  {
    icon: ShieldCheck,
    title: 'Kushte të qarta',
    text: 'Çdo shifër e ditur që në fillim — parapagesa, kësti, interesi dhe totali. Asnjë kosto e fshehur.',
  },
  {
    icon: Landmark,
    title: 'Partnerë bankarë',
    text: 'Bashkëpunojmë me institucione financiare të licencuara për t’ju siguruar ofertën më të mirë.',
  },
];

const FAQ = [
  {
    q: 'Cilat dokumente më duhen për të aplikuar?',
    a: 'Për një kërkesë parimore mjafton letërnjoftimi dhe një dëshmi të ardhurash (fletëpagesë ose vërtetim pune). Në varësi të bankës partnere mund të kërkohet edhe historiku i llogarisë. Ekipi ynë ju udhëzon hap pas hapi.',
  },
  {
    q: 'Sa zgjat miratimi i financimit?',
    a: 'Zakonisht merrni një përgjigje parimore brenda 24–48 orëve pune. Miratimi final varet nga banka partnere, por ne e ndjekim procesin nga afër që të mos vononi.',
  },
  {
    q: 'A mund ta shlyej kredinë më herët?',
    a: 'Po. Shlyerja e parakohshme është e mundur në çdo moment. Kushtet e sakta të mbylljes së hershme përcaktohen nga banka partnere dhe jua sqarojmë para nënshkrimit të kontratës.',
  },
  {
    q: 'A mund të financoj çdo veturë nga inventari?',
    a: 'Pothuajse të gjitha veturat tona janë të financueshme. Për modele specifike mund të ndryshojnë parapagesa minimale ose afati maksimal — asistenti ynë jua konfirmon menjëherë.',
  },
];

export default function FinancingPage() {
  return (
    <>
      {/* Hero */}
      <Section className="bg-surface-subtle">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow mb-5 justify-center">
              <Sparkles className="h-4 w-4 text-brand" />
              Financimi
            </p>
            <h1 className="text-display-lg text-balance">
              Vetura juaj premium, me <span className="text-brand">këste</span> që i keni menduar mirë.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
              Parapagesë fleksibël, afate nga 12 deri në 72 muaj dhe interes nga {RATE_LABEL} në vit.
              Ne bashkëpunojmë me partnerë bankarë të besuar që ju ta drejtoni veturën tuaj sa më
              shpejt — pa stresin e procesit.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {HIGHLIGHTS.map((h) => (
              <div
                key={h.title}
                className="rounded-2xl border border-surface-border bg-white p-6"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand">
                  <h.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold tracking-tight">{h.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{h.text}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Calculator + benefits/steps */}
      <Section className="bg-white">
        <div className="container">
          <SectionHeader
            eyebrow="Kalkulatori"
            title="Llogaritni këstin tuaj mujor"
            description="Rregulloni parapagesën dhe afatin për të parë menjëherë se si ndryshon kësti. Vlerësimi është informativ — kushtet finale i përcakton banka partnere."
          />
          <div className="mt-12 grid items-start gap-10 lg:grid-cols-[1.05fr_1fr]">
            <FinancingCalculator price={35000} />

            <div className="lg:pt-2">
              <h3 className="text-display-sm text-balance">
                Pse financimi me AUTO CONNECT
              </h3>
              <p className="mt-4 text-ink-muted">
                Ne e trajtojmë pjesën e ndërlikuar — ju zgjidhni veturën dhe drejtoni. Transparencë
                në çdo shifër, nga parapagesa te kësti i fundit.
              </p>
              <div className="mt-8 space-y-6">
                {BENEFITS.map((b) => (
                  <div key={b.title} className="flex gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-subtle text-brand">
                      <b.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="text-base font-semibold tracking-tight">{b.title}</h4>
                      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{b.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* How it works */}
      <Section className="bg-ink text-white">
        <div className="container">
          <SectionHeader
            eyebrow="Si funksionon"
            title={<span className="text-white">Nga aplikimi te çelësat, në katër hapa.</span>}
            description={
              <span className="text-white/60">
                Një proces i thjeshtë dhe i shpejtë. Ne ju qëndrojmë pranë në secilën fazë.
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

      {/* Lead form + FAQ */}
      <Section className="bg-surface-subtle">
        <div className="container">
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.05fr]">
            <div>
              <p className="eyebrow mb-4">
                <span className="h-px w-6 bg-brand" aria-hidden />
                Kërko një ofertë
              </p>
              <h2 className="text-display-sm text-balance">
                Merrni një ofertë financimi pa detyrim
              </h2>
              <p className="mt-4 max-w-lg text-ink-muted">
                Lini të dhënat tuaja dhe ne ju kthehemi me një ofertë të personalizuar. Është pa
                pagesë dhe pa asnjë detyrim nga ana juaj.
              </p>

              <div className="mt-8 space-y-4">
                {FAQ.map((item) => (
                  <details
                    key={item.q}
                    className="group rounded-2xl border border-surface-border bg-white p-5 transition-colors open:border-ink/15"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold tracking-tight text-ink">
                      {item.q}
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-surface-border text-ink-faint transition-transform duration-300 group-open:rotate-45">
                        <span className="text-lg leading-none">+</span>
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-ink-muted">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-surface-border bg-white p-6 shadow-card md:p-8">
              <LeadForm
                source="FINANCING"
                title="Kërkesë për financim"
                description="Plotësoni fushat e mëposhtme dhe ekipi ynë do t’ju kontaktojë me hapat e mëtejshëm."
                submitLabel="Dërgo kërkesën për financim"
                termMonths={FINANCING_DEFAULTS.defaultTerm}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Closing CTA */}
      <Section className="bg-white">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-brand px-8 py-14 text-center text-white md:py-20">
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-display-sm text-balance text-white">
                Gjeni veturën, ne e bëjmë të përballueshme.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-white/85">
                Shfletoni inventarin tonë të përzgjedhur dhe llogarisni këstin tuaj drejtpërdrejt në
                faqen e çdo veture.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/inventari" variant="light" size="lg">
                  Shiko inventarin
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
