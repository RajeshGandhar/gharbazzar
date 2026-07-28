"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Loader2, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

interface ContactRevealProps {
  propertyId: string;
  propertyTitle: string;
  sellerName: string;
  propertySlug: string;
  whatsappNumber: string | null;
}

export function ContactReveal({
  propertyId,
  propertyTitle,
  sellerName,
  propertySlug,
  whatsappNumber,
}: ContactRevealProps) {
  const router = useRouter();
  const [consentOpen, setConsentOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);

  async function handleReveal() {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/auth/login?next=/property/${propertySlug}`);
        return;
      }

      const res = await fetch(`/api/v1/properties/${propertyId}/reveal`, {
        method: "POST",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? "Failed to reveal contact");
      }

      const data = (await res.json()) as { phone: string };
      setPhone(data.phone);
      setConsentOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not reveal number. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function copyPhone() {
    if (!phone) return;
    navigator.clipboard.writeText(phone).then(() => {
      toast.success("Number copied to clipboard");
    });
  }

  if (phone) {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs text-muted-foreground mb-1">Seller&apos;s mobile</p>
          <p className="text-xl font-bold text-foreground tracking-wide">
            +91 {phone}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={copyPhone}
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <a
            href={`tel:+91${phone}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            <Phone className="h-4 w-4" />
            Call
          </a>
        </div>
        {whatsappNumber && (
          <a
            href={`https://wa.me/91${whatsappNumber}?text=Hi%2C%20I%27m%20interested%20in%20${encodeURIComponent(propertyTitle)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 fill-current text-green-600"
              aria-hidden
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.12 1.533 5.853L0 24l6.335-1.511A11.933 11.933 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.807 9.807 0 0 1-5.028-1.386l-.36-.215-3.751.894.953-3.655-.235-.374A9.795 9.795 0 0 1 2.182 12C2.182 6.575 6.575 2.182 12 2.182S21.818 6.575 21.818 12 17.425 21.818 12 21.818z" />
            </svg>
            WhatsApp
          </a>
        )}
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          GharBazaar connects buyers and sellers.{" "}
          <strong>Never pay deposits before visiting.</strong>
        </p>
      </div>
    );
  }

  return (
    <Dialog open={consentOpen} onOpenChange={setConsentOpen}>
      <DialogTrigger
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
      >
        <Phone className="h-4 w-4" />
        Reveal phone number
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reveal contact number</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              By revealing the number, you agree that{" "}
              <strong className="text-foreground">your mobile number</strong>{" "}
              will be shared with{" "}
              <strong className="text-foreground">{sellerName}</strong> so they
              can contact you about this listing.
            </p>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            This is in compliance with India&apos;s Digital Personal Data
            Protection Act (DPDP Act, 2023).
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConsentOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleReveal}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revealing…
                </>
              ) : (
                "I agree, show number"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
