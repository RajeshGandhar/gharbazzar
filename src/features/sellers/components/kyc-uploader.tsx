"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

const DOC_TYPES = [
  { value: "pan_card", label: "PAN Card", group: "Identity" },
  { value: "voter_id", label: "Voter ID", group: "Identity" },
  { value: "passport", label: "Passport", group: "Identity" },
  { value: "driving_license", label: "Driving License", group: "Identity" },
  { value: "gst_certificate", label: "GST Certificate", group: "Business" },
  { value: "shop_act", label: "Shop & Establishment Act", group: "Business" },
  { value: "rera_certificate", label: "RERA Registration", group: "Business" },
  { value: "address_proof", label: "Address Proof", group: "Address" },
];

interface KycUploaderProps {
  sellerId: string;
}

export function KycUploader({ sellerId }: KycUploaderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB");
      return;
    }
    setFile(f);
    setError(null);
    setSuccess(false);
  }

  async function handleUpload() {
    if (!docType) {
      setError("Please select a document type");
      return;
    }
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "pdf";
      const path = `${sellerId}/${docType}/${Date.now()}.${ext}`;

      const { error: storageErr } = await supabase.storage
        .from("kyc-documents")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (storageErr) throw new Error(storageErr.message);

      // Register in DB
      const res = await fetch("/api/v1/seller/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_type: docType, file_path: path }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(data?.error?.message ?? "Failed to submit document");
      }

      setSuccess(true);
      setFile(null);
      setDocType("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Aadhaar disclaimer */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-800 bg-amber-950/30 p-4">
        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-300">
            Important: Do not upload your full Aadhaar
          </p>
          <p className="text-xs text-amber-400 mt-1">
            Aadhaar numbers are sensitive. Use a <strong>masked copy</strong> showing only the last 4 digits,
            or use an alternative identity document (PAN, Voter ID, Passport, or Driving License).
          </p>
        </div>
      </div>

      {/* Document type */}
      <div>
        <Label htmlFor="doc_type">Document type</Label>
        <Select value={docType} onValueChange={(v) => { if (v != null) setDocType(v); }}>
          <SelectTrigger id="doc_type" className="mt-1">
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            {["Identity", "Business", "Address"].map((group) => (
              <div key={group}>
                <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">{group}</p>
                {DOC_TYPES.filter((d) => d.group === group).map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* File picker */}
      <div>
        <Label htmlFor="kyc_file">File</Label>
        <div className="mt-1 flex items-center gap-3">
          <input
            ref={fileInputRef}
            id="kyc_file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={onFileChange}
            className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-border file:text-xs file:font-medium file:bg-muted file:text-muted-foreground hover:file:bg-muted/70 cursor-pointer"
          />
        </div>
        {file && (
          <p className="text-xs text-muted-foreground mt-1">
            Selected: {file.name} ({(file.size / 1024).toFixed(0)} KB)
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG · Max 10MB</p>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-green-400 bg-green-900/30 rounded-lg px-3 py-2">
          Document uploaded successfully. Our team will review within 24 hours.
        </p>
      )}

      <Button onClick={handleUpload} disabled={uploading || !file || !docType} className="gap-2">
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Upload document
          </>
        )}
      </Button>
    </div>
  );
}
