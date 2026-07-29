export default function SearchLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Filter bar skeleton */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-full bg-muted animate-pulse shrink-0" />
        ))}
      </div>

      <div className="flex gap-6">
        {/* Side filter panel skeleton */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-4">
          <div className="h-6 w-32 rounded bg-muted animate-pulse" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="h-10 w-full rounded bg-muted animate-pulse" />
            </div>
          ))}
        </aside>

        {/* Results skeleton */}
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div className="h-5 w-40 rounded bg-muted animate-pulse" />
            <div className="h-9 w-36 rounded bg-muted animate-pulse" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-xl border overflow-hidden bg-card">
                <div className="h-48 bg-muted animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
                  <div className="flex justify-between pt-2">
                    <div className="h-6 w-24 rounded bg-muted animate-pulse" />
                    <div className="h-6 w-16 rounded bg-muted animate-pulse" />
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
