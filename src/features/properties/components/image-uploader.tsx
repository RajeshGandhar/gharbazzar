"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import Cropper from "react-easy-crop";
import type { Area as CropArea, Point } from "react-easy-crop";
import {
  Upload,
  X,
  Star,
  Loader2,
  CropIcon,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface UploadedImage {
  id: string;
  path: string;
  is_cover: boolean;
  position: number;
}

interface PendingImage {
  /** stable local key */
  key: string;
  file: File;
  previewUrl: string;
  state: "idle" | "compressing" | "uploading" | "done" | "error";
  errorMsg?: string;
  uploadedId?: string;
  uploadedPath?: string;
  /** cropped blob override */
  croppedBlob?: Blob;
}

interface ImageUploaderProps {
  propertyId: string;
  sellerId: string;
  uploadedImages?: UploadedImage[];
  onUploadedChange?: (images: UploadedImage[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

// ---------------------------------------------------------------------------
// Crop pixel helper
// ---------------------------------------------------------------------------
async function getCroppedBlob(imageSrc: string, pixelCrop: CropArea): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas empty"))), "image/jpeg", 0.9);
  });
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function ImageUploader({
  propertyId,
  sellerId,
  uploadedImages: initialUploaded = [],
  onUploadedChange,
  maxFiles = 30,
  maxSizeMB = 5,
}: ImageUploaderProps) {
  const [uploaded, setUploaded] = useState<UploadedImage[]>(initialUploaded);
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [globalUploading, setGlobalUploading] = useState(false);

  // crop dialog state
  const [cropTarget, setCropTarget] = useState<PendingImage | null>(null);
  const [cropPosition, setCropPosition] = useState<Point>({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<CropArea | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  // notify parent
  function notifyChange(next: UploadedImage[]) {
    setUploaded(next);
    onUploadedChange?.(next);
  }

  // -------------------------------------------------------------------------
  // Dropzone
  // -------------------------------------------------------------------------
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const available = maxFiles - uploaded.length - pending.filter((p) => p.state !== "error").length;
      const toAdd = acceptedFiles.slice(0, Math.max(0, available));
      const newPending: PendingImage[] = toAdd.map((file) => ({
        key: `${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        state: "idle",
      }));
      setPending((prev) => [...prev, ...newPending]);
    },
    [uploaded.length, pending, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxSize: maxSizeMB * 1024 * 1024,
    disabled: uploaded.length + pending.length >= maxFiles,
  });

  // -------------------------------------------------------------------------
  // Upload single
  // -------------------------------------------------------------------------
  async function uploadOne(item: PendingImage): Promise<void> {
    const supabase = createClient();

    // compress
    setPending((p) => p.map((i) => i.key === item.key ? { ...i, state: "compressing" } : i));
    let fileToUpload: File | Blob;
    try {
      const source = item.croppedBlob ?? item.file;
      fileToUpload = source instanceof File
        ? await imageCompression(source, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          })
        : source;
    } catch {
      fileToUpload = item.croppedBlob ?? item.file;
    }

    setPending((p) => p.map((i) => i.key === item.key ? { ...i, state: "uploading" } : i));

    try {
      const ext = item.file.name.split(".").pop() ?? "jpg";
      const path = `${sellerId}/${propertyId}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

      const { error: storageErr } = await supabase.storage
        .from("property-images")
        .upload(path, fileToUpload, { cacheControl: "3600", upsert: false });
      if (storageErr) throw storageErr;

      const isCover = uploaded.length === 0 && pending.filter((p) => p.state === "done").length === 0;
      const position = uploaded.length + pending.filter((p) => p.state === "done").length;

      const res = await fetch(`/api/v1/properties/${propertyId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, is_cover: isCover, position }),
      });

      if (!res.ok) throw new Error("Failed to register image");
      const body = await res.json() as { data: UploadedImage };

      setPending((p) => p.map((i) => i.key === item.key ? { ...i, state: "done", uploadedId: body.data.id, uploadedPath: path } : i));
      notifyChange([...uploaded, body.data]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setPending((p) => p.map((i) => i.key === item.key ? { ...i, state: "error", errorMsg: msg } : i));
    }
  }

  // -------------------------------------------------------------------------
  // Upload all pending idle
  // -------------------------------------------------------------------------
  async function uploadAll() {
    const toUpload = pending.filter((i) => i.state === "idle");
    if (!toUpload.length) return;
    setGlobalUploading(true);
    for (const item of toUpload) {
      await uploadOne(item);
    }
    setGlobalUploading(false);
  }

  // -------------------------------------------------------------------------
  // Set cover
  // -------------------------------------------------------------------------
  async function setCover(imageId: string) {
    const res = await fetch(`/api/v1/properties/${propertyId}/images/${imageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_cover: true }),
    });
    if (res.ok) {
      notifyChange(uploaded.map((img) => ({ ...img, is_cover: img.id === imageId })));
    }
  }

  // -------------------------------------------------------------------------
  // Remove uploaded
  // -------------------------------------------------------------------------
  async function removeUploaded(imageId: string) {
    const res = await fetch(`/api/v1/properties/${propertyId}/images/${imageId}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      notifyChange(uploaded.filter((img) => img.id !== imageId));
    }
  }

  // -------------------------------------------------------------------------
  // Crop save
  // -------------------------------------------------------------------------
  async function applyCrop() {
    if (!cropTarget || !croppedArea) return;
    const blob = await getCroppedBlob(cropTarget.previewUrl, croppedArea);
    const newPreview = URL.createObjectURL(blob);
    setPending((p) =>
      p.map((i) =>
        i.key === cropTarget.key
          ? { ...i, croppedBlob: blob, previewUrl: newPreview, state: "idle" }
          : i
      )
    );
    setCropTarget(null);
  }

  const hasPendingIdle = pending.some((i) => i.state === "idle");

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="size-8 mx-auto text-muted-foreground mb-2" />
        {isDragActive ? (
          <p className="text-sm font-medium text-primary">Drop photos here…</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Drag photos here, or click to select</p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG · PNG · WebP · max {maxSizeMB} MB each · up to {maxFiles} photos
            </p>
          </>
        )}
      </div>

      {/* Uploaded images */}
      {uploaded.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Uploaded ({uploaded.length})</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {uploaded.map((img) => {
              const url = `${supabaseUrl}/storage/v1/object/public/property-images/${img.path}`;
              return (
                <div
                  key={img.id}
                  className={cn(
                    "relative aspect-[4/3] rounded-lg overflow-hidden border-2 group",
                    img.is_cover ? "border-primary" : "border-border"
                  )}
                >
                  <Image src={url} alt="Property" fill sizes="180px" className="object-cover" />
                  {img.is_cover && (
                    <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">
                      Cover
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!img.is_cover && (
                      <button onClick={() => setCover(img.id)} className="p-1.5 bg-background rounded-full" title="Set as cover">
                        <Star className="size-3.5 text-primary" />
                      </button>
                    )}
                    <button onClick={() => removeUploaded(img.id)} className="p-1.5 bg-background rounded-full" title="Remove">
                      <X className="size-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending images */}
      {pending.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">
              Pending ({pending.filter((i) => i.state !== "done").length})
            </p>
            {hasPendingIdle && (
              <Button size="sm" onClick={uploadAll} disabled={globalUploading}>
                {globalUploading ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Upload className="size-3.5 mr-1.5" />}
                {globalUploading ? "Uploading…" : "Upload all"}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {pending.map((item) => (
              <div
                key={item.key}
                className={cn(
                  "relative aspect-[4/3] rounded-lg overflow-hidden border-2 group",
                  item.state === "done" ? "border-green-500" : item.state === "error" ? "border-destructive" : "border-border"
                )}
              >
                <Image src={item.previewUrl} alt="Preview" fill sizes="180px" className="object-cover" />
                {/* state overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  {(item.state === "compressing" || item.state === "uploading") && (
                    <Loader2 className="size-5 text-white animate-spin" />
                  )}
                  {item.state === "done" && (
                    <span className="bg-green-500 text-white rounded-full p-1"><Check className="size-3.5" /></span>
                  )}
                  {item.state === "error" && (
                    <span className="bg-destructive text-destructive-foreground rounded-full p-1"><AlertCircle className="size-3.5" /></span>
                  )}
                </div>
                {/* actions (idle state) */}
                {item.state === "idle" && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => { setCropTarget(item); setCropPosition({ x: 0, y: 0 }); setCropZoom(1); }}
                      className="p-1.5 bg-background rounded-full"
                      title="Crop"
                    >
                      <CropIcon className="size-3.5" />
                    </button>
                    <button
                      onClick={() => setPending((p) => p.filter((i) => i.key !== item.key))}
                      className="p-1.5 bg-background rounded-full"
                      title="Remove"
                    >
                      <X className="size-3.5 text-destructive" />
                    </button>
                  </div>
                )}
                {item.state === "error" && (
                  <button
                    onClick={() => setPending((p) => p.filter((i) => i.key !== item.key))}
                    className="absolute top-1 right-1 p-1 bg-background/80 rounded-full"
                  >
                    <X className="size-3 text-destructive" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crop dialog */}
      {cropTarget && (
        <Dialog open onOpenChange={(open) => { if (!open) setCropTarget(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Crop photo</DialogTitle>
            </DialogHeader>
            <div className="relative h-72 bg-black rounded-lg overflow-hidden">
              <Cropper
                image={cropTarget.previewUrl}
                crop={cropPosition}
                zoom={cropZoom}
                aspect={4 / 3}
                onCropChange={setCropPosition}
                onZoomChange={setCropZoom}
                onCropComplete={(_, pixels) => setCroppedArea(pixels)}
              />
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={cropZoom}
              onChange={(e) => setCropZoom(Number(e.target.value))}
              className="w-full"
              aria-label="Zoom"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCropTarget(null)}>Cancel</Button>
              <Button onClick={applyCrop}>Apply crop</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
