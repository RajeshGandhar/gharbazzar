"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Upload,
  X,
  Star,
  Loader2,
  ChevronLeft,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface ExistingImage {
  id: string;
  path: string;
  is_cover: boolean;
  position: number;
}

interface RoomType {
  id?: string;
  name: string;
  sharing_count: number;
  monthly_rent_per_bed: number;
  security_deposit: number;
  is_ac: boolean;
  meal_plan: string;
  attached_bathroom: boolean;
  total_beds: number;
  available_beds: number;
}

interface StepMediaProps {
  propertyId: string;
  sellerId: string;
  rentalKind?: string | null;
  existingImages?: ExistingImage[];
  existingRoomTypes?: RoomType[];
  onSuccess: (id: string) => void;
  onBack: () => void;
}

interface PendingFile {
  file: File;
  previewUrl: string;
  uploading: boolean;
  uploaded: boolean;
  error: string | null;
  imageId?: string;
  path?: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export function StepMedia({
  propertyId,
  sellerId,
  rentalKind,
  existingImages: initialImages = [],
  existingRoomTypes: initialRoomTypes = [],
  onSuccess,
  onBack,
}: StepMediaProps) {
  const isStudent = rentalKind === "student";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedImages, setUploadedImages] = useState<ExistingImage[]>(initialImages);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>(initialRoomTypes);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const valid: PendingFile[] = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} exceeds 5MB. Please compress it first.`);
        continue;
      }
      valid.push({
        file,
        previewUrl: URL.createObjectURL(file),
        uploading: false,
        uploaded: false,
        error: null,
      });
    }
    setPendingFiles((p) => [...p, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadFiles() {
    const supabase = createClient();
    setUploading(true);

    const pending = pendingFiles.filter((f) => !f.uploaded && !f.error);

    for (let i = 0; i < pending.length; i++) {
      const idx = pendingFiles.findIndex((f) => f === pending[i]);
      setPendingFiles((p) =>
        p.map((f, j) => (j === idx ? { ...f, uploading: true } : f))
      );

      try {
        const file = pending[i].file;
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${sellerId}/${propertyId}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

        const { error: storageErr } = await supabase.storage
          .from("property-images")
          .upload(path, file, { cacheControl: "3600", upsert: false });

        if (storageErr) throw storageErr;

        // Register image in DB
        const isCover = uploadedImages.length === 0 && i === 0;
        const position = uploadedImages.length + i;

        const res = await fetch(`/api/v1/properties/${propertyId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path, is_cover: isCover, position }),
        });
        const data = await res.json().catch(() => ({})) as { data?: { id: string; path: string; is_cover: boolean; position: number } };

        if (!res.ok) throw new Error("Failed to register image");

        const newImage: ExistingImage = {
          id: data.data!.id,
          path: data.data!.path,
          is_cover: data.data!.is_cover,
          position: data.data!.position,
        };

        setUploadedImages((p) => [...p, newImage]);
        setPendingFiles((p) =>
          p.map((f, j) =>
            j === idx
              ? { ...f, uploading: false, uploaded: true, imageId: data.data!.id, path }
              : f
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setPendingFiles((p) =>
          p.map((f, j) =>
            j === idx ? { ...f, uploading: false, error: message } : f
          )
        );
      }
    }

    setUploading(false);
  }

  async function setCover(imageId: string) {
    const res = await fetch(`/api/v1/properties/${propertyId}/images/${imageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_cover: true }),
    });
    if (res.ok) {
      setUploadedImages((p) =>
        p.map((img) => ({ ...img, is_cover: img.id === imageId }))
      );
    }
  }

  async function removeImage(imageId: string) {
    const res = await fetch(`/api/v1/properties/${propertyId}/images/${imageId}`, {
      method: "DELETE",
    });
    if (res.ok || res.status === 204) {
      setUploadedImages((p) => p.filter((img) => img.id !== imageId));
    }
  }

  function removePending(idx: number) {
    setPendingFiles((p) => p.filter((_, i) => i !== idx));
  }

  // Room type management
  function addRoomType() {
    setRoomTypes((p) => [
      ...p,
      {
        name: "",
        sharing_count: 1,
        monthly_rent_per_bed: 0,
        security_deposit: 0,
        is_ac: false,
        meal_plan: "none",
        attached_bathroom: false,
        total_beds: 1,
        available_beds: 1,
      },
    ]);
  }

  function updateRoomType(idx: number, updates: Partial<RoomType>) {
    setRoomTypes((p) => p.map((rt, i) => (i === idx ? { ...rt, ...updates } : rt)));
  }

  async function removeRoomType(idx: number) {
    const rt = roomTypes[idx];
    if (rt.id) {
      await fetch(`/api/v1/properties/${propertyId}/room-types/${rt.id}`, {
        method: "DELETE",
      });
    }
    setRoomTypes((p) => p.filter((_, i) => i !== idx));
  }

  async function saveRoomTypes() {
    for (const rt of roomTypes) {
      if (rt.id) {
        await fetch(`/api/v1/properties/${propertyId}/room-types/${rt.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rt),
        });
      } else {
        const res = await fetch(`/api/v1/properties/${propertyId}/room-types`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rt),
        });
        const data = await res.json().catch(() => ({})) as { data?: { id: string } };
        if (data.data?.id) {
          setRoomTypes((p) =>
            p.map((r, i) => (r === rt ? { ...r, id: data.data!.id } : r))
          );
        }
      }
    }
  }

  async function handleContinue() {
    setLoading(true);
    setServerError(null);

    try {
      // Upload any pending files first
      if (pendingFiles.some((f) => !f.uploaded && !f.error)) {
        await uploadFiles();
      }

      // Save room types if student housing
      if (isStudent) {
        await saveRoomTypes();
      }

      onSuccess(propertyId);
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload section */}
      <div>
        <Label>Property photos</Label>
        <p className="text-xs text-muted-foreground mt-0.5 mb-3">
          Upload up to 30 photos. Each photo must be under 5MB. JPG, PNG, or WebP only.
        </p>

        {/* Upload area */}
        <div
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Click to select photos, or drag and drop
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Max 30 photos · Max 5MB each
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={onFileChange}
            className="sr-only"
          />
        </div>

        {/* Uploaded images grid */}
        {uploadedImages.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Uploaded ({uploadedImages.length})
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {uploadedImages.map((img) => {
                const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/property-images/${img.path}`;
                return (
                  <div
                    key={img.id}
                    className={cn(
                      "relative aspect-[4/3] rounded-lg overflow-hidden border-2 group",
                      img.is_cover ? "border-primary" : "border-border"
                    )}
                  >
                    <Image
                      src={imageUrl}
                      alt="Property"
                      fill
                      sizes="150px"
                      className="object-cover"
                    />
                    {img.is_cover && (
                      <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Cover
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!img.is_cover && (
                        <button
                          onClick={() => setCover(img.id)}
                          className="p-1.5 bg-background rounded-full hover:bg-muted transition-colors"
                          title="Set as cover"
                        >
                          <Star className="h-3.5 w-3.5 text-primary" />
                        </button>
                      )}
                      <button
                        onClick={() => removeImage(img.id)}
                        className="p-1.5 bg-background rounded-full hover:bg-muted transition-colors"
                        title="Remove"
                      >
                        <X className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pending files */}
        {pendingFiles.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">
                Pending ({pendingFiles.filter((f) => !f.uploaded).length})
              </p>
              {pendingFiles.some((f) => !f.uploaded && !f.error) && (
                <Button
                  size="sm"
                  onClick={uploadFiles}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Upload all
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {pendingFiles.map((pf, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "relative aspect-[4/3] rounded-lg overflow-hidden border-2",
                    pf.uploaded ? "border-green-500" : pf.error ? "border-destructive" : "border-border"
                  )}
                >
                  <Image
                    src={pf.previewUrl}
                    alt="Preview"
                    fill
                    sizes="150px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    {pf.uploading && <Loader2 className="h-5 w-5 text-white animate-spin" />}
                    {pf.uploaded && (
                      <div className="bg-green-500 text-white text-[9px] font-bold px-2 py-1 rounded-full">
                        Done
                      </div>
                    )}
                    {pf.error && (
                      <div className="bg-destructive text-destructive-foreground text-[9px] font-bold px-2 py-1 rounded-full">
                        Failed
                      </div>
                    )}
                  </div>
                  {!pf.uploading && (
                    <button
                      onClick={() => removePending(idx)}
                      className="absolute top-1 right-1 p-1 bg-background/80 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Room types — student housing only */}
      {isStudent && (
        <div className="space-y-4 border border-primary/20 rounded-xl p-4 bg-primary/5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-primary">Room types</p>
            <Button size="sm" variant="outline" onClick={addRoomType}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add room type
            </Button>
          </div>

          {roomTypes.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Add room types to show per-bed pricing to seekers.
            </p>
          )}

          {roomTypes.map((rt, idx) => (
            <div key={idx} className="bg-background border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">Room type {idx + 1}</p>
                <button onClick={() => removeRoomType(idx)} className="text-destructive hover:text-destructive/70">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Room name <span className="text-muted-foreground">(optional)</span></Label>
                  <Input
                    value={rt.name}
                    onChange={(e) => updateRoomType(idx, { name: e.target.value })}
                    placeholder="e.g. Double sharing"
                    className="mt-1 text-sm"
                    maxLength={60}
                  />
                </div>
                <div>
                  <Label className="text-xs">Sharing count</Label>
                  <Select
                    value={String(rt.sharing_count)}
                    onValueChange={(v) => { if (v != null) updateRoomType(idx, { sharing_count: parseInt(v, 10) }); }}
                  >
                    <SelectTrigger className="mt-1 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n === 1 ? "Single" : `${n} sharing`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Monthly rent/bed (₹)</Label>
                  <Input
                    type="number"
                    value={rt.monthly_rent_per_bed || ""}
                    onChange={(e) => updateRoomType(idx, { monthly_rent_per_bed: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 8000"
                    className="mt-1 text-sm"
                    min={0}
                  />
                </div>
                <div>
                  <Label className="text-xs">Security deposit (₹)</Label>
                  <Input
                    type="number"
                    value={rt.security_deposit || ""}
                    onChange={(e) => updateRoomType(idx, { security_deposit: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 16000"
                    className="mt-1 text-sm"
                    min={0}
                  />
                </div>
                <div>
                  <Label className="text-xs">Total beds</Label>
                  <Input
                    type="number"
                    value={rt.total_beds || ""}
                    onChange={(e) => updateRoomType(idx, { total_beds: parseInt(e.target.value, 10) || 1 })}
                    placeholder="e.g. 6"
                    className="mt-1 text-sm"
                    min={1}
                  />
                </div>
                <div>
                  <Label className="text-xs">Available beds</Label>
                  <Input
                    type="number"
                    value={rt.available_beds}
                    onChange={(e) => updateRoomType(idx, { available_beds: parseInt(e.target.value, 10) || 0 })}
                    placeholder="e.g. 3"
                    className="mt-1 text-sm"
                    min={0}
                  />
                </div>
                <div>
                  <Label className="text-xs">Meal plan</Label>
                  <Select
                    value={rt.meal_plan}
                    onValueChange={(v) => { if (v != null) updateRoomType(idx, { meal_plan: v }); }}
                  >
                    <SelectTrigger className="mt-1 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No meals</SelectItem>
                      <SelectItem value="breakfast_only">Breakfast only</SelectItem>
                      <SelectItem value="two_meals">2 meals</SelectItem>
                      <SelectItem value="three_meals">3 meals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={rt.is_ac}
                    onChange={(e) => updateRoomType(idx, { is_ac: e.target.checked })}
                    className="rounded border-border"
                  />
                  AC
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={rt.attached_bathroom}
                    onChange={(e) => updateRoomType(idx, { attached_bathroom: e.target.checked })}
                    className="rounded border-border"
                  />
                  Attached bathroom
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {serverError && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {serverError}
        </p>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleContinue} disabled={loading || uploading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            "Save & Continue"
          )}
        </Button>
      </div>
    </div>
  );
}
