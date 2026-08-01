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
  // Canonical production domain. We intentionally do NOT read
  // NEXT_PUBLIC_SITE_URL here: on Vercel it was set to a now-paused
  // *.vercel.app deployment domain, which made WhatsApp/social links,
  // canonicals and og:url point at a dead "deployment paused" page.
  url: 'https://autoconnect-korea.com',
  locale: 'sq-AL',
  location: {
    city: 'Milloshevë',
    country: 'Kosovë',
    countryCode: 'XK',
    address: 'Milloshevë, Kosovë',
  },
  phones: ['045 832 382', '044 250 572'],
  email: 'autooconnect1@gmail.com',
  hours: [
    { day: 'E hënë – E premte', time: '09:00 – 19:00' },
    { day: 'E shtunë', time: '09:00 – 16:00' },
    { day: 'E diel', time: 'Me termin' },
  ],
  social: {
    instagram: 'https://www.instagram.com/autoo.connect/',
  },
} as const;

/**
 * Primary customer navigation.
 * Mirrors the koreakosovaauto.com menu: Ballina · Shfleto Veturat · Procesi · FAQ · Kontakt.
 * Procesi and FAQ are homepage sections (anchors); the rest are pages.
 */
export const mainNav = [
  { label: 'Ballina', href: '/' },
  { label: 'Shfleto Veturat', href: '/inventari' },
  { label: 'Procesi', href: '/#procesi' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Kontakt', href: '/#kontakt' },
] as const;

/** Footer "Linqe Të Shpejta" — same quick links as the header. */
export const footerNav = {
  'Linqe Të Shpejta': [
    { label: 'Ballina', href: '/' },
    { label: 'Shfleto Veturat', href: '/inventari' },
    { label: 'Procesi', href: '/#procesi' },
    { label: 'FAQ', href: '/#faq' },
    { label: 'Kontakt', href: '/#kontakt' },
  ],
} as const;
