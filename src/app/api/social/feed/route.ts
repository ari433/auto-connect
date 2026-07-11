import { getLatestVehicles } from '@/lib/catalog';
import { safe } from '@/lib/db-safe';
import { buildSocialCaption } from '@/lib/social/caption';
import { site } from '@/lib/site';
import { formatPrice } from '@/lib/utils';

/**
 * Social publishing feed (RSS 2.0).
 *
 * A no-code automation (Make.com / Zapier / Buffer) watches this feed and posts
 * each new vehicle to Instagram & Facebook — with its photo and a ready-made
 * Albanian caption. New arrivals appear here automatically; the tool controls
 * how many are posted per day, so it never floods the feed.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FEED_SIZE = Number(process.env.SOCIAL_FEED_SIZE ?? 40);

function esc(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] as string,
  );
}

export async function GET() {
  const vehicles = await safe(() => getLatestVehicles(FEED_SIZE), []);

  const items = vehicles
    .map((v) => {
      const link = `${site.url}/vetura/${v.slug}`;
      const image = v.images[0]?.url ?? '';
      const caption = buildSocialCaption(v);
      const title = `${v.brand} ${v.model} ${v.year} — ${formatPrice(v.price)}`;
      const pubDate = new Date(v.createdAt).toUTCString();
      return [
        '    <item>',
        `      <title>${esc(title)}</title>`,
        `      <link>${esc(link)}</link>`,
        `      <guid isPermaLink="false">${esc(v.id)}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        `      <description>${esc(caption)}</description>`,
        image ? `      <enclosure url="${esc(image)}" type="image/jpeg" length="0" />` : '',
        image ? `      <media:content url="${esc(image)}" medium="image" />` : '',
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${esc(site.name)} — Vetura të reja</title>
    <link>${esc(site.url)}</link>
    <description>Vetura premium të importuara nga Koreja e Jugut</description>
    <language>sq</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
