import { z } from "zod";

// ---------------------------------------------------------------------------
// Seller profile schemas
// ---------------------------------------------------------------------------

export const updateSellerProfileSchema = z.object({
  business_name: z.string().min(2).max(120).optional(),
  about: z.string().max(1000).optional(),
  experience_years: z.number().int().min(0).max(60).optional(),
  office_address: z.string().max(300).optional(),
  city_id: z.number().int().positive().optional(),
  whatsapp_number: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")
    .optional(),
  website: z.string().url().optional().or(z.literal("")),
  rera_number: z.string().max(50).optional(),
});

export const updateMyProfileSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")
    .optional(),
  avatar_url: z.string().url().optional(),
});

export const savedSearchSchema = z.object({
  name: z.string().min(1).max(60),
  purpose: z.enum(["sale", "rent", "lease"]).optional(),
  filters: z.record(z.string(), z.unknown()).default({}),
  frequency: z.enum(["instant", "daily", "off"]).default("instant"),
  email_alerts: z.boolean().default(true),
});

export type UpdateSellerProfileInput = z.infer<typeof updateSellerProfileSchema>;
export type UpdateMyProfileInput     = z.infer<typeof updateMyProfileSchema>;
export type SavedSearchInput         = z.infer<typeof savedSearchSchema>;
