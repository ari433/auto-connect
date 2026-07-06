import type { Vehicle } from '@/types/vehicle';
import {
  bodyTypeLabels,
  driveLabels,
  fuelLabels,
  transmissionLabels,
} from '@/lib/labels';
import { formatMileage, formatNumber } from '@/lib/utils';

/**
 * Build a clean, professional Albanian description from a vehicle's real data.
 * We deliberately ignore the upstream free-text (long, English) and compose a
 * concise, on-brand paragraph instead.
 */
export function describeVehicle(v: Vehicle): string {
  const name = `${v.brand} ${v.model}${v.variant ? ` ${v.variant}` : ''}`;
  const sentences: string[] = [];

  sentences.push(
    `${name}, prodhim i vitit ${v.year}, me ${formatMileage(v.mileageKm)} të kaluara.`,
  );

  const engine = v.engineCc
    ? `${v.engineLabel} (${formatNumber(v.engineCc)} cc)`
    : v.engineLabel;
  const specParts = [
    `motorizim ${engine}`,
    fuelLabels[v.fuel].toLowerCase(),
    `transmision ${transmissionLabels[v.transmission].toLowerCase()}`,
    `tërheqje ${driveLabels[v.drive]}`,
  ];
  if (v.seats) specParts.push(`${v.seats} ulëse`);
  sentences.push(`Karoseri ${bodyTypeLabels[v.bodyType].toLowerCase()} me ${specParts.join(', ')}.`);

  const condition: string[] = [];
  if (v.ownerCount && v.ownerCount > 0)
    condition.push(v.ownerCount === 1 ? 'një pronar i vetëm' : `${v.ownerCount} pronarë`);
  if (v.hasAccident === false) condition.push('pa histori aksidentesh');
  if (v.inspectionPassed) condition.push('e inspektuar dhe e verifikuar');
  if (condition.length) {
    sentences.push(`Gjendje: ${condition.join(', ')}.`);
  }

  sentences.push(
    'E importuar drejtpërdrejt nga Koreja e Jugut dhe e përgatitur nga AUTO CONNECT — me çmim transparent, dokumentacion të plotë dhe dorëzim të garantuar në Kosovë.',
  );

  return sentences.join(' ');
}
