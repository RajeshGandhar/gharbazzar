"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const inquiryFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  message: z.string().max(1000).optional(),
});

type InquiryFormValues = z.infer<typeof inquiryFormSchema>;

interface InquiryFormProps {
  propertyId: string;
  onSuccess?: () => void;
}

export function InquiryForm({ propertyId, onSuccess }: InquiryFormProps) {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquiryFormSchema),
  });

  async function onSubmit(values: InquiryFormValues) {
    try {
      const res = await fetch(`/api/v1/properties/${propertyId}/inquire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, source: "form" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? "Failed to send inquiry");
      }

      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send inquiry. Please try again.");
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="rounded-full bg-primary/10 p-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">Inquiry sent!</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Your inquiry was sent. The seller will be notified on WhatsApp and will contact you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inquiry-name">Your name *</Label>
        <Input
          id="inquiry-name"
          placeholder="Full name"
          autoComplete="name"
          {...register("name")}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inquiry-phone">Mobile number *</Label>
        <Input
          id="inquiry-phone"
          type="tel"
          placeholder="10-digit mobile"
          autoComplete="tel"
          inputMode="numeric"
          maxLength={10}
          {...register("phone")}
          aria-invalid={!!errors.phone}
        />
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inquiry-message">Message (optional)</Label>
        <Textarea
          id="inquiry-message"
          placeholder="Any specific requirements or questions..."
          rows={3}
          {...register("message")}
          aria-invalid={!!errors.message}
        />
        {errors.message && (
          <p className="text-xs text-destructive">{errors.message.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          "Send inquiry"
        )}
      </Button>

      <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
        GharBazaar is a discovery platform, not a party to any transaction.{" "}
        <strong>Never pay deposits before visiting the property.</strong>
      </p>
    </form>
  );
}
