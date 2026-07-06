import {
  bodyTypeLabels,
  driveLabels,
  fuelLabels,
  transmissionLabels,
} from '@/lib/labels';
import { formatMileage, formatNumber } from '@/lib/utils';
import type { Vehicle } from '@/types/vehicle';

/** Complete specifications table — every known detail, in Albanian. */
export function SpecGrid({ vehicle: v }: { vehicle: Vehicle }) {
  const rows: { label: string; value: string }[] = [];
  const add = (label: string, value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return;
    rows.push({ label, value: String(value) });
  };

  add('Marka', v.brand);
  add('Modeli', v.model);
  add('Varianti', v.variant);
  add('Gjenerata', v.generation);
  add('Viti i prodhimit', v.year);
  add('Kilometrazha', formatMileage(v.mileageKm));
  add('Karburanti', fuelLabels[v.fuel]);
  add('Transmisioni', transmissionLabels[v.transmission]);
  add('Motori', v.engineLabel);
  add('Kubikazha', v.engineCc ? `${formatNumber(v.engineCc)} cc` : null);
  add('Fuqia', v.horsepower ? `${v.horsepower} kf` : null);
  add('Tërheqja', driveLabels[v.drive]);
  add('Karoseria', bodyTypeLabels[v.bodyType]);
  add('Ngjyra e jashtme', v.exteriorColor);
  add('Ngjyra e brendshme', v.interiorColor);
  add('Numri i dyerve', v.doors);
  add('Numri i ulëseve', v.seats);
  add(
    'Numri i pronarëve',
    v.ownerCount ? (v.ownerCount === 1 ? '1 (një pronar)' : v.ownerCount) : null,
  );
  if (v.hasAccident === true) add('Historia e aksidenteve', 'Ka pasur aksident');
  if (v.hasAccident === false) add('Historia e aksidenteve', 'Pa aksidente');
  if (v.inspectionPassed) add('Inspektimi teknik', 'I kaluar / i verifikuar');

  return (
    <div className="overflow-hidden rounded-2xl border border-surface-border">
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.label}
              className={i % 2 === 0 ? 'bg-white' : 'bg-surface-subtle'}
            >
              <th
                scope="row"
                className="w-1/2 border-b border-surface-border px-4 py-3 text-left font-medium text-ink-muted sm:w-2/5"
              >
                {r.label}
              </th>
              <td className="border-b border-surface-border px-4 py-3 font-medium text-ink">
                {r.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
