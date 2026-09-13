'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center p-6">
      <div className="card max-w-md text-center">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-cream-muted">
          {error.digest
            ? `Unexpected error (ref: ${error.digest}). Try again — if it keeps happening, contact the admin.`
            : 'Unexpected error. Try again — if it keeps happening, contact the admin.'}
        </p>
        <button type="button" onClick={reset} className="btn mt-4">
          Try again
        </button>
      </div>
    </main>
  );
}
