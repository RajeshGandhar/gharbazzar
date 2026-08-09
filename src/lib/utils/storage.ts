// Supabase Storage URL helpers — public-bucket object paths to fetchable URLs.

/**
 * Tiny inline shimmer SVG for use as blurDataURL on remote images.
 * Renders a neutral gradient pulse that matches both light and dark themes.
 */
export const SHIMMER_DATA_URL =
  "data:image/svg+xml;base64," +
  btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
      <rect width="400" height="300" fill="#e2e8f0"/>
      <rect width="400" height="300" fill="url(#g)"/>
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#e2e8f0"/><stop offset="50%" stop-color="#f1f5f9"/><stop offset="100%" stop-color="#e2e8f0"/>
      </linearGradient></defs>
    </svg>`
  );

/** Build a public Supabase Storage URL for an object path in a given bucket. */
export function getStorageUrl(bucket: string, path: string | null | undefined): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!path || !supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/** Convenience wrapper for the `property-images` bucket. */
export function getPropertyImageUrl(path: string | null | undefined): string | null {
  return getStorageUrl("property-images", path);
}

type PropertyImageRef = {
  path: string;
  thumbnail_path?: string | null;
  is_cover: boolean;
  position?: number | null;
};

/**
 * Pick the cover image from a joined `property_images` array and resolve it
 * to a public URL. Falls back to the lowest-position image, then the first.
 */
export function resolveCoverImageUrl(
  images: PropertyImageRef[] | null | undefined,
  opts: { thumbnail?: boolean } = {}
): string | null {
  if (!images || images.length === 0) return null;
  const sorted = [...images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const cover = sorted.find((img) => img.is_cover) ?? sorted[0];
  const path = opts.thumbnail ? cover.thumbnail_path ?? cover.path : cover.path;
  return getPropertyImageUrl(path);
}

/**
 * Resolve a joined `property_images` array to an ordered list of public URLs,
 * cover image first, then by position — for card/gallery carousels.
 */
export function resolveOrderedImageUrls(
  images: PropertyImageRef[] | null | undefined,
  opts: { thumbnail?: boolean; limit?: number } = {}
): string[] {
  if (!images || images.length === 0) return [];
  const sorted = [...images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const coverIdx = sorted.findIndex((img) => img.is_cover);
  const ordered = coverIdx > 0 ? [sorted[coverIdx], ...sorted.filter((_, i) => i !== coverIdx)] : sorted;
  const limited = opts.limit ? ordered.slice(0, opts.limit) : ordered;
  return limited
    .map((img) => getPropertyImageUrl(opts.thumbnail ? img.thumbnail_path ?? img.path : img.path))
    .filter((url): url is string => url !== null);
}
