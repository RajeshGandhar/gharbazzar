"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PropertyQRProps {
  slug: string;
  title: string;
}

export function PropertyQR({ slug, title }: PropertyQRProps) {
  const [open, setOpen] = useState(false);

  // Build canonical URL client-side (window.location.origin in browser)
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/property/${slug}`
    : `https://gharbazaar.in/property/${slug}`;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <QrCode className="size-4" />
        QR code
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader>
            <DialogTitle className="text-base">Share via QR</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="rounded-xl border p-4 bg-white">
              <QRCodeSVG
                value={url}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
              Scan to open <strong className="text-foreground">{title}</strong> on GharBazaar
            </p>
            <p className="text-[10px] text-muted-foreground break-all">{url}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
