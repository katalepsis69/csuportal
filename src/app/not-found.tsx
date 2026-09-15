import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-1 items-center justify-center p-6">
      <div className="card max-w-md text-center">
        <h1 className="text-lg font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-cream-muted">
          The page you are looking for does not exist or you do not have access to it.
        </p>
        <Link href="/" className="btn mt-4 inline-flex">
          Go home
        </Link>
      </div>
    </main>
  );
}
