import {
  bodyTypeLabels,
  driveLabels,
  fuelLabels,
  transmissionLabels,
} from '@/lib/labels';
import { formatMileage, formatNumber } from '@/lib/utils';
import type { Vehicle } from '@/types/vehicle';

export function SpecGrid({ vehicle }: { vehicle: Vehicle }) {
  const specs: { label: string; value: string }[] = [
    { label: 'Viti', value: String(vehicle.year) },
    { label: 'Kilometrazha', value: formatMileage(vehicle.mileageKm) },
    { label: 'Karburanti', value: fuelLabels[vehicle.fuel] },
    { label: 'Transmisioni', value: transmissionLabels[vehicle.transmission] },
    { label: 'Motori', value: vehicle.engineLabel },
    {
      label: 'Kubikazha',
      value: vehicle.engineCc ? `${formatNumber(vehicle.engineCc)} cc` : '—',
    },
    { label: 'Fuqia', value: vehicle.horsepower ? `${vehicle.horsepower} kf` : '—' },
    { label: 'Transmetimi', value: driveLabels[vehicle.drive] },
    { label: 'Karoseria', value: bodyTypeLabels[vehicle.bodyType] },
    { label: 'Ngjyra e jashtme', value: vehicle.exteriorColor },
    { label: 'Ngjyra e brendshme', value: vehicle.interiorColor ?? '—' },
    {
      label: 'Dyer / Ulëse',
      value: `${vehicle.doors ?? '—'} / ${vehicle.seats ?? '—'}`,
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
      {specs.map((s) => (
        <div key={s.label} className="border-b border-surface-border pb-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            {s.label}
          </dt>
          <dd className="mt-1 text-[0.95rem] font-medium text-ink">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
