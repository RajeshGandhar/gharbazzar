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
import { Plus, Loader2 } from "lucide-react";

export function AddCityDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    district: "",
    state: "",
    region_id: "",
    position: "",
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
        district: form.district,
        state: form.state,
      };
      if (form.region_id) body.region_id = Number(form.region_id);
      if (form.position) body.position = Number(form.position);

      const res = await fetch("/api/v1/admin/seeds/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const b = await res.json();
        throw new Error(b?.error?.message ?? "Failed to add city");
      }
      setOpen(false);
      setForm({ name: "", slug: "", district: "", state: "", region_id: "", position: "" });
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
        Add city
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add city</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Mathura"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input
                required
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="mathura"
              />
            </div>
            <div className="space-y-1.5">
              <Label>District</Label>
              <Input
                required
                value={form.district}
                onChange={(e) => set("district", e.target.value)}
                placeholder="Mathura"
              />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input
                required
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                placeholder="Uttar Pradesh"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Region ID (optional)</Label>
              <Input
                type="number"
                value={form.region_id}
                onChange={(e) => set("region_id", e.target.value)}
                placeholder="1"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Position</Label>
              <Input
                type="number"
                value={form.position}
                onChange={(e) => set("position", e.target.value)}
                placeholder="10"
              />
            </div>
          </div>
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add city
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
