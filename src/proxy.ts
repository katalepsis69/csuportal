import { type NextRequest } from 'next/server';
import { refreshSession } from '@/lib/supabase/middleware';

// Next.js 16 "proxy" convention (formerly middleware).
// Session refresh only — auth + role guards live in route layouts.
export async function proxy(request: NextRequest) {
  return await refreshSession(request);
}

export const config = {
  matcher: [
    // everything except cron (secret-authed), next internals, static files
    '/((?!api/cron|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
