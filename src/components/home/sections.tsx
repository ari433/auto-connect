import Link from 'next/link';
import {
  KeyRound,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Plus,
  SearchCheck,
  ShieldCheck,
  Ship,
} from 'lucide-react';
import { Section, SectionHeader } from '@/components/ui/section';
import { ButtonLink } from '@/components/ui/button';
import { site } from '@/lib/site';
import { whatsappUrl } from '@/lib/whatsapp';

/* ------------------------------------------------------------------ *
 * Si Funksionon? — the 4-step import process (mirrors koreakosovaauto.com)
 * ------------------------------------------------------------------ */
const STEPS = [
  {
    n: '1',
    icon: SearchCheck,
    title: 'Zgjedhja',
    text: 'Zgjidhni modelin nga inventari ynë ose tregoni çfarë veture po kërkoni specifikisht.',
  },
  {
    n: '2',
    icon: ShieldCheck,
    title: 'Verifikimi',
    text: 'Ne e inspektojmë secilin detaj dhe ju dërgojmë dokumente e video origjinale.',
  },
  {
    n: '3',
    icon: Ship,
    title: 'Transporti',
    text: 'NISET! Ju e përcjellni veturën online gjatë kohës që transportohet në det.',
  },
  {
    n: '4',
    icon: KeyRound,
    title: 'Dorëzimi',
    text: 'Marrja e çelësave të doganuar. E gatshme për ta shijuar rrugën tuaj të re.',
  },
];

export function Process() {
  return (
    <Section id="procesi" className="scroll-mt-24 bg-ink text-white">
      <div className="container">
        <SectionHeader
          align="center"
          eyebrow="Procesi"
          title={<span className="text-white">Si Funksionon?</span>}
          description={
            <span className="text-white/60">
              Rruga drejt veturës tuaj të ëndrrave është e thjeshtë, transparente dhe
              plotësisht e sigurt.
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
                <span className="text-3xl font-semibold text-white/15">{s.n}</span>
              </div>
              <h3 className="text-lg font-semibold tracking-tight">
                {s.n}. {s.title}
              </h3>
              <p className="text-sm leading-relaxed text-white/60">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ *
 * Pyetjet më të Shpeshta — FAQ accordion (mirrors koreakosovaauto.com)
 * ------------------------------------------------------------------ */
const FAQS = [
  {
    q: 'A garantohet kualiteti i veturës që blej?',
    a: 'Po 100%. Secila veturë testohet në Kore të Jugut. Nuk ngarkohet anijes para se t’i shihni matjet elektronike të ngjyrës dhe raportin e servisit.',
  },
  {
    q: 'Sa muaj zgjat pritja pasi të paguaj?',
    a: 'Transporti me doganimin komplet në Kosovë zgjat afërsisht 45 ditë nga nisja e anijes.',
  },
  {
    q: 'Cilat janë shpenzimet e fshehura?',
    a: 'Asnjë. Çmimi që ne dakordohemi bashkë mbulon koston e veturës atje, transportin, dokumentacionin dhe doganën. Nuk jepni asnjë cent tjetër jashtë marrëveshjes.',
  },
  {
    q: 'A vlen pagesa menjëherë?',
    a: 'Paguhet depozita sipas kontratës së nënshkruar. Pjesën tjetër mund ta koordinoni varësisht rastit pasi siguroheni me video konkrete për secilin hap të procesit.',
  },
];

export function Faq() {
  return (
    <Section id="faq" className="scroll-mt-24 bg-surface-subtle">
      <div className="container">
        <SectionHeader
          align="center"
          eyebrow="FAQ"
          title="Pyetjet më të Shpeshta"
          description="Përgjigjet për gjërat që klientët tanë pyesin më shpesh para se të porosisin."
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
  );
}

/* ------------------------------------------------------------------ *
 * Keni Pyetje Të Tjera? — homepage contact block (mirrors koreakosovaauto.com)
 * ------------------------------------------------------------------ */
export function HomeContact() {
  const mapsQuery = encodeURIComponent(`${site.legalName}, ${site.location.address}`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <Section id="kontakt" className="scroll-mt-24 bg-white">
      <div className="container">
        <SectionHeader
          align="center"
          eyebrow="Kontakt"
          title="Keni Pyetje Të Tjera?"
          description="Jemi në dispozicion çdo ditë të javës. Vizitoni zyrën tonë ose na telefononi për të aranzhuar takim."
        />

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3">
          <ContactCard
            icon={<Phone className="h-5 w-5" />}
            label="Telefoni"
            lines={site.phones.map((p) => ({
              text: p,
              href: `tel:${p.replace(/\s/g, '')}`,
            }))}
          />
          <ContactCard
            icon={<Mail className="h-5 w-5" />}
            label="Email"
            lines={[{ text: site.email, href: `mailto:${site.email}` }]}
          />
          <ContactCard
            icon={<MapPin className="h-5 w-5" />}
            label="Adresa"
            lines={[{ text: site.location.address }]}
          />
        </div>

        {/* Lokacioni / map */}
        <div className="mx-auto mt-6 max-w-5xl">
          <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl border border-surface-border bg-ink p-8 text-white shadow-card md:flex-row md:items-center md:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
            <div className="relative flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand text-white">
                <MapPin className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm text-white/60">Lokacioni</p>
                <p className="text-lg font-semibold tracking-tight">
                  {site.location.address}
                </p>
              </div>
            </div>
            <div className="relative flex flex-wrap gap-3">
              <ButtonLink href={mapsUrl} variant="light" size="md" target="_blank">
                <Navigation className="h-4 w-4" />
                Hap në Google Maps
              </ButtonLink>
              <a
                href={whatsappUrl(
                  'Përshëndetje AUTO CONNECT, kam një pyetje për një veturë.',
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/40 px-6 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Shkruaj në WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function ContactCard({
  icon,
  label,
  lines,
}: {
  icon: React.ReactNode;
  label: string;
  lines: { text: string; href?: string }[];
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-surface-border bg-surface-subtle p-8 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-brand shadow-card">
        {icon}
      </span>
      <p className="text-xs font-semibold uppercase tracking-eyebrow text-ink-faint">
        {label}
      </p>
      <div className="space-y-0.5">
        {lines.map((l) =>
          l.href ? (
            <a
              key={l.text}
              href={l.href}
              className="block text-base font-medium text-ink transition-colors hover:text-brand"
            >
              {l.text}
            </a>
          ) : (
            <p key={l.text} className="text-base font-medium text-ink">
              {l.text}
            </p>
          ),
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Closing CTA band
 * ------------------------------------------------------------------ */
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
                Shfletoni Veturat
              </ButtonLink>
              <Link
                href="/#kontakt"
                className="inline-flex h-[3.25rem] items-center justify-center rounded-full border border-white/40 px-8 text-[0.95rem] font-medium text-white transition-colors hover:bg-white/10"
              >
                Na Kontaktoni
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
