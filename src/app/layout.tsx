import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { site } from '@/lib/site';
import { FavoritesProvider } from '@/components/favorites/favorites-provider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { WhatsAppButton } from '@/components/layout/whatsapp-button';
import { PageViewTracker } from '@/components/analytics/page-view-tracker';
import { OrganizationJsonLd } from '@/components/seo/json-ld';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    'AUTO CONNECT',
    'vetura nga Koreja',
    'import veturash Kosovë',
    'makina premium',
    'automjete të përdorura',
    'blej veturë Kosovë',
  ],
  authors: [{ name: site.name }],
  appleWebApp: {
    capable: true,
    title: site.name,
    statusBarStyle: 'default',
  },
  openGraph: {
    type: 'website',
    locale: 'sq_AL',
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    images: [{ url: '/logo-auto-connect.png', width: 798, height: 307, alt: site.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    images: ['/logo-auto-connect.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
};

export const viewport: Viewport = {
  themeColor: '#111111',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sq" className={inter.variable}>
      <body className="min-h-screen antialiased">
        <OrganizationJsonLd />
        <FavoritesProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <WhatsAppButton />
          <PageViewTracker />
        </FavoritesProvider>
      </body>
    </html>
  );
}
