import { z } from "zod";

// ---------------------------------------------------------------------------
// Property Zod schemas — shared between RHF forms and API route handlers
// ---------------------------------------------------------------------------

const purposeEnum = z.enum(["sale", "rent", "lease"]);
const propertyStatusEnum = z.enum(["draft", "active", "sold", "rented", "inactive", "expired"]);
const furnishingEnum = z.enum(["unfurnished", "semi_furnished", "fully_furnished"]);
const constructionStatusEnum = z.enum(["ready_to_move", "under_construction", "new_launch"]);
const ownershipEnum = z.enum(["freehold", "leasehold", "co_operative_society", "power_of_attorney"]);
const facingEnum = z.enum(["north", "south", "east", "west", "north_east", "north_west", "south_east", "south_west"]);
const rentalKindEnum = z.enum(["standard", "student"]);
const genderPolicyEnum = z.enum(["any", "boys_only", "girls_only", "family_only"]);
const messTypeEnum = z.enum(["veg", "veg_nonveg"]);

// Single source of truth for the Indian 6-digit PIN code format — import
// this instead of re-declaring the pattern in client-side validators (e.g.
// the seller listing wizard) so the two can't silently drift apart.
export const PINCODE_REGEX = /^\d{6}$/;

// --- Create / wizard step 1: basic info ---
export const propertyBasicSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(120),
  purpose: purposeEnum,
  property_type_id: z.number().int().positive(),
  rental_kind: rentalKindEnum.optional(),
  price: z.number().positive("Price must be positive"),
  is_negotiable: z.boolean().default(false),
  security_deposit: z.number().nonnegative().optional(),
  maintenance_charge: z.number().nonnegative().optional(),
});

// --- Wizard step 2: location ---
export const propertyLocationSchema = z.object({
  address: z.string().min(5, "Please enter a valid address"),
  landmark: z.string().max(120).optional(),
  city_id: z.number().int().positive(),
  area_id: z.number().int().positive().optional(),
  pincode: z.string().regex(PINCODE_REGEX, "Invalid pincode").optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

// --- Wizard step 3: details ---
export const propertyDetailsSchema = z.object({
  description: z.string().max(3000).default(""),
  built_up_area: z.number().positive().optional(),
  carpet_area: z.number().positive().optional(),
  plot_area: z.number().positive().optional(),
  area_unit: z.enum(["sqft", "sqm", "gaj", "acre", "marla"]).default("sqft"),
  bedrooms: z.number().int().min(0).max(50).optional(),
  bathrooms: z.number().int().min(0).max(50).optional(),
  balconies: z.number().int().min(0).max(50).optional(),
  kitchens: z.number().int().min(0).max(20).optional(),
  floor_number: z.number().int().optional(),
  total_floors: z.number().int().positive().optional(),
  parking_spaces: z.number().int().min(0).default(0),
  facing: facingEnum.optional(),
  property_age_years: z.number().int().min(0).optional(),
  construction_status: constructionStatusEnum.optional(),
  possession_date: z.string().date().optional(),
  ownership: ownershipEnum.optional(),
  furnishing: furnishingEnum.optional(),
  youtube_url: z.string().url().optional().or(z.literal("")),
  virtual_tour_url: z.string().url().optional().or(z.literal("")),
  // student housing extras
  gender_policy: genderPolicyEnum.default("any"),
  preferred_tenants: z.array(z.string()).default([]),
  available_from: z.string().date().optional(),
  lock_in_months: z.number().int().min(0).max(60).optional(),
  curfew_time: z.string().optional(),
  has_warden: z.boolean().optional(),
  mess_type: messTypeEnum.optional(),
});

// --- Full create schema (all steps combined) ---
export const createPropertySchema = propertyBasicSchema
  .merge(propertyLocationSchema)
  .merge(propertyDetailsSchema);

// --- Update: all fields optional, status transitions validated ---
export const updatePropertySchema = createPropertySchema.partial().extend({
  status: propertyStatusEnum.optional(),
  seo_title: z.string().max(70).optional(),
  seo_description: z.string().max(160).optional(),
});

// --- Admin approval ---
export const approvePropertySchema = z.object({
  approval_status: z.enum(["approved", "rejected"]),
  rejection_reason: z.string().max(500).optional(),
});

// --- Room type (PG/hostel per-bed inventory) ---
const mealPlanEnum = z.enum(["none", "breakfast_only", "two_meals", "three_meals"]);

export const roomTypeSchema = z.object({
  name: z.string().max(60).optional(),
  sharing_count: z.number().int().min(1).max(6),
  monthly_rent_per_bed: z.number().nonnegative(),
  security_deposit: z.number().nonnegative().optional(),
  is_ac: z.boolean().default(false),
  meal_plan: mealPlanEnum.default("none"),
  attached_bathroom: z.boolean().default(false),
  total_beds: z.number().int().positive().optional(),
  available_beds: z.number().int().min(0).default(0),
});

export const updateAmenitiesSchema = z.object({
  amenity_ids: z.array(z.number().int().positive()).max(100),
});

export type CreatePropertyInput   = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput   = z.infer<typeof updatePropertySchema>;
export type ApprovePropertyInput  = z.infer<typeof approvePropertySchema>;
export type RoomTypeInput         = z.infer<typeof roomTypeSchema>;
export type UpdateAmenitiesInput  = z.infer<typeof updateAmenitiesSchema>;
