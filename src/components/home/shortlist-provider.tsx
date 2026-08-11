"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Shortlist state for the landing page, backed by the real favorites API.
 *
 * The homepage is a public, cached (revalidate) route, so per-user favourites
 * cannot be resolved on the server without making the page uncacheable. This
 * provider resolves them once on the client and shares the set, so a grid of
 * cards costs one request rather than one per card.
 *
 * A 401 simply means nobody is signed in — that is an expected state here, not
 * an error, and it puts the buttons into a "sign in to save" mode rather than
 * silently swallowing the click.
 */

interface ShortlistState {
  ids: Set<string>;
  signedIn: boolean;
  ready: boolean;
  toggle: (propertyId: string) => Promise<void>;
}

const ShortlistContext = createContext<ShortlistState | null>(null);

export function ShortlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [signedIn, setSignedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/v1/me/favorites");
        if (cancelled) return;
        if (res.status === 401) {
          setSignedIn(false);
          return;
        }
        if (!res.ok) return;
        const body = await res.json();
        const rows: Array<{ property_id: string }> = body?.data ?? body ?? [];
        if (cancelled) return;
        setSignedIn(true);
        setIds(new Set(rows.map((r) => r.property_id)));
      } catch {
        // Network failure — leave the buttons in their signed-out state
        // rather than pretending a shortlist exists.
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback(
    async (propertyId: string) => {
      const wasSaved = ids.has(propertyId);

      // Optimistic — the heart must respond on the same frame as the click.
      setIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(propertyId);
        else next.add(propertyId);
        return next;
      });

      try {
        const res = wasSaved
          ? await fetch(`/api/v1/me/favorites/${propertyId}`, { method: "DELETE" })
          : await fetch("/api/v1/me/favorites", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ property_id: propertyId }),
            });

        if (!res.ok) throw new Error(String(res.status));
      } catch {
        // Roll back so the UI never claims a save the server rejected.
        setIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(propertyId);
          else next.delete(propertyId);
          return next;
        });
      }
    },
    [ids]
  );

  return (
    <ShortlistContext.Provider value={{ ids, signedIn, ready, toggle }}>
      {children}
    </ShortlistContext.Provider>
  );
}

export function useShortlist(): ShortlistState {
  const ctx = useContext(ShortlistContext);
  if (!ctx) {
    throw new Error("useShortlist must be used inside <ShortlistProvider>");
  }
  return ctx;
}
