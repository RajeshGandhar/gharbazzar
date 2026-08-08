import { z } from "zod";

export const REJECTION_REASONS = [
  { code: "PHOTOS_INSUFFICIENT",   label: "Insufficient photos",      hint: "Upload at least 3 real photos of the property." },
  { code: "PHOTOS_FAKE",           label: "Fake or stock photos",     hint: "Use only actual photos of this property." },
  { code: "PRICE_IMPLAUSIBLE",     label: "Price seems wrong",        hint: "Verify the price and update before resubmitting." },
  { code: "LOCATION_MISMATCH",     label: "Location mismatch",        hint: "The pin doesn't match the stated locality." },
  { code: "DUPLICATE",             label: "Duplicate listing",        hint: "This property appears to be already listed." },
  { code: "CONTENT_POLICY",          label: "Content policy violation",   hint: "Remove phone numbers, links, or offensive content from the description." },
  { code: "DISCRIMINATORY_CONTENT",  label: "Discriminatory content",     hint: "Listings may not exclude tenants or buyers based on caste, religion, or community. Remove this language before resubmitting." },
  { code: "INCOMPLETE",              label: "Incomplete listing",         hint: "Fill in all required fields before resubmitting." },
  { code: "SUSPECTED_FRAUD",         label: "Suspected fraud",            hint: "This listing has been flagged for review by our trust team." },
] as const;

export type RejectionCode = typeof REJECTION_REASONS[number]["code"];

export const approveSchema = z.object({});

export const rejectSchema = z.object({
  reason_code: z.enum([
    "PHOTOS_INSUFFICIENT",
    "PHOTOS_FAKE",
    "PRICE_IMPLAUSIBLE",
    "LOCATION_MISMATCH",
    "DUPLICATE",
    "CONTENT_POLICY",
    "DISCRIMINATORY_CONTENT",
    "INCOMPLETE",
    "SUSPECTED_FRAUD",
  ]),
  internal_notes: z.string().max(1000).optional(),
});

export const strikeSchema = z.object({
  reason_code: z.string().min(1),
  details: z.string().max(500).optional(),
  expires_at: z.string().optional(),
});

export const replySchema = z.object({
  body: z.string().min(1).max(5000),
  is_internal: z.boolean().optional(),
});

export const prospectSchema = z.object({
  prospect_name: z.string().min(2),
  prospect_phone: z.string().regex(/^[6-9]\d{9}$/),
  seller_type: z.enum(["owner", "agent", "builder", "property_manager"]),
  city_id: z.number().optional(),
  locality_note: z.string().optional(),
  assignee_id: z.string().uuid().optional(),
  next_action_at: z.string().optional(),
});

export const settingSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
});

export const addCitySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  district: z.string().min(2),
  state: z.string().min(2),
  region_id: z.number().optional(),
  position: z.number().optional(),
});

export const addAreaSchema = z.object({
  city_id: z.number(),
  name: z.string().min(2),
  slug: z.string().min(2),
  pincode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const addUniversitySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  city_id: z.number(),
  institution_type: z.enum(["university", "college", "coaching_hub", "school"]),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  website: z.string().url().optional(),
  logo_url: z.string().url().optional(),
});

export const addAmenitySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  icon: z.string().optional(),
});

export const addPropertyTypeSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  category: z.enum([
    "residential",
    "commercial",
    "land",
    "industrial",
    "agricultural",
  ]),
  position: z.number().optional(),
});
