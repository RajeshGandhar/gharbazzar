export default function PropertyDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* Main column */}
        <div className="flex flex-col gap-8 min-w-0">
          {/* Gallery skeleton */}
          <div className="grid grid-cols-2 gap-2">
            <div className="row-span-2 rounded-xl skeleton-shimmer aspect-[4/3]" />
            <div className="rounded-xl skeleton-shimmer aspect-[4/3]" />
            <div className="rounded-xl skeleton-shimmer aspect-[4/3]" />
          </div>

          {/* Title / price */}
          <div className="space-y-3">
            <div className="h-4 w-24 rounded-md skeleton-shimmer" />
            <div className="h-7 w-3/4 rounded-md skeleton-shimmer" />
            <div className="h-4 w-1/2 rounded-md skeleton-shimmer" />
            <div className="h-6 w-40 rounded-md skeleton-shimmer" />
          </div>

          {/* Details grid */}
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 w-28 rounded-md skeleton-shimmer" />
            ))}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 w-32 rounded-md skeleton-shimmer" />
            <div className="h-3 w-full rounded-md skeleton-shimmer" />
            <div className="h-3 w-full rounded-md skeleton-shimmer" />
            <div className="h-3 w-2/3 rounded-md skeleton-shimmer" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block">
          <div className="rounded-xl border border-white/[0.06] p-5 space-y-4">
            <div className="h-4 w-2/3 rounded-md skeleton-shimmer" />
            <div className="h-10 w-full rounded-md skeleton-shimmer" />
            <div className="h-10 w-full rounded-md skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
