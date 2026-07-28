"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export function CityToggle({
  cityId,
  isActive,
}: {
  cityId: number;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(isActive);

  async function toggle() {
    setLoading(true);
    try {
      await fetch(`/api/v1/admin/seeds/cities/${cityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !current }),
      });
      setCurrent((v) => !v);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={toggle} disabled={loading} className="flex items-center gap-1">
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      ) : (
        <Badge
          variant="outline"
          className={`cursor-pointer text-xs ${current ? "text-green-700 border-green-200" : "text-muted-foreground"}`}
        >
          {current ? "Active" : "Inactive"}
        </Badge>
      )}
    </button>
  );
}
