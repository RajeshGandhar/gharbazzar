"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

interface City {
  id: number;
  name: string;
}

interface ProfileFormProps {
  userId: string;
  profile: {
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    email: string | null;
  };
  seller: {
    seller_type: string;
    business_name: string | null;
    about: string | null;
    experience_years: number | null;
    office_address: string | null;
    city_id: number | null;
    whatsapp_number: string | null;
    website: string | null;
    rera_number: string | null;
  };
  cities: City[];
}

export function ProfileForm({ userId, profile, seller, cities }: ProfileFormProps) {
  const router = useRouter();

  // Personal fields
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");

  // Business fields
  const [businessName, setBusinessName] = useState(seller.business_name ?? "");
  const [about, setAbout] = useState(seller.about ?? "");
  const [experienceYears, setExperienceYears] = useState(
    seller.experience_years != null ? String(seller.experience_years) : ""
  );
  const [officeAddress, setOfficeAddress] = useState(seller.office_address ?? "");
  const [cityId, setCityId] = useState(seller.city_id ? String(seller.city_id) : "");
  const [whatsappNumber, setWhatsappNumber] = useState(seller.whatsapp_number ?? "");
  const [website, setWebsite] = useState(seller.website ?? "");
  const [reraNumber, setReraNumber] = useState(seller.rera_number ?? "");

  // Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [personalError, setPersonalError] = useState<string | null>(null);
  const [businessError, setBusinessError] = useState<string | null>(null);
  const [personalSaved, setPersonalSaved] = useState(false);
  const [businessSaved, setBusinessSaved] = useState(false);

  const showRera =
    seller.seller_type === "agent" || seller.seller_type === "builder";

  async function savePersonal() {
    setSavingPersonal(true);
    setPersonalError(null);
    setPersonalSaved(false);

    try {
      let avatarUrl: string | undefined;

      if (avatarFile) {
        setAvatarUploading(true);
        const supabase = createClient();
        const ext = avatarFile.name.split(".").pop() ?? "jpg";
        const path = `${userId}/avatar.${ext}`;
        const { error: storageErr } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { cacheControl: "3600", upsert: true });
        if (storageErr) throw new Error(storageErr.message);

        avatarUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
        setAvatarUploading(false);
      }

      const body: Record<string, unknown> = {};
      if (fullName.trim()) body.full_name = fullName.trim();
      if (phone.trim()) body.phone = phone.trim().replace(/^\+91/, "");
      if (avatarUrl) body.avatar_url = avatarUrl;

      const res = await fetch("/api/v1/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(data?.error?.message ?? "Failed to save");
      }

      setPersonalSaved(true);
      setAvatarFile(null);
      router.refresh();
    } catch (err) {
      setPersonalError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingPersonal(false);
      setAvatarUploading(false);
    }
  }

  async function saveBusiness() {
    setSavingBusiness(true);
    setBusinessError(null);
    setBusinessSaved(false);

    try {
      const body: Record<string, unknown> = {};
      if (businessName.trim()) body.business_name = businessName.trim();
      if (about.trim()) body.about = about.trim();
      if (experienceYears) body.experience_years = parseInt(experienceYears, 10);
      if (officeAddress.trim()) body.office_address = officeAddress.trim();
      if (cityId) body.city_id = parseInt(cityId, 10);
      if (whatsappNumber.trim()) body.whatsapp_number = whatsappNumber.trim();
      if (website.trim()) body.website = website.trim();
      if (reraNumber.trim()) body.rera_number = reraNumber.trim();

      const res = await fetch("/api/v1/seller/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(data?.error?.message ?? "Failed to save");
      }

      setBusinessSaved(true);
      router.refresh();
    } catch (err) {
      setBusinessError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingBusiness(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Personal */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold border-b border-border pb-2">Personal details</h2>

        <div>
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            className="mt-1"
            maxLength={100}
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone number</Label>
          <div className="flex mt-1">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">
              +91
            </span>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="9876543210"
              className="rounded-l-none"
              inputMode="numeric"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="avatar">Profile photo</Label>
          <div className="flex items-center gap-3 mt-1">
            <input
              id="avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
              className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-border file:text-xs file:font-medium file:bg-muted file:text-muted-foreground hover:file:bg-muted/70 cursor-pointer"
            />
            {avatarFile && (
              <span className="text-xs text-muted-foreground">{avatarFile.name}</span>
            )}
          </div>
        </div>

        {personalError && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {personalError}
          </p>
        )}
        {personalSaved && (
          <p className="text-sm text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-lg px-3 py-2">
            Personal details saved.
          </p>
        )}

        <Button onClick={savePersonal} disabled={savingPersonal || avatarUploading} className="gap-2">
          {savingPersonal || avatarUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save personal details
            </>
          )}
        </Button>
      </div>

      {/* Business */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold border-b border-border pb-2">Business details</h2>

        <div>
          <Label htmlFor="business_name">Business / agency name</Label>
          <Input
            id="business_name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Your business name"
            className="mt-1"
            maxLength={120}
          />
        </div>

        <div>
          <Label htmlFor="about">About</Label>
          <Textarea
            id="about"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Tell seekers about your experience..."
            rows={4}
            maxLength={1000}
            className="mt-1 resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">{about.length}/1000</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="experience_years">Years of experience</Label>
            <Input
              id="experience_years"
              type="number"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              placeholder="e.g. 5"
              className="mt-1"
              min={0}
              max={60}
            />
          </div>
          <div>
            <Label htmlFor="city_id">City</Label>
            <Select value={cityId} onValueChange={(v) => { if (v != null) setCityId(v); }}>
              <SelectTrigger id="city_id" className="mt-1">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="office_address">Office address</Label>
          <Input
            id="office_address"
            value={officeAddress}
            onChange={(e) => setOfficeAddress(e.target.value)}
            placeholder="Your office address"
            className="mt-1"
            maxLength={300}
          />
        </div>

        <div>
          <Label htmlFor="whatsapp_number">WhatsApp number</Label>
          <div className="flex mt-1">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">
              +91
            </span>
            <Input
              id="whatsapp_number"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="9876543210"
              className="rounded-l-none"
              inputMode="numeric"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="website">Website <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input
            id="website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://yourwebsite.com"
            className="mt-1"
          />
        </div>

        {showRera && (
          <div>
            <Label htmlFor="rera_number">RERA number <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              id="rera_number"
              value={reraNumber}
              onChange={(e) => setReraNumber(e.target.value)}
              placeholder="UP-RERA-..."
              className="mt-1"
              maxLength={50}
            />
          </div>
        )}

        {businessError && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {businessError}
          </p>
        )}
        {businessSaved && (
          <p className="text-sm text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-lg px-3 py-2">
            Business details saved.
          </p>
        )}

        <Button onClick={saveBusiness} disabled={savingBusiness} className="gap-2">
          {savingBusiness ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save business details
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
