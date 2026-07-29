"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";

interface Admin {
  id: string;
  full_name: string;
}

export function AddProspectDialog({ admins }: { admins: Admin[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    prospect_name: "",
    prospect_phone: "",
    seller_type: "",
    locality_note: "",
    assignee_id: "",
    next_action_at: "",
  });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        prospect_name: form.prospect_name,
        prospect_phone: form.prospect_phone,
        seller_type: form.seller_type,
      };
      if (form.locality_note) body.locality_note = form.locality_note;
      if (form.assignee_id) body.assignee_id = form.assignee_id;
      if (form.next_action_at) body.next_action_at = new Date(form.next_action_at).toISOString();

      const res = await fetch("/api/v1/admin/field-crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const b = await res.json();
        throw new Error(b?.error?.message ?? "Failed");
      }
      setOpen(false);
      setForm({ prospect_name: "", prospect_phone: "", seller_type: "", locality_note: "", assignee_id: "", next_action_at: "" });
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
        <Plus className="h-4 w-4" />Add prospect
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add prospect</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label>Name</Label>
              <Input required value={form.prospect_name} onChange={(e) => set("prospect_name", e.target.value)} placeholder="Ram Sharma" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input required pattern="[6-9]\d{9}" maxLength={10} value={form.prospect_phone} onChange={(e) => set("prospect_phone", e.target.value)} placeholder="9876543210" />
            </div>
            <div className="space-y-1.5">
              <Label>Seller type</Label>
              <Select value={form.seller_type} onValueChange={(v) => { if (v != null) set("seller_type", v); }}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="builder">Builder</SelectItem>
                  <SelectItem value="property_manager">Property Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Locality note</Label>
              <Textarea value={form.locality_note} onChange={(e) => set("locality_note", e.target.value)} placeholder="Has 3 flats near Krishna Nagar…" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Select value={form.assignee_id} onValueChange={(v) => { if (v != null) set("assignee_id", v); }}>
                <SelectTrigger><SelectValue placeholder="Select agent…" /></SelectTrigger>
                <SelectContent>
                  {admins.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Next action at</Label>
              <Input type="datetime-local" value={form.next_action_at} onChange={(e) => set("next_action_at", e.target.value)} />
            </div>
          </div>
          {error && <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !form.seller_type} className="flex-1">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
