// Supabase Storage URL helpers — public-bucket object paths to fetchable URLs.

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
