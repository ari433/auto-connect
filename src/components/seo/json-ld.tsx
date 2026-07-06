import { site } from '@/lib/site';
import { fuelLabels, bodyTypeLabels } from '@/lib/labels';
import type { Vehicle } from '@/types/vehicle';

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'AutoDealer',
        name: site.name,
        description: site.description,
        url: site.url,
        telephone: site.phones,
        email: site.email,
        address: {
          '@type': 'PostalAddress',
          addressLocality: site.location.city,
          addressCountry: site.location.countryCode,
        },
        areaServed: 'XK',
        priceRange: '€€€',
      }}
    />
  );
}

export function VehicleJsonLd({ vehicle }: { vehicle: Vehicle }) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Car',
        name: `${vehicle.brand} ${vehicle.model} ${vehicle.variant ?? ''}`.trim(),
        brand: { '@type': 'Brand', name: vehicle.brand },
        model: vehicle.model,
        vehicleModelDate: String(vehicle.year),
        bodyType: bodyTypeLabels[vehicle.bodyType],
        fuelType: fuelLabels[vehicle.fuel],
        color: vehicle.exteriorColor,
        vehicleTransmission: vehicle.transmission,
        mileageFromOdometer: {
          '@type': 'QuantitativeValue',
          value: vehicle.mileageKm,
          unitCode: 'KMT',
        },
        image: vehicle.images.map((i) => i.url),
        offers: {
          '@type': 'Offer',
          priceCurrency: 'EUR',
          price: vehicle.price,
          availability:
            vehicle.status === 'AVAILABLE'
              ? 'https://schema.org/InStock'
              : 'https://schema.org/LimitedAvailability',
          seller: { '@type': 'AutoDealer', name: site.name },
        },
      }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          item: `${site.url}${item.url}`,
        })),
      }}
    />
  );
}
