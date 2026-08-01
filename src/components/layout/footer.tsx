import Link from 'next/link';
import { Clock, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { footerNav, site } from '@/lib/site';
import { Logo } from '@/components/ui/logo';

export function Footer() {
  const year = 2026;

  return (
    <footer className="bg-ink text-white/80">
      <div className="container py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr_1.2fr]">
          {/* Brand */}
          <div className="max-w-sm">
            <Logo variant="light" />
            <p className="mt-5 text-sm leading-relaxed text-white/60">
              Lider në importin e veturave premium nga Koreja e Jugut në Kosovë. Ne
              ofrojmë transparencë oferte, inspektim të plotë dhe doganim të thjeshtë.
            </p>

            <a
              href={site.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-white/40 hover:bg-white/5"
            >
              <Instagram className="h-4 w-4 text-brand" />
              @autoo.connect
            </a>
          </div>

          {/* Linqe Të Shpejta */}
          {Object.entries(footerNav).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-[0.72rem] font-semibold uppercase tracking-eyebrow text-white/40">
                {heading}
              </h3>
              <ul className="mt-5 space-y-3 text-sm">
                {links.map((link) => (
                  <li key={`${link.label}-${link.href}`}>
                    <Link
                      href={link.href}
                      className="text-white/70 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Na Kontaktoni */}
          <div>
            <h3 className="text-[0.72rem] font-semibold uppercase tracking-eyebrow text-white/40">
              Na Kontaktoni
            </h3>
            <ul className="mt-5 space-y-5 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <div>
                  <p className="text-white/40">Adresa Zyrtare</p>
                  <p className="text-white/80">{site.location.address}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <div>
                  <p className="text-white/40">Telefoni</p>
                  {site.phones.map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone.replace(/\s/g, '')}`}
                      className="block text-white/80 transition-colors hover:text-white"
                    >
                      {phone}
                    </a>
                  ))}
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <div>
                  <p className="text-white/40">Email Zyrtar</p>
                  <a
                    href={`mailto:${site.email}`}
                    className="text-white/80 transition-colors hover:text-white"
                  >
                    {site.email}
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-white/10 pt-6 text-sm text-white/50">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand" />
            {site.hours.map((h) => `${h.day}: ${h.time}`).join('  ·  ')}
          </div>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-3 text-xs text-white/40 md:flex-row md:items-center">
          <p>© {year} {site.name}. Të gjitha të drejtat e rezervuara.</p>
          <div className="flex items-center gap-5">
            <Link href="/rreth-nesh" className="hover:text-white/70">
              Kushtet e Përdorimit
            </Link>
            <Link href="/rreth-nesh" className="hover:text-white/70">
              Politika e Privatësisë
            </Link>
            <Link href="/admin" className="hover:text-white/70">
              Paneli
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
