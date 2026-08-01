// Root loading.tsx — neutral skeleton that works for any page.
export default function RootLoading() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero skeleton */}
      <div className="gradient-hero py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="mx-auto skeleton-shimmer h-6 w-64 rounded-full" />
          <div className="mx-auto skeleton-shimmer h-12 w-3/4 rounded-2xl" />
          <div className="mx-auto skeleton-shimmer h-6 w-1/2 rounded-xl" />
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-border bg-card p-2 shadow-elevated-lg">
              <div className="skeleton-shimmer h-12 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-4 mb-8">
          <div className="skeleton-shimmer h-4 w-32 rounded-lg" />
          <div className="skeleton-shimmer h-8 w-64 rounded-xl" />
        </div>
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border overflow-hidden shadow-card">
              <div className="aspect-[4/3] skeleton-shimmer" />
              <div className="p-4 space-y-2.5">
                <div className="skeleton-shimmer h-4 w-3/4 rounded-lg" />
                <div className="skeleton-shimmer h-3 w-1/2 rounded-lg" />
                <div className="skeleton-shimmer h-3 w-1/3 rounded-lg" />
                <div className="pt-2 border-t border-border/60 flex gap-3">
                  <div className="skeleton-shimmer h-3 w-16 rounded-lg" />
                  <div className="skeleton-shimmer h-3 w-16 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
