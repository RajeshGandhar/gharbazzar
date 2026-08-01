"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server action: fetch an image from picsum.photos (server-side, so no CSP issues),
 * upload it to the `property-images` Supabase Storage bucket, then insert a
 * `property_images` row. Requires the calling user to be super_admin.
 *
 * @param propertyId  UUID of the property
 * @param imageIndex  0-based index used to pick a consistent picsum seed
 */
export async function seedPropertyImage(
  propertyId: string,
  imageIndex: number
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  // Auth guard — must be super_admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "super_admin")
    return { ok: false, error: "Insufficient permissions" };

  // Fetch image bytes from picsum.photos server-side (bypasses browser CSP)
  const picsumSeed = (imageIndex % 100) + 1; // seeds 1–100 for variety
  const url = `https://picsum.photos/seed/${picsumSeed}/800/600`;

  let imageBytes: ArrayBuffer;
  try {
    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok)
      return { ok: false, error: `picsum fetch failed: ${response.status}` };
    imageBytes = await response.arrayBuffer();
  } catch (e) {
    return { ok: false, error: `Network error fetching image: ${e}` };
  }

  // Upload to Supabase storage bucket `property-images`
  const storagePath = `seed/${propertyId}/cover.jpg`;
  const { error: uploadError } = await admin.storage
    .from("property-images")
    .upload(storagePath, imageBytes, {
      contentType: "image/jpeg",
      upsert: true, // allow re-seeding
    });

  if (uploadError)
    return { ok: false, error: `Storage upload failed: ${uploadError.message}` };

  // Upsert a property_images record (cover, position 0)
  // Remove any existing cover first so we don't accumulate duplicates on re-seed
  await admin
    .from("property_images")
    .delete()
    .eq("property_id", propertyId)
    .eq("path", storagePath);

  const { error: dbError } = await admin
    .from("property_images")
    .insert({
      property_id: propertyId,
      path: storagePath,
      is_cover: true,
      position: 0,
    });

  if (dbError)
    return { ok: false, error: `DB insert failed: ${dbError.message}` };

  return { ok: true, path: storagePath };
}
