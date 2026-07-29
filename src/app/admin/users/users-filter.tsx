"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCallback } from "react";

export function UsersFilter() {
  const router = useRouter();
  const sp = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(sp.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, sp]
  );

  return (
    <div className="flex flex-wrap gap-3">
      <Input
        placeholder="Search name or email…"
        defaultValue={sp.get("q") ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          if (!v || v.length > 2) update("q", v);
        }}
        className="h-8 w-56 text-sm"
      />
      <Select
        value={sp.get("role") ?? "all"}
        onValueChange={(v) => { if (v != null) update("role", v); }}
      >
        <SelectTrigger className="h-8 w-36 text-sm">
          <SelectValue placeholder="All roles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All roles</SelectItem>
          <SelectItem value="super_admin">Admin</SelectItem>
          <SelectItem value="seller">Seller</SelectItem>
          <SelectItem value="customer">Customer</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={sp.get("active") ?? "all"}
        onValueChange={(v) => { if (v != null) update("active", v); }}
      >
        <SelectTrigger className="h-8 w-36 text-sm">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="false">Inactive only</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
