import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

/**
 * Web App Manifest — lets visitors install AUTO CONNECT to their home screen.
 * On "Add to Home Screen" it launches standalone (no browser chrome) with the
 * AUTO CONNECT logo as the app icon.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — ${site.tagline}`,
    short_name: site.name,
    description: site.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    lang: 'sq',
    dir: 'ltr',
    categories: ['shopping', 'automotive', 'business'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
