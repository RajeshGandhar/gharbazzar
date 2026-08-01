import { z } from "zod";

// ---------------------------------------------------------------------------
// Search Zod schema — validated on both client and API route
// ---------------------------------------------------------------------------

export const searchSchema = z.object({
  q: z.string().max(200).optional(),
  purpose: z.enum(["sale", "rent", "lease"]).optional(),
  city: z.string().optional(),        // city slug
  area: z.string().optional(),        // area slug
  min_price: z.coerce.number().positive().optional(),
  max_price: z.coerce.number().positive().optional(),
  bedrooms: z.coerce.number().int().min(0).max(10).optional(),
  property_type: z.string().optional(), // type slug
  rental_kind: z.enum(["standard", "student"]).optional(),
  gender_policy: z.enum(["any", "boys_only", "girls_only", "family_only"]).optional(),
  university: z.string().optional(),    // university slug
  max_distance: z.coerce.number().positive().max(20000).optional(), // metres
  furnishing: z.enum(["unfurnished", "semi_furnished", "fully_furnished"]).optional(),
  amenities: z.string().optional(), // comma-separated amenity slugs, e.g. "parking,lift"
  sort: z.enum(["price_asc", "price_desc", "newest", "popular", "distance"]).default("newest"),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
});

export type SearchInput = z.infer<typeof searchSchema>;
