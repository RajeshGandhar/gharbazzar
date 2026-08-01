import { Loader2 } from "lucide-react";

// Root loading.tsx wraps app/page.tsx AND every nested route below it that
// doesn't have its own loading.tsx (Next.js Suspense-boundary inheritance),
// so this has to be a neutral fallback appropriate for any page — not a
// skeleton shaped like the home page specifically.
export default function RootLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
