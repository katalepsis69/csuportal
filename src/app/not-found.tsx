import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-1 items-center justify-center p-4 sm:p-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs max-w-md text-center">
        <h1 className="text-lg font-semibold text-foreground">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you are looking for does not exist or you do not have access to it.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-xs min-h-[44px]"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
