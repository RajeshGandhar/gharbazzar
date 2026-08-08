"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Loader2, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
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
            <WhatsAppIcon className="h-4 w-4 text-green-600" />
            WhatsApp
          </a>
        )}
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          GharBazaar is a discovery platform, not a party to any transaction.{" "}
          <strong>Never pay deposits before visiting the property.</strong>
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
