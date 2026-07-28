"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";

export function AddAmenityDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", icon: "" });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "name") {
      setForm((f) => ({ ...f, name: value, slug: value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { name: form.name, slug: form.slug };
      if (form.icon) body.icon = form.icon;
      const res = await fetch("/api/v1/admin/seeds/amenities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const b = await res.json(); throw new Error(b?.error?.message ?? "Failed"); }
      setOpen(false);
      setForm({ name: "", slug: "", icon: "" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add amenity</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add amenity</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Swimming Pool" />
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input required value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="swimming-pool" />
          </div>
          <div className="space-y-1.5">
            <Label>Icon (lucide name or emoji)</Label>
            <Input value={form.icon} onChange={(e) => set("icon", e.target.value)} placeholder="Waves" />
          </div>
          {error && <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
