"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";

interface City {
  id: number;
  name: string;
}

export function AddUniversityDialog({ cities }: { cities: City[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    city_id: "",
    institution_type: "",
    latitude: "",
    longitude: "",
    website: "",
  });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "name") {
      setForm((f) => ({
        ...f,
        name: value,
        slug: value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        slug: form.slug,
        city_id: Number(form.city_id),
        institution_type: form.institution_type,
      };
      if (form.latitude) body.latitude = Number(form.latitude);
      if (form.longitude) body.longitude = Number(form.longitude);
      if (form.website) body.website = form.website;

      const res = await fetch("/api/v1/admin/seeds/universities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const b = await res.json();
        throw new Error(b?.error?.message ?? "Failed");
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 gap-1.5">
        <Plus className="h-4 w-4" />
        Add university
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add university / college</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label>Name</Label>
              <Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="GLA University" />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input required value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="gla-university" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.institution_type} onValueChange={(v) => { if (v != null) set("institution_type", v); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="university">University</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                  <SelectItem value="coaching_hub">Coaching hub</SelectItem>
                  <SelectItem value="school">School</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>City</Label>
              <Select value={form.city_id} onValueChange={(v) => { if (v != null) set("city_id", v); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city…" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Latitude</Label>
              <Input type="number" step="any" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} placeholder="27.5706" />
            </div>
            <div className="space-y-1.5">
              <Label>Longitude</Label>
              <Input type="number" step="any" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} placeholder="77.6691" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Website (optional)</Label>
              <Input type="url" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://gla.ac.in" />
            </div>
          </div>
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !form.city_id || !form.institution_type} className="flex-1">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
