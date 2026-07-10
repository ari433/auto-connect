/**
 * Central brand & company configuration.
 * Single source of truth for anything customer-facing about AUTO CONNECT.
 */

export const site = {
  name: 'AUTO CONNECT',
  legalName: 'AUTO CONNECT',
  tagline: 'Vetura premium nga Koreja e Jugut',
  description:
    'AUTO CONNECT importon vetura premium nga Koreja e Jugut. Zbuloni inventarin tonë të përzgjedhur, me çmime transparente dhe dorëzim deri në Kosovë.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://autoconnect-ks.com',
  locale: 'sq-AL',
  location: {
    city: 'Milloshevë',
    country: 'Kosovë',
    countryCode: 'XK',
    address: 'Milloshevë, Kosovë',
  },
  phones: ['045 832 382', '044 250 572'],
  email: 'info@autoconnect-ks.com',
  hours: [
    { day: 'E hënë – E premte', time: '09:00 – 19:00' },
    { day: 'E shtunë', time: '09:00 – 16:00' },
    { day: 'E diel', time: 'Me termin' },
  ],
  social: {
    instagram: 'https://www.instagram.com/autoo.connect/',
  },
} as const;

/** Primary customer navigation. */
export const mainNav = [
  { label: 'Inventari', href: '/inventari' },
  { label: 'Asistenti', href: '/asistenti' },
  { label: 'Rreth nesh', href: '/rreth-nesh' },
  { label: 'Kontakt', href: '/kontakt' },
] as const;

export const footerNav = {
  Inventari: [
    { label: 'Të gjitha veturat', href: '/inventari' },
    { label: 'Të sapoardhura', href: '/inventari?sort=newest' },
    { label: 'Të preferuarat', href: '/te-preferuarat' },
    { label: 'Kërko', href: '/inventari' },
  ],
  Kompania: [
    { label: 'Rreth nesh', href: '/rreth-nesh' },
    { label: 'Procesi i importit', href: '/rreth-nesh#procesi' },
    { label: 'Asistenti virtual', href: '/asistenti' },
    { label: 'Kontakt', href: '/kontakt' },
  ],
  Ndihmë: [
    { label: 'Pyetje të shpeshta', href: '/rreth-nesh#faq' },
    { label: 'Të preferuarat', href: '/te-preferuarat' },
  ],
} as const;
