import type { Vehicle } from '@/types/vehicle';
import { site } from '@/lib/site';
import {
  bodyTypeLabels,
  driveLabels,
  fuelLabels,
  transmissionLabels,
} from '@/lib/labels';
import { formatMileage, formatPrice, slugify } from '@/lib/utils';

/**
 * Build a ready-to-post Albanian social caption for a vehicle — used by the
 * social RSS feed that a no-code tool (Make/Buffer/Zapier) publishes to
 * Instagram & Facebook.
 */
export function buildSocialCaption(v: Vehicle): string {
  const name = `${v.brand} ${v.model}${v.variant ? ` ${v.variant}` : ''}`.trim();

  const specs = [
    `📅 ${v.year}`,
    `⏱️ ${formatMileage(v.mileageKm)}`,
    `⛽ ${fuelLabels[v.fuel]}`,
    `⚙️ ${transmissionLabels[v.transmission]}`,
  ];
  if (v.horsepower) specs.push(`🐎 ${v.horsepower} kf`);
  specs.push(`🚙 ${bodyTypeLabels[v.bodyType]}`);
  specs.push(`🎛️ ${driveLabels[v.drive]}`);

  const tags = [
    'autoconnect',
    'veturanekosove',
    'makinatekosove',
    'vetura',
    'makina',
    'kosova',
    'kosovo',
    'koreje',
    'importvetura',
    slugify(v.brand).replace(/-/g, ''),
    slugify(`${v.brand} ${v.model}`).replace(/-/g, ''),
  ];
  const hashtags = [...new Set(tags)].filter(Boolean).map((t) => `#${t}`).join(' ');

  return [
    `🚗 ${name} — ${v.year}`,
    '',
    specs.join('  ·  '),
    `💶 Çmimi: ${formatPrice(v.price)}`,
    '',
    '✅ E importuar nga Koreja e Jugut',
    '✅ Inspektim i plotë · Çmim final, pa taksa shtesë',
    '✅ Dorëzim në Kosovë brenda 35–45 ditësh',
    '',
    `📞 ${site.phones.join(' / ')}`,
    `🔗 ${site.url}/vetura/${v.slug}`,
    '',
    hashtags,
  ].join('\n');
}
