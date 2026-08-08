"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number").or(z.literal("")),
});

type ProfileValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialName: string;
  initialPhone: string;
}

export function ProfileForm({ initialName, initialPhone }: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: initialName, phone: initialPhone },
  });

  async function onSubmit(values: ProfileValues) {
    try {
      const res = await fetch("/api/v1/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: values.full_name,
          phone: values.phone || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? "Failed to save");
      }
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Personal Information</h2>

      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full name *</Label>
        <Input
          id="full_name"
          placeholder="Your full name"
          autoComplete="name"
          {...register("full_name")}
          aria-invalid={!!errors.full_name}
        />
        {errors.full_name && (
          <p className="text-xs text-destructive">{errors.full_name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Mobile number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="10-digit mobile (optional)"
          autoComplete="tel"
          inputMode="numeric"
          maxLength={10}
          {...register("phone")}
          aria-invalid={!!errors.phone}
        />
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone.message}</p>
        )}
        <p className="text-xs text-muted-foreground">Used to contact you about inquiries and for account recovery if you lose email access. Never shared publicly.</p>
      </div>

      <Button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
        Save changes
      </Button>
    </form>
  );
}
