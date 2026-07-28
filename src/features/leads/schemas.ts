import { z } from "zod";

// ---------------------------------------------------------------------------
// Lead / Inquiry schemas
// ---------------------------------------------------------------------------

export const createInquirySchema = z.object({
  property_id: z.string().uuid().optional(),
  name: z.string().min(2, "Name required").max(100),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  message: z.string().max(1000).optional(),
  source: z.enum(["form", "whatsapp", "call", "chat"]).default("form"),
});

export const updateInquiryStatusSchema = z.object({
  status: z.enum([
    "new",
    "contacted",
    "visit_scheduled",
    "negotiating",
    "closed_won",
    "closed_lost",
  ]),
  notes: z.string().max(500).optional(),
});

export const createVisitSchema = z.object({
  property_id: z.string().uuid(),
  scheduled_at: z
    .string()
    .datetime({ offset: true })
    .refine((d) => new Date(d) > new Date(), {
      message: "Visit must be in the future",
    }),
  notes: z.string().max(500).optional(),
});

export type CreateInquiryInput       = z.infer<typeof createInquirySchema>;
export type UpdateInquiryStatusInput = z.infer<typeof updateInquiryStatusSchema>;
export type CreateVisitInput         = z.infer<typeof createVisitSchema>;
