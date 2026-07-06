import type { Metadata } from 'next';
import { Clock, Instagram, Mail, MapPin, Navigation, Phone } from 'lucide-react';
import { Section } from '@/components/ui/section';
import { LeadForm } from '@/components/forms/lead-form';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Kontakt',
  description:
    'Na kontaktoni për çdo pyetje rreth importit apo inventarit. Ekipi i AUTO CONNECT është në dispozicion me telefon, email dhe në vendndodhjen tonë në Milloshevë, Kosovë.',
  alternates: { canonical: '/kontakt' },
};

export default function ContactPage() {
  return (
    <Section className="bg-white">
      <div className="container">
        {/* Intro */}
        <div className="max-w-2xl">
          <p className="eyebrow mb-5">
            <span className="h-px w-6 bg-brand" aria-hidden />
            Kontakt
          </p>
          <h1 className="text-display-lg text-balance">
            Le të flasim për veturën tuaj të radhës.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-ink-muted">
            Qoftë për një veturë specifike, financim apo thjesht një këshillë — ekipi
            i AUTO CONNECT ju përgjigjet shpejt dhe me kujdes. Zgjidhni mënyrën që ju
            përshtatet.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
          {/* Left — contact details */}
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-surface-border bg-surface-subtle p-8 shadow-card">
              <h2 className="text-lg font-semibold tracking-tight">Të dhënat e kontaktit</h2>

              <dl className="mt-6 space-y-6">
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-brand shadow-card">
                    <Phone className="h-5 w-5" />
                  </span>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-eyebrow text-ink-faint">
                      Telefon
                    </dt>
                    <dd className="mt-1 flex flex-col gap-0.5">
                      {site.phones.map((phone) => (
                        <a
                          key={phone}
                          href={`tel:${phone.replace(/\s+/g, '')}`}
                          className="text-base font-medium text-ink transition-colors hover:text-brand"
                        >
                          {phone}
                        </a>
                      ))}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-brand shadow-card">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-eyebrow text-ink-faint">
                      Email
                    </dt>
                    <dd className="mt-1">
                      <a
                        href={`mailto:${site.email}`}
                        className="text-base font-medium text-ink transition-colors hover:text-brand"
                      >
                        {site.email}
                      </a>
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-brand shadow-card">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-eyebrow text-ink-faint">
                      Vendndodhja
                    </dt>
                    <dd className="mt-1 text-base font-medium text-ink">
                      {site.location.address}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-brand shadow-card">
                    <Clock className="h-5 w-5" />
                  </span>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-eyebrow text-ink-faint">
                      Orari
                    </dt>
                    <dd className="mt-1 space-y-1">
                      {site.hours.map((h) => (
                        <div
                          key={h.day}
                          className="flex items-baseline justify-between gap-6 text-sm"
                        >
                          <span className="text-ink-muted">{h.day}</span>
                          <span className="font-medium text-ink">{h.time}</span>
                        </div>
                      ))}
                    </dd>
                  </div>
                </div>
              </dl>

              <div className="mt-8 border-t border-surface-border pt-6">
                <p className="text-xs font-semibold uppercase tracking-eyebrow text-ink-faint">
                  Na ndiqni
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <a
                    href={site.social.instagram}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/25"
                  >
                    <Instagram className="h-4 w-4" />
                    @autoo.connect
                  </a>
                </div>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl border border-surface-border bg-ink p-8 text-white shadow-card">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.12]"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
                  backgroundSize: '32px 32px',
                }}
              />
              <div className="relative flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-white">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold tracking-tight">
                    {site.location.city}, {site.location.country}
                  </p>
                  <p className="text-sm text-white/60">Salloni i AUTO CONNECT</p>
                </div>
              </div>
              <div className="relative flex items-center gap-2 text-sm text-white/70">
                <Navigation className="h-4 w-4 text-brand" />
                Na vizitoni për të parë veturat nga afër.
              </div>
            </div>
          </div>

          {/* Right — lead form */}
          <div className="rounded-2xl border border-surface-border bg-white p-8 shadow-card md:p-10">
            <LeadForm
              source="CONTACT_FORM"
              title="Na shkruani"
              description="Plotësoni formularin dhe ju kontaktojmë brenda ditës së punës me përgjigjen tuaj."
              submitLabel="Dërgo mesazhin"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
