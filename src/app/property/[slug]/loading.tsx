export default function PropertyDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* Main column */}
        <div className="flex flex-col gap-8 min-w-0">
          {/* Gallery skeleton */}
          <div className="grid grid-cols-2 gap-2">
            <div className="row-span-2 rounded-xl bg-muted animate-pulse aspect-[4/3]" />
            <div className="rounded-xl bg-muted animate-pulse aspect-[4/3]" />
            <div className="rounded-xl bg-muted animate-pulse aspect-[4/3]" />
          </div>

          {/* Title / price block */}
          <div className="space-y-3">
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="h-8 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-5 w-1/2 rounded bg-muted animate-pulse" />
            <div className="h-7 w-40 rounded bg-muted animate-pulse" />
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="h-5 w-32 rounded bg-muted animate-pulse" />
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
          </div>
        </div>

        {/* Sidebar (contact box) */}
        <div className="rounded-2xl border border-border p-5 space-y-4 h-fit">
          <div className="h-5 w-2/3 rounded bg-muted animate-pulse" />
          <div className="h-10 w-full rounded-lg bg-muted animate-pulse" />
          <div className="h-10 w-full rounded-lg bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}
