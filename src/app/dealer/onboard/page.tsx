"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Briefcase,
  Building2,
  ClipboardList,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type SellerType = "owner" | "agent" | "builder" | "property_manager";

const SELLER_TYPES: {
  type: SellerType;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    type: "owner",
    label: "Owner",
    description: "I own the property and want to sell or rent it directly.",
    icon: User,
  },
  {
    type: "agent",
    label: "Real Estate Agent",
    description: "I represent buyers and sellers as a licensed broker.",
    icon: Briefcase,
  },
  {
    type: "builder",
    label: "Builder / Developer",
    description: "I develop and sell new residential or commercial projects.",
    icon: Building2,
  },
  {
    type: "property_manager",
    label: "Property Manager",
    description: "I manage rental properties on behalf of landlords.",
    icon: ClipboardList,
  },
];

interface Step2Data {
  full_name: string;
  whatsapp_number: string;
  business_name: string;
  city_id: string;
}

interface Step3Data {
  about: string;
  website: string;
  rera_number: string;
}

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [sellerType, setSellerType] = useState<SellerType | null>(null);
  const [step2, setStep2] = useState<Step2Data>({
    full_name: "",
    whatsapp_number: "",
    business_name: "",
    city_id: "",
  });
  const [step3, setStep3] = useState<Step3Data>({
    about: "",
    website: "",
    rera_number: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const requiresBusiness = sellerType === "agent" || sellerType === "builder" || sellerType === "property_manager";
  const showRera = sellerType === "agent" || sellerType === "builder";

  function validateStep2(): boolean {
    const errs: Record<string, string> = {};
    if (!step2.full_name.trim()) errs.full_name = "Full name is required";
    if (!/^[6-9]\d{9}$/.test(step2.whatsapp_number)) {
      errs.whatsapp_number = "Enter a valid 10-digit WhatsApp number";
    }
    if (requiresBusiness && !step2.business_name.trim()) {
      errs.business_name = "Business name is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validateStep2()) return;
    setLoading(true);
    setServerError(null);

    try {
      const body: Record<string, unknown> = {
        seller_type: sellerType,
        whatsapp_number: step2.whatsapp_number,
      };
      if (step2.business_name.trim()) body.business_name = step2.business_name.trim();
      if (step2.city_id) body.city_id = parseInt(step2.city_id, 10);
      if (step3.about.trim()) body.about = step3.about.trim();
      if (step3.website.trim()) body.website = step3.website.trim();
      if (step3.rera_number.trim()) body.rera_number = step3.rera_number.trim();

      const res = await fetch("/api/v1/seller/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setServerError(err?.error?.message ?? "Failed to complete onboarding. Please try again.");
        return;
      }

      router.push("/dealer/dashboard");
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Set up your seller profile</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Step {step} of 3 — {step === 1 ? "Choose your seller type" : step === 2 ? "Basic details" : "Optional details"}
          </p>

          {/* Progress bar */}
          <div className="flex gap-2 mt-4 justify-center">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1.5 w-16 rounded-full transition-colors",
                  s <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>

        {/* Step 1 — Seller type */}
        {step === 1 && (
          <div className="space-y-4">
            {SELLER_TYPES.map(({ type, label, description, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setSellerType(type)}
                className={cn(
                  "w-full flex items-start gap-4 rounded-xl border p-4 text-left transition-all",
                  sellerType === type
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg p-2 shrink-0",
                    sellerType === type ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
              </button>
            ))}

            <Button
              className="w-full mt-2"
              disabled={!sellerType}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2 — Basic details */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={step2.full_name}
                onChange={(e) => setStep2((p) => ({ ...p, full_name: e.target.value }))}
                placeholder="Your full name"
                className="mt-1"
              />
              {errors.full_name && <p className="text-xs text-destructive mt-1">{errors.full_name}</p>}
            </div>

            <div>
              <Label htmlFor="whatsapp_number">WhatsApp number</Label>
              <div className="flex mt-1">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">
                  +91
                </span>
                <Input
                  id="whatsapp_number"
                  value={step2.whatsapp_number}
                  onChange={(e) => setStep2((p) => ({ ...p, whatsapp_number: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                  placeholder="9876543210"
                  className="rounded-l-none"
                  inputMode="numeric"
                />
              </div>
              {errors.whatsapp_number && (
                <p className="text-xs text-destructive mt-1">{errors.whatsapp_number}</p>
              )}
            </div>

            <div>
              <Label htmlFor="business_name">
                Business / agency name
                {!requiresBusiness && <span className="text-muted-foreground ml-1 text-xs">(optional)</span>}
              </Label>
              <Input
                id="business_name"
                value={step2.business_name}
                onChange={(e) => setStep2((p) => ({ ...p, business_name: e.target.value }))}
                placeholder={requiresBusiness ? "Your business name" : "Optional"}
                className="mt-1"
              />
              {errors.business_name && (
                <p className="text-xs text-destructive mt-1">{errors.business_name}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button className="flex-1" onClick={() => {
                if (validateStep2()) setStep(3);
              }}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Optional details */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="about">About you / your business <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                id="about"
                value={step3.about}
                onChange={(e) => setStep3((p) => ({ ...p, about: e.target.value }))}
                placeholder="Tell seekers about your experience and what makes you unique..."
                rows={4}
                className="mt-1 resize-none"
                maxLength={1000}
              />
            </div>

            <div>
              <Label htmlFor="website">Website <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="website"
                type="url"
                value={step3.website}
                onChange={(e) => setStep3((p) => ({ ...p, website: e.target.value }))}
                placeholder="https://yourwebsite.com"
                className="mt-1"
              />
            </div>

            {showRera && (
              <div>
                <Label htmlFor="rera_number">RERA registration number <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  id="rera_number"
                  value={step3.rera_number}
                  onChange={(e) => setStep3((p) => ({ ...p, rera_number: e.target.value }))}
                  placeholder="UP-RERA-..."
                  className="mt-1"
                />
              </div>
            )}

            {serverError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {serverError}
              </p>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Setting up...
                  </>
                ) : (
                  "Complete setup"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
