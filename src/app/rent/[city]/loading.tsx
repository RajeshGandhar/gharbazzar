export default function RentCityLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero skeleton */}
      <div className="mb-8 space-y-3">
        <div className="h-8 w-64 rounded bg-muted animate-pulse" />
        <div className="h-5 w-48 rounded bg-muted animate-pulse" />
        <div className="h-4 w-80 rounded bg-muted animate-pulse" />
      </div>

      {/* BHK filter pills skeleton */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-16 rounded-full bg-muted animate-pulse" />
        ))}
      </div>

      {/* Property grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-xl border overflow-hidden bg-card">
            <div className="h-48 bg-muted animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
              <div className="flex justify-between pt-2">
                <div className="h-6 w-28 rounded bg-muted animate-pulse" />
                <div className="h-6 w-16 rounded bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cross-city links skeleton */}
      <div className="border-t pt-6 space-y-2">
        <div className="h-5 w-48 rounded bg-muted animate-pulse" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-28 rounded bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
