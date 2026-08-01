/**
 * Encar source-listing helpers.
 *
 * Our inventory originates from Encar (via Carapis). The upstream detail URL is
 * NOT persisted, but every Encar photo URL embeds the listing id, e.g.
 *   https://ci.encar.com/carpicture10/pic4220/42207665_001.jpg
 *                                     └pic{4}┘ └── carid (42207665) ──┘
 * so we can reconstruct the original Encar listing from any vehicle image.
 *
 * This is used ONLY on owner-gated surfaces (admin panel, admin-session view of
 * a vehicle page) so the operator can check the real Korean price. It is never
 * exposed to customers.
 */

/** Matches the Encar listing id inside a photo path: `/pic4220/42207665_001.jpg`. */
const ENCAR_ID_RE = /\/pic\d+\/(\d{6,})_/i;

type ImageLike = { url?: string | null } | string | null | undefined;

function urlOf(img: ImageLike): string | null {
  if (!img) return null;
  if (typeof img === 'string') return img;
  return img.url ?? null;
}

/** Extract the Encar listing id from a single image URL, or null. */
export function encarCarIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = ENCAR_ID_RE.exec(url);
  return m ? m[1] : null;
}

/**
 * Build the Encar detail URL for a vehicle from its images.
 * Returns null when no image yields a recognisable Encar id (e.g. non-Encar
 * source or a re-hosted photo).
 */
export function encarListingUrl(
  images: ImageLike[] | null | undefined,
): string | null {
  if (!Array.isArray(images)) return null;
  for (const img of images) {
    const id = encarCarIdFromUrl(urlOf(img));
    if (id) return `https://fem.encar.com/cars/detail/${id}`;
  }
  return null;
}
