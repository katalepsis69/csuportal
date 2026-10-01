import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function safeNext(next: string | null): string {
  // same-origin relative path only: must start with a single '/'
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) console.error('[auth/callback] code exchange failed:', error.message);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
