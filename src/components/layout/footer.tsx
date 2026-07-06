import Link from 'next/link';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { footerNav, site } from '@/lib/site';
import { Logo } from '@/components/ui/logo';

export function Footer() {
  const year = 2026;

  return (
    <footer className="bg-ink text-white/80">
      <div className="container py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo variant="light" />
            <p className="mt-5 text-sm leading-relaxed text-white/60">
              {site.description}
            </p>
            <div className="mt-6 space-y-3 text-sm">
              <a
                href={`tel:${site.phones[0].replace(/\s/g, '')}`}
                className="flex items-center gap-3 text-white/80 transition-colors hover:text-white"
              >
                <Phone className="h-4 w-4 text-brand" />
                {site.phones.join(' · ')}
              </a>
              <a
                href={`mailto:${site.email}`}
                className="flex items-center gap-3 text-white/80 transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4 text-brand" />
                {site.email}
              </a>
              <p className="flex items-center gap-3 text-white/80">
                <MapPin className="h-4 w-4 text-brand" />
                {site.location.address}
              </p>
            </div>
          </div>

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
              Rreth nesh
            </Link>
            <Link href="/kontakt" className="hover:text-white/70">
              Kontakt
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
