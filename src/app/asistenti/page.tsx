import type { Metadata } from 'next';
import { Database, MessagesSquare, Sparkles, Wallet } from 'lucide-react';
import { Section } from '@/components/ui/section';
import { AssistantChat } from '@/components/assistant/assistant-chat';

export const metadata: Metadata = {
  title: 'Asistenti Virtual',
  description:
    'Asistenti virtual i AUTO CONNECT ju ndihmon të gjeni veturën ideale. Përshkruani buxhetin dhe nevojat tuaja në gjuhën e përditshme dhe merrni rekomandime nga inventari ynë real.',
  alternates: { canonical: '/asistenti' },
};

const HINTS = [
  {
    icon: Wallet,
    title: 'Nisni nga buxheti',
    text: 'p.sh. “SUV familjar deri në 40 mijë €”',
  },
  {
    icon: MessagesSquare,
    title: 'Përshkruani përdorimin',
    text: 'p.sh. “Diçka ekonomike për në qytet, me naftë”',
  },
  {
    icon: Sparkles,
    title: 'Kërkoni specifika',
    text: 'p.sh. “Sedan sportiv me mbi 300 kuaj fuqi”',
  },
];

export default function AssistantPage() {
  return (
    <Section className="bg-surface-subtle">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow mb-5 justify-center">
            <Sparkles className="h-4 w-4 text-brand" />
            Asistenti virtual
          </p>
          <h1 className="text-display-lg text-balance">
            Gjeni veturën tuaj <span className="text-brand">ideale</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
            Përshkruani çfarë kërkoni me fjalët tuaja — buxhetin, tipin e veturës, karburantin ose
            përdorimin — dhe asistenti ynë do t’ju rekomandojë përputhjet më të mira nga inventari
            real, në sekonda.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <AssistantChat />
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <div className="mb-5 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-eyebrow text-ink-faint">
            <Database className="h-3.5 w-3.5" />
            Rekomandime nga inventari ynë real
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {HINTS.map((h) => (
              <div
                key={h.title}
                className="rounded-2xl border border-surface-border bg-white p-5"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-subtle text-brand">
                  <h.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-sm font-semibold tracking-tight text-ink">{h.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{h.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs leading-relaxed text-ink-faint">
            Asistenti rekomandon vetëm vetura që janë realisht në inventarin tonë. Për një ofertë
            konkrete ose financim, ekipi ynë ju qëndron pranë në çdo hap.
          </p>
        </div>
      </div>
    </Section>
  );
}
