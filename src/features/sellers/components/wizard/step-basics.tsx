"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface PropertyType {
  id: number;
  name: string;
  slug: string;
  category: string;
}

interface StepBasicsProps {
  propertyId?: string;
  initialData?: {
    title?: string;
    purpose?: string;
    property_type_id?: number;
    price?: number;
    is_negotiable?: boolean;
    rental_kind?: string | null;
    security_deposit?: number;
  };
  propertyTypes: PropertyType[];
  onSuccess: (id: string) => void;
}

type Purpose = "sale" | "rent" | "lease";
type RentalKind = "standard" | "student";

export function StepBasics({ propertyId, initialData, propertyTypes, onSuccess }: StepBasicsProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [purpose, setPurpose] = useState<Purpose>((initialData?.purpose as Purpose) ?? "sale");
  const [propertyTypeId, setPropertyTypeId] = useState<string>(
    initialData?.property_type_id ? String(initialData.property_type_id) : ""
  );
  const [price, setPrice] = useState(initialData?.price ? String(initialData.price) : "");
  const [isNegotiable, setIsNegotiable] = useState(initialData?.is_negotiable ?? false);
  const [rentalKind, setRentalKind] = useState<RentalKind | "">(
    (initialData?.rental_kind as RentalKind) ?? ""
  );
  const [securityDeposit, setSecurityDeposit] = useState(
    initialData?.security_deposit ? String(initialData.security_deposit) : ""
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const isRentOrLease = purpose === "rent" || purpose === "lease";

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (title.trim().length < 10) errs.title = "Title must be at least 10 characters";
    if (title.trim().length > 120) errs.title = "Title must be under 120 characters";
    if (!propertyTypeId) errs.property_type_id = "Select a property type";
    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) errs.price = "Enter a valid price";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    setServerError(null);

    const body: Record<string, unknown> = {
      title: title.trim(),
      purpose,
      property_type_id: parseInt(propertyTypeId, 10),
      price: parseFloat(price),
      is_negotiable: isNegotiable,
      city_id: 1, // Placeholder — updated in step 2
      address: "TBD",
      state: "UP",
      description: "",
    };

    if (isRentOrLease && rentalKind) body.rental_kind = rentalKind;
    if (securityDeposit) body.security_deposit = parseFloat(securityDeposit);

    try {
      let res: Response;
      let data: { data?: { id: string } } = {};

      if (propertyId) {
        // Editing existing — PATCH
        res = await fetch(`/api/v1/properties/${propertyId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        data = await res.json().catch(() => ({}));
        if (res.ok) {
          onSuccess(propertyId);
          return;
        }
      } else {
        // New — POST
        res = await fetch("/api/v1/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        data = await res.json().catch(() => ({}));
        if (res.ok && data.data?.id) {
          onSuccess(data.data.id);
          return;
        }
      }

      const errData = data as { error?: { message?: string } };
      setServerError(errData?.error?.message ?? "Failed to save. Please try again.");
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <Label htmlFor="title">
          Property title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. 3 BHK Flat for Sale in Vrindavan"
          className="mt-1"
          maxLength={120}
        />
        <div className="flex justify-between mt-1">
          {errors.title ? (
            <p className="text-xs text-destructive">{errors.title}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-muted-foreground">{title.length}/120</p>
        </div>
      </div>

      {/* Purpose */}
      <div>
        <Label>Listing for <span className="text-destructive">*</span></Label>
        <div className="flex gap-2 mt-1.5">
          {(["sale", "rent", "lease"] as Purpose[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPurpose(p);
                if (p === "sale") setRentalKind("");
              }}
              className={cn(
                "flex-1 rounded-lg border py-2 px-3 text-sm font-medium transition-colors",
                purpose === p
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/40"
              )}
            >
              {p === "sale" ? "Sale" : p === "rent" ? "Rent" : "Lease"}
            </button>
          ))}
        </div>
      </div>

      {/* Rental kind — only for rent/lease */}
      {isRentOrLease && (
        <div>
          <Label>Rental type</Label>
          <div className="flex gap-2 mt-1.5">
            {(["standard", "student"] as RentalKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setRentalKind(k)}
                className={cn(
                  "flex-1 rounded-lg border py-2 px-3 text-sm font-medium transition-colors",
                  rentalKind === k
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/40"
                )}
              >
                {k === "standard" ? "Standard" : "Student Housing"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Property type */}
      <div>
        <Label htmlFor="property_type">
          Property type <span className="text-destructive">*</span>
        </Label>
        <Select value={propertyTypeId} onValueChange={(v) => { if (v != null) setPropertyTypeId(v); }}>
          <SelectTrigger id="property_type" className="mt-1">
            <SelectValue placeholder="Select property type" />
          </SelectTrigger>
          <SelectContent>
            {propertyTypes.map((pt) => (
              <SelectItem key={pt.id} value={String(pt.id)}>
                {pt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.property_type_id && (
          <p className="text-xs text-destructive mt-1">{errors.property_type_id}</p>
        )}
      </div>

      {/* Price */}
      <div>
        <Label htmlFor="price">
          {purpose === "rent" || purpose === "lease" ? "Monthly rent (₹)" : "Price (₹)"}
          <span className="text-destructive"> *</span>
        </Label>
        <Input
          id="price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={purpose === "sale" ? "e.g. 4500000" : "e.g. 12000"}
          className="mt-1"
          min={0}
        />
        {errors.price && <p className="text-xs text-destructive mt-1">{errors.price}</p>}
      </div>

      {/* Is negotiable */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isNegotiable}
          onChange={(e) => setIsNegotiable(e.target.checked)}
          className="rounded border-border"
        />
        <span className="text-sm">Price is negotiable</span>
      </label>

      {/* Security deposit — for rent/lease */}
      {isRentOrLease && (
        <div>
          <Label htmlFor="security_deposit">Security deposit (₹) <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input
            id="security_deposit"
            type="number"
            value={securityDeposit}
            onChange={(e) => setSecurityDeposit(e.target.value)}
            placeholder="e.g. 24000"
            className="mt-1"
            min={0}
          />
        </div>
      )}

      {serverError && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {serverError}
        </p>
      )}

      <Button onClick={handleSubmit} disabled={loading} className="w-full">
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
  );
}
