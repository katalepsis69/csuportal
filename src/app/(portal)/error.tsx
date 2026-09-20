'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected client-side exceptions for telemetry
    console.error('Portal error captured:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-xs max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive border border-destructive/20 mx-auto flex items-center justify-center">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">Something went wrong</h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {error.digest
              ? `An unexpected system error occurred (Reference: ${error.digest}). Try refreshing the section or contact the portal administrator if the issue persists.`
              : 'An unexpected system error occurred. Please try reloading the view.'}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-xs min-h-[40px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted shadow-xs min-h-[40px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
