'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Records a page view on every route change (except the admin area). Fire and
 * forget with keepalive so it survives the navigation that triggered it.
 */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, referrer: document.referrer || null }),
      keepalive: true,
    }).catch(() => {
      /* analytics must never disturb the page */
    });
  }, [pathname]);

  return null;
}
