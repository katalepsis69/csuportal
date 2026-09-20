'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[100dvh] flex-1 items-center justify-center p-4 sm:p-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs max-w-md text-center">
        <h1 className="text-lg font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.digest
            ? `Unexpected error (ref: ${error.digest}). Try again — if it keeps happening, contact the admin.`
            : 'Unexpected error. Try again — if it keeps happening, contact the admin.'}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-xs min-h-[44px]"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
