import type { Metadata } from 'next';
import {
  ArrowRight,
  BadgeCheck,
  FileSearch,
  Gem,
  HandshakeIcon,
  Plus,
  Ship,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { Section, SectionHeader } from '@/components/ui/section';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Rreth nesh',
  description:
    'AUTO CONNECT importon vetura premium nga Koreja e Jugut dhe i dorëzon në Kosovë me çmime transparente dhe inspektim të plotë. Njihuni me procesin, vlerat dhe mbështetjen tonë.',
  alternates: { canonical: '/rreth-nesh' },
};

const STATS = [
  { value: '500+', label: 'Vetura të importuara' },
  { value: '35–45 ditë', label: 'Kohë mesatare dorëzimi' },
  { value: '0', label: 'Kosto të fshehura' },
  { value: '100%', label: 'Të inspektuara para nisjes' },
];

const STEPS = [
  {
    n: '01',
    icon: FileSearch,
    title: 'Zgjidhni veturën',
    text: 'Shfletoni inventarin tonë të kuruar ose na tregoni saktësisht çfarë kërkoni — ne e gjejmë përputhjen ideale për ju në Korenë e Jugut.',
  },
  {
    n: '02',
    icon: BadgeCheck,
    title: 'Ne e sigurojmë',
    text: 'Verifikojmë gjendjen, kilometrazhën dhe historikun, kryejmë inspektimin e plotë dhe finalizojmë blerjen në emrin tuaj.',
  },
  {
    n: '03',
    icon: Ship,
    title: 'Transport & doganë',
    text: 'Menaxhojmë transportin detar, zhdoganimin dhe të gjitha procedurat — pa asnjë hap administrativ mbi supet tuaja.',
  },
  {
    n: '04',
    icon: Truck,
    title: 'Dorëzim në Kosovë',
    text: 'Vetura ju dorëzohet e regjistruar dhe e gatshme për rrugë, me mbështetjen tonë të vazhdueshme pas shitjes.',
  },
];

const VALUES = [
  {
    icon: Gem,
    title: 'Cilësi pa kompromis',
    text: 'Përzgjedhim vetëm vetura me histori të pastër dhe gjendje të përsosur teknike. Nëse nuk do ta blinim vetë, nuk e ofrojmë.',
  },
  {
    icon: BadgeCheck,
    title: 'Transparencë e plotë',
    text: 'Çdo çmim është i qartë dhe përfundimtar — transporti, dogana dhe taksat përfshihen që në fillim. Pa kosto të fshehura.',
  },
  {
    icon: HandshakeIcon,
    title: 'Besim i ndërtuar',
    text: 'Qindra klientë na kanë besuar importin e veturës së tyre. Ju komunikojmë çdo hap, nga porosia deri te çelësi në dorë.',
  },
  {
    icon: ShieldCheck,
    title: 'Mbështetje pas shitjes',
    text: 'Ekipi ynë ju qëndron pranë edhe pas dorëzimit — servisim, këshillim dhe përgjigje për çdo pyetje.',
  },
];

const FAQS = [
  {
    q: 'Sa kohë zgjat importi i një veture?',
    a: 'Nga momenti i konfirmimit të porosisë deri te dorëzimi në Kosovë, procesi zgjat rreth 35–45 ditë. Afati i saktë varet nga modeli dhe orari i transportit detar — ju e dini datën e pritur që në fillim.',
  },
  {
    q: 'Si funksionon pagesa?',
    a: 'Çmimi i publikuar është përfundimtar dhe përfshin transportin, doganën dhe taksat. Pranojmë pagesë të plotë ose financim me këste — na kontaktoni për të ndërtuar planin që ju përshtatet.',
  },
  {
    q: 'A janë përfshirë dogana dhe taksat në çmim?',
    a: 'Po. Çmimi që shihni te çdo veturë e përfshin zhdoganimin dhe të gjitha taksat deri te dorëzimi në Kosovë. Nuk ka surpriza në fund të procesit.',
  },
  {
    q: 'A mund të inspektohet vetura para blerjes?',
    a: 'Çdo veturë kalon një inspektim të plotë para nisjes nga Koreja dhe ju pajisim me raportin e detajuar të gjendjes, kilometrazhës dhe historikut. Për çdo pyetje shtesë, jemi në dispozicion.',
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Intro */}
      <Section className="bg-white">
        <div className="container">
          <div className="max-w-3xl">
            <p className="eyebrow mb-5">
              <span className="h-px w-6 bg-brand" aria-hidden />
              Rreth AUTO CONNECT
            </p>
            <h1 className="text-display-lg text-balance">
              Vetura premium nga Koreja, të dorëzuara pa asnjë kompromis.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-ink-muted">
              AUTO CONNECT importon vetura premium nga Koreja e Jugut dhe i sjell
              deri te dera juaj në Kosovë. Ne e trajtojmë çdo hap — përzgjedhjen,
              inspektimin e plotë, transportin dhe zhdoganimin — me çmime plotësisht
              transparente. Ju merrni një veturë të gatshme për rrugë, pa stresin dhe
              pa surprizat e procesit.
            </p>
          </div>

          {/* Stats band */}
          <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-surface-border bg-surface-border sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white p-8">
                <p className="text-display-sm text-brand">{s.value}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Procesi */}
      <Section id="procesi" className="scroll-mt-24 bg-ink text-white">
        <div className="container">
          <SectionHeader
            eyebrow="Procesi"
            title={<span className="text-white">Nga Koreja te dera juaj.</span>}
            description={
              <span className="text-white/60">
                Katër hapa të thjeshtë. Ne merremi me pjesën e vështirë, ju gëzoni
                rezultatin.
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

      {/* Pse ne */}
      <Section className="bg-white">
        <div className="container">
          <SectionHeader
            eyebrow="Pse ne"
            title="Vlerat që qëndrojnë pas çdo veture."
            description="Nuk jemi thjesht importues. Jemi partneri që ju garanton cilësi, transparencë dhe qetësi në një nga blerjet më të rëndësishme."
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
                <h3 className="mt-5 text-lg font-semibold tracking-tight">
                  {v.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {v.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" className="scroll-mt-24 bg-surface-subtle">
        <div className="container">
          <SectionHeader
            eyebrow="Pyetje të shpeshta"
            title="Gjithçka që dëshironi të dini."
            description="Nëse nuk e gjeni përgjigjen këtu, ekipi ynë është vetëm një telefonatë larg."
          />
          <div className="mx-auto mt-12 max-w-3xl space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group scroll-mt-24 rounded-2xl border border-surface-border bg-white px-6 shadow-card transition-colors open:border-ink/15"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left font-medium tracking-tight text-ink [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-subtle text-ink-muted transition-transform duration-300 ease-premium group-open:rotate-45">
                    <Plus className="h-4 w-4" />
                  </span>
                </summary>
                <p className="pb-6 text-sm leading-relaxed text-ink-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Section>

      {/* Closing CTA */}
      <Section className="bg-white">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-brand px-8 py-14 text-center text-white md:py-20">
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-display-sm text-balance text-white">
                Filloni udhëtimin drejt veturës suaj.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-white/85">
                Shfletoni inventarin tonë të përzgjedhur ose na kontaktoni për një
                kërkesë specifike — ne kujdesemi për pjesën tjetër.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/inventari" variant="light" size="lg">
                  Shiko inventarin
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink
                  href="/kontakt"
                  size="lg"
                  className="border border-white/40 bg-transparent text-white shadow-none hover:bg-white/10"
                >
                  Na kontaktoni
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
