export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Filter bar skeleton */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-full skeleton-shimmer shrink-0" />
        ))}
      </div>

      <div className="flex gap-6">
        {/* Side filter panel skeleton */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-4">
          <div className="h-5 w-32 rounded-md skeleton-shimmer" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 rounded-md skeleton-shimmer" />
              <div className="h-9 w-full rounded-md skeleton-shimmer" />
            </div>
          ))}
        </aside>

        {/* Results skeleton */}
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div className="h-5 w-40 rounded-md skeleton-shimmer" />
            <div className="h-8 w-36 rounded-md skeleton-shimmer" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="aspect-[4/3] skeleton-shimmer" />
                <div className="p-4 space-y-2.5">
                  <div className="h-4 w-3/4 rounded-md skeleton-shimmer" />
                  <div className="h-3 w-1/2 rounded-md skeleton-shimmer" />
                  <div className="pt-2 border-t border-white/[0.04] flex gap-3">
                    <div className="h-3 w-16 rounded-md skeleton-shimmer" />
                    <div className="h-3 w-16 rounded-md skeleton-shimmer" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
