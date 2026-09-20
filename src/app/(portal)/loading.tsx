export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-7 w-56 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-8 w-14 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="card h-64 animate-pulse" />
    </div>
  );
}
