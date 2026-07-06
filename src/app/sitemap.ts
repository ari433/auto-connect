import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';
import { getAllVehicleSlugs } from '@/lib/search/engine';
import { safe } from '@/lib/db-safe';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.url;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/inventari`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/financimi`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/asistenti`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/rreth-nesh`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/kontakt`, changeFrequency: 'monthly', priority: 0.5 },
  ];

  const slugs = await safe(() => getAllVehicleSlugs(), []);
  const vehicleRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${base}/vetura/${slug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...vehicleRoutes];
}
