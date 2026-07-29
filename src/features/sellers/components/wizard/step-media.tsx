"use client";

import { useState } from "react";
import {
  Loader2,
  ChevronLeft,
  Plus,
  Trash2,
} from "lucide-react";
import { ImageUploader } from "@/features/properties/components/image-uploader";
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
import type { UploadedImage } from "@/features/properties/components/image-uploader";

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

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(initialImages);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>(initialRoomTypes);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

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
        <Label className="mb-2 block">Property photos</Label>
        <ImageUploader
          propertyId={propertyId}
          sellerId={sellerId}
          uploadedImages={uploadedImages}
          onUploadedChange={setUploadedImages}
        />
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
        <Button onClick={handleContinue} disabled={loading} className="flex-1">
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
