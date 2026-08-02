import type { NextRequest } from 'next/server';

/**
 * Image proxy for source (Encar) photos.
 *
 * End users — especially in Kosovo/Albania — load photos slowly and unreliably
 * straight from the Korean CDN (ci.encar.com), so most cards render a blank
 * placeholder and the storefront looks half-empty. This route fetches the photo
 * server-side from Vercel's Frankfurt edge (fast backbone to Korea), then caches
 * it immutably at the edge so every later view is served instantly from Europe.
 *
 * Only Encar hosts are allowed (no open proxy / SSRF), and we always request the
 * BARE url because the CDN returns an unrenderable `multipart/form-data` body for
 * any `?impolicy=` variant.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_HOST = /(^|\.)encar\.com$/i;

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('u');
  if (!raw) return new Response('missing u', { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response('bad url', { status: 400 });
  }
  if (target.protocol !== 'https:' || !ALLOWED_HOST.test(target.hostname)) {
    return new Response('forbidden host', { status: 403 });
  }

  // Always fetch the bare URL — sized variants return broken multipart bodies.
  const bare = `${target.origin}${target.pathname}`;

  try {
    const upstream = await fetch(bare, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        Referer: 'https://autoconnect-korea.com/',
        Accept: 'image/avif,image/webp,image/jpeg,image/*,*/*;q=0.8',
      },
      cache: 'force-cache',
    });

    if (!upstream.ok || !upstream.body) {
      return new Response('upstream error', { status: 502 });
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
    // Reject the broken multipart response defensively.
    if (contentType.includes('multipart')) {
      return new Response('unrenderable upstream', { status: 502 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Immutable: an Encar photo URL never changes its bytes.
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      },
    });
  } catch {
    return new Response('fetch failed', { status: 502 });
  }
}
